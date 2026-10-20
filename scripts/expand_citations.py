#!/usr/bin/env python3
"""Repair, expand, and classify the per-credential citation library.

Every record this script writes comes from a PubMed (NCBI E-utilities) or
Crossref response fetched at run time. Nothing is written from memory.

Pipeline (run in order; each step is idempotent and re-runnable):

    python3 -I scripts/expand_citations.py repair     # 1. fix misaligned / mis-identified records
    python3 -I scripts/expand_citations.py search     # 2a. run curated queries -> review sheets
    python3 -I scripts/expand_citations.py add        # 2b. append accepted candidates
    python3 -I scripts/expand_citations.py classify   # 3. evidence_type for "unknown" records
    python3 -I scripts/expand_citations.py stats      # 4. rebuild citations_meta + siteStats
    python3 -I scripts/expand_citations.py report     #    print before/after numbers

Inputs (committed):
    scripts/literature/queries.json   per-slug PubMed queries + target count
    scripts/literature/rejects.json   per-slug PMIDs rejected on title/abstract review
Outputs:
    public/citations/<slug>.json, src/data/citations_meta.json, src/data/siteStats.json
    scripts/literature/log.json       repairs, removals, additions, classifications
    scripts/literature/candidates/    review sheets (title + design per candidate)

HTTP goes through curl (Python's urllib SSL is broken on the build machine).
Responses are cached under .cache/eutils/ (gitignored) so a re-run is
deterministic and offline. NCBI rate: one request per 0.4 s (< 3/s, no key).
"""

from __future__ import annotations

import difflib
import hashlib
import html
import json
import re
import subprocess
import sys
import time
import unicodedata
import urllib.parse
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CIT_DIR = ROOT / "public/citations"
META_PATH = ROOT / "src/data/citations_meta.json"
STATS_PATH = ROOT / "src/data/siteStats.json"
LIT_DIR = ROOT / "scripts/literature"
CAND_DIR = LIT_DIR / "candidates"
LOG_PATH = LIT_DIR / "log.json"
CACHE_DIR = ROOT / ".cache/eutils"

EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
TOOL = "ceshield"
EMAIL = "dgreen.j9@gmail.com"
MIN_INTERVAL = 0.4  # seconds between live requests
REVIEW_MONTH = "2026-10"

FIELDS = ["authors", "year", "title", "journal", "volume", "issue", "pages",
          "doi", "pmid", "url", "library_link", "evidence_type"]

DOI_RE = re.compile(r"10\.\d{4,9}/[^\s\"<>]+", re.I)

# ─────────────────────────────────────────────────────────────── HTTP ──

_last_call = [0.0]


def _curl(url: str, data: str | None = None) -> str:
    key = hashlib.sha1((url + "\n" + (data or "")).encode()).hexdigest()
    path = CACHE_DIR / key[:2] / key
    if path.exists():
        return path.read_text()
    wait = MIN_INTERVAL - (time.time() - _last_call[0])
    if wait > 0:
        time.sleep(wait)
    cmd = ["curl", "-sS", "--max-time", "90", "--retry", "4", "--retry-delay", "3",
           "-A", f"{TOOL}/1.0 (mailto:{EMAIL})"]
    if data is not None:
        cmd += ["--data-binary", "@-", "-H", "Content-Type: application/x-www-form-urlencoded"]
    cmd.append(url)
    for attempt in range(4):
        _last_call[0] = time.time()
        res = subprocess.run(cmd, input=(data or "").encode() if data is not None else None,
                             capture_output=True)
        body = res.stdout.decode("utf-8", "replace")
        transient = (res.returncode != 0 or '"error":"API rate limit' in body
                     or "<ERROR>" in body[:500] or not body.strip())
        if not transient:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(body)
            return body
        time.sleep(2 + attempt * 3)
    raise RuntimeError(f"fetch failed: {url} :: {res.stderr.decode()[:200]} {body[:200]}")


def eutil(endpoint: str, **params) -> str:
    params.update(tool=TOOL, email=EMAIL)
    body = urllib.parse.urlencode(params)
    return _curl(EUTILS + endpoint, data=body)


def esearch(term: str, retmax: int = 200, sort: str = "relevance") -> list[str]:
    raw = eutil("esearch.fcgi", db="pubmed", term=term, retmax=retmax, retmode="json", sort=sort)
    return json.loads(raw)["esearchresult"].get("idlist", [])


def crossref(doi: str) -> dict | None:
    url = "https://api.crossref.org/works/" + urllib.parse.quote(doi, safe="/") + f"?mailto={EMAIL}"
    try:
        raw = _curl(url)
    except RuntimeError:
        return None
    try:
        return json.loads(raw)["message"]
    except (ValueError, KeyError):
        return None

def loose_title_match(a: str, b: str, ya=None, yb=None) -> bool:
    """Same work, possibly mis-dated or with a paraphrased subtitle: the full
    title matches, or one title contains the other (>= 40 chars), at any year;
    or the main title (before ':') is a >= 40-char prefix of the other AND the
    years agree within 2 (a shared main title alone is too weak)."""
    if titles_match(a, b):
        return True
    na, nb = norm_title(a), norm_title(b)
    short, long_ = sorted((na, nb), key=len)
    if len(short) >= 40 and short in long_:
        return True
    main = norm_title(re.split(r"\s[—–-]\s|:", a)[0])
    years_ok = bool(ya and yb and abs(int(ya) - int(yb)) <= 2)
    return years_ok and len(main) >= 40 and nb.startswith(main)


def crossref_search(title: str, year=None, loose: bool = False) -> dict | None:
    """Crossref bibliographic search; returns a work only on a close title match."""
    q = urllib.parse.quote(title[:250])
    try:
        raw = _curl(f"https://api.crossref.org/works?query.bibliographic={q}&rows=5&mailto={EMAIL}")
        items = json.loads(raw)["message"]["items"]
    except (RuntimeError, ValueError, KeyError):
        return None
    for it in items:
        t = (it.get("title") or [""])[0]
        y = ((it.get("issued") or {}).get("date-parts") or [[None]])[0][0]
        if loose and loose_title_match(title, t, year, y):
            return it
        if titles_match(title, t) and (not year or not y or abs(int(y) - int(year)) <= 1):
            return it
    return None

# ─────────────────────────────────────────────────────── PubMed parse ──


def _text(el) -> str:
    return re.sub(r"\s+", " ", "".join(el.itertext())).strip() if el is not None else ""


def expand_pages(pg: str) -> str:
    m = re.fullmatch(r"([A-Za-z]?)(\d+)-([A-Za-z]?)(\d+)", pg or "")
    if not m:
        return pg or ""
    a, b = m.group(2), m.group(4)
    if len(b) < len(a):
        b = a[: len(a) - len(b)] + b
    return f"{m.group(1)}{a}-{m.group(3) or m.group(1)}{b}"


def clean_title(t: str) -> str:
    t = t.strip()
    if t.startswith("[") and t.endswith("].") or (t.startswith("[") and t.endswith("]")):
        t = t.strip("[]. ")
    return t[:-1] if t.endswith(".") else t


def parse_pubmed_xml(raw: str) -> dict[str, dict]:
    out: dict[str, dict] = {}
    root = ET.fromstring(raw)
    for art in root.findall("PubmedArticle"):
        mc = art.find("MedlineCitation")
        pmid = mc.findtext("PMID")
        a = mc.find("Article")
        j = a.find("Journal")
        ji = j.find("JournalIssue")
        pd = ji.find("PubDate")
        year = pd.findtext("Year") if pd is not None else None
        if not year and pd is not None:
            m = re.search(r"\d{4}", pd.findtext("MedlineDate") or "")
            year = m.group(0) if m else None
        if not year:
            ad = a.find("ArticleDate")
            year = ad.findtext("Year") if ad is not None else None
        authors = []
        for au in a.findall("AuthorList/Author"):
            if au.findtext("CollectiveName"):
                authors.append(au.findtext("CollectiveName").strip())
                continue
            last = au.findtext("LastName") or ""
            ini = au.findtext("Initials") or ""
            ini = " ".join(f"{c}." for c in ini if c.isalpha())
            authors.append(f"{ini} {last}".strip())
        doi = ""
        for aid in art.findall("PubmedData/ArticleIdList/ArticleId"):
            if aid.get("IdType") == "doi" and aid.text:
                doi = aid.text.strip()
        if not doi:
            for el in a.findall("ELocationID"):
                if el.get("EIdType") == "doi" and el.text:
                    doi = el.text.strip()
        pages = a.findtext("Pagination/MedlinePgn") or ""
        if not pages:
            for el in a.findall("ELocationID"):
                if el.get("EIdType") == "pii" and el.text and len(el.text) < 12:
                    pages = el.text.strip()
        out[pmid] = {
            "pmid": pmid,
            "title": clean_title(_text(a.find("ArticleTitle")) or _text(a.find("VernacularTitle"))),
            "authors": "; ".join(x for x in authors if x),
            "year": int(year) if year and year.isdigit() else None,
            "journal": (j.findtext("ISOAbbreviation") or j.findtext("Title") or "").strip(),
            "volume": (ji.findtext("Volume") or "").strip(),
            "issue": (ji.findtext("Issue") or "").strip(),
            "pages": expand_pages(pages.strip()),
            "doi": doi,
            "pubtypes": [_text(p) for p in a.findall("PublicationTypeList/PublicationType")],
            "abstract": " ".join(_text(t) for t in a.findall("Abstract/AbstractText")),
            "language": [x.text for x in a.findall("Language")],
            "mesh": [_text(m.find("DescriptorName")) for m in mc.findall("MeshHeadingList/MeshHeading")],
            "alt_titles": [],
        }
    # NCBI Bookshelf records (AHRQ/PCORI/NICE/USPSTF reports) come back as PubmedBookArticle.
    for art in root.findall("PubmedBookArticle"):
        bd = art.find("BookDocument")
        pmid = bd.findtext("PMID")
        book = bd.find("Book")
        year = book.findtext("PubDate/Year") if book is not None else None
        authors = []
        for au in bd.findall("AuthorList/Author") + (book.findall("AuthorList/Author") if book is not None else []):
            if au.findtext("CollectiveName"):
                authors.append(au.findtext("CollectiveName").strip())
                continue
            ini = " ".join(f"{c}." for c in (au.findtext("Initials") or "") if c.isalpha())
            authors.append(f"{ini} {au.findtext('LastName') or ''}".strip())
        book_title = _text(book.find("BookTitle")) if book is not None else ""
        coll = _text(book.find("CollectionTitle")) if book is not None else ""
        out[pmid] = {
            "pmid": pmid,
            "title": clean_title(_text(bd.find("ArticleTitle")) or book_title),
            "authors": "; ".join(dict.fromkeys(x for x in authors if x)),
            "year": int(year) if year and year.isdigit() else None,
            "journal": (book.findtext("Publisher/PublisherName") or "").strip() if book is not None else "",
            "volume": "", "issue": "", "pages": "", "doi": "",
            "pubtypes": [_text(p) for p in bd.findall("PublicationType")],
            "abstract": " ".join(_text(t) for t in bd.findall("Abstract/AbstractText")),
            "language": [x.text for x in bd.findall("Language")],
            "mesh": [],
            "alt_titles": [clean_title(t) for t in (book_title, coll) if t],
            "book": True,
        }
    return out


_pm_cache: dict[str, dict] = {}


def pubmed_records(pmids) -> dict[str, dict]:
    want = sorted({str(p) for p in pmids if p} - set(_pm_cache))
    for i in range(0, len(want), 200):
        chunk = want[i:i + 200]
        raw = eutil("efetch.fcgi", db="pubmed", id=",".join(chunk), retmode="xml")
        got = parse_pubmed_xml(raw)
        _pm_cache.update(got)
        for p in chunk:
            _pm_cache.setdefault(p, None)
    return {str(p): _pm_cache.get(str(p)) for p in pmids if p}


def pmids_for_dois(dois) -> dict[str, str]:
    """DOI (lowercased) -> PMID, resolved by esearch [doi] and verified via efetch."""
    dois = sorted({d.lower() for d in dois if d})
    found: dict[str, str] = {}
    for i in range(0, len(dois), 40):
        chunk = dois[i:i + 40]
        term = " OR ".join(f'"{d}"[doi]' for d in chunk)
        ids = esearch(term, retmax=200, sort="pub_date")
        recs = pubmed_records(ids)
        for pmid, r in recs.items():
            if r and r["doi"].lower() in chunk:
                found[r["doi"].lower()] = pmid
    return found


def pmid_for_title(title: str, year=None) -> str | None:
    q = re.sub(r"[^\w\s-]", " ", title)
    q = re.sub(r"\s+", " ", q).strip()
    if len(q) < 25:
        return None
    ids = esearch(f"{q}[ti]", retmax=5)
    recs = pubmed_records(ids)
    for pmid, r in recs.items():
        if r and titles_match(title, r["title"]) and (not year or not r["year"] or abs(r["year"] - int(year)) <= 1):
            return pmid
    return None

# ─────────────────────────────────────────────────────────── helpers ──


def norm_title(t: str) -> str:
    t = unicodedata.normalize("NFKD", html.unescape(t or "")).lower()
    t = re.sub(r"<[^>]+>", " ", t)
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


def titles_match(a: str, b: str) -> bool:
    na, nb = norm_title(a), norm_title(b)
    if not na or not nb:
        return False
    if na == nb:
        return True
    short, long_ = sorted((na, nb), key=len)
    if len(short) >= 30 and long_.startswith(short):
        return True
    return difflib.SequenceMatcher(None, na, nb).ratio() >= 0.88


def same_work(title: str, r: dict | None, year=None) -> bool:
    """Is PubMed record r the work an existing citation describes?

    Existing titles are sometimes abbreviated paraphrases of the indexed title
    ("... 2007 Update — AHA/AACVPR Scientific Statement"), so beyond a close
    title match we accept: the record's main title (before ':' or a dash) as
    a >= 25-char prefix, or >= 80% of its content words, when the year agrees.
    """
    if not r:
        return False
    cands = [r["title"]] + r.get("alt_titles", [])
    if any(titles_match(title, t) for t in cands):
        return True
    year_ok = not year or not r.get("year") or abs(int(r["year"]) - int(year)) <= 1
    if not year_ok:
        return False
    main = norm_title(re.split(r"\s[—–-]\s|:", title)[0])
    for t in cands:
        nt = norm_title(t)
        if len(main) >= 25 and nt.startswith(main):
            return True
        words = [w for w in norm_title(title).split() if len(w) > 3]
        tw = set(nt.split())
        if len(words) >= 5 and sum(w in tw for w in words) / len(words) >= 0.8:
            return True
    return False


def pubmed_url(pmid: str) -> str:
    return f"https://www.ncbi.nlm.nih.gov/pubmed/{pmid}"


def libkey(doi: str) -> str:
    return f"https://libkey.io/libraries/1712/{doi}" if doi else ""


def record_from_pubmed(r: dict, evidence_type: str) -> dict:
    return {
        "authors": r["authors"],
        "year": r["year"],
        "title": r["title"],
        "journal": r["journal"],
        "volume": r["volume"],
        "issue": r["issue"],
        "pages": r["pages"],
        "doi": r["doi"],
        "pmid": r["pmid"],
        "url": pubmed_url(r["pmid"]),
        "library_link": libkey(r["doi"]),
        "evidence_type": evidence_type,
    }


_STYLE: dict[str, bool] = {}  # slug -> file was pretty-printed (indent=2)


def load_file(slug: str) -> list[dict]:
    raw = (CIT_DIR / f"{slug}.json").read_text()
    _STYLE[slug] = raw.startswith("{\n")
    return json.loads(raw)["citations"]


def save_file(slug: str, cits: list[dict]) -> None:
    # Preserve each file's existing serialization so diffs show only real changes.
    if slug not in _STYLE:
        load_file(slug)
    indent = 2 if _STYLE[slug] else None
    (CIT_DIR / f"{slug}.json").write_text(json.dumps({"citations": cits}, ensure_ascii=False, indent=indent))


def all_slugs() -> list[str]:
    return sorted(p.stem for p in CIT_DIR.glob("*.json"))


def load_log() -> dict:
    if LOG_PATH.exists():
        return json.loads(LOG_PATH.read_text())
    return {}


def save_log(log: dict) -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    LOG_PATH.write_text(json.dumps(log, ensure_ascii=False, indent=1) + "\n")


def is_real_pmid(p: str) -> bool:
    # PMIDs are <= 8 digits (max ~4.2e7 in 2026); 9+ digits are EBSCO accession numbers.
    return bool(re.fullmatch(r"\d{1,8}", p or ""))

# ───────────────────────────────────────────────────── evidence types ──

TITLE_RULES = [
    ("protocol", re.compile(r"\bprotocol for\b|\bstudy protocol\b|\btrial protocol\b|\bprotocol of a\b|: (a )?protocol\b|\breview protocol\b", re.I)),
    ("meta_analysis", re.compile(r"\bmeta[- ]?anal|\bmeta[- ]?regression|\bnetwork meta", re.I)),
    ("systematic_review", re.compile(r"\bsystematic(al)? (literature )?review\b|\bscoping review\b|\bumbrella review\b|\brapid review\b|\bmapping review\b|\bintegrative review\b|\brealist review\b|\bevidence map", re.I)),
    ("guideline", re.compile(r"\bclinical practice guideline|\bpractice guideline|\bguidelines? (for|on)\b|\bconsensus statement\b|\bposition statement\b|\bexpert consensus\b|\bdelphi\b|\brecommendations (for|from|of|on)\b", re.I)),
    ("qualitative", re.compile(r"\bqualitative\b|\binterview stud|\bfocus groups?\b|\bphenomenolog|\bthematic analysis\b|\blived experience|\breflexive\b", re.I)),
    ("rct", re.compile(r"\brandomi[sz]ed\b(?!.*\bprotocol\b)|\brct\b|\bcluster[- ]randomi", re.I)),
    ("pilot", re.compile(r"\bpilot\b|\bfeasibility\b", re.I)),
    ("case_control", re.compile(r"\bcase[- ]control\b", re.I)),
    ("cohort", re.compile(r"\bcohort\b|\bprospective (study|observational|analysis)\b|\bretrospective\b|\blongitudinal\b|\bregistry\b", re.I)),
    ("cross_sectional", re.compile(r"\bcross[- ]sectional\b|\bsurvey\b|\bquestionnaire stud", re.I)),
    ("qualitative", re.compile(r"\bqualitative\b|\binterview stud|\bfocus groups?\b|\bphenomenolog|\bthematic analysis\b|\blived experience", re.I)),
    ("case_series", re.compile(r"\bcase series\b|\bcase reports?\b|\bcase stud(y|ies)\b", re.I)),
    ("narrative", re.compile(r"\bnarrative review\b|\bliterature review\b|\ba review\b|\breview of the literature\b|\bstate of the art\b|\bstate-of-the-art\b|\ban update\b|\boverview\b|\bperspective\b|\bcommentary\b|\bprimer\b", re.I)),
]

ABSTRACT_RULES = [
    ("protocol", re.compile(r"\b(this|the present|our) (study )?protocol (describes|outlines|details)|\bwill be randomi[sz]ed\b|\bwill be recruited\b", re.I)),
    ("meta_analysis", re.compile(r"\b(we|was|were) (conducted|performed|undertook|carried out) (a |an )?(systematic review (and|with) )?meta[- ]analys|\bpooled (analysis|estimate)s? (using|with) (a )?random[- ]effects", re.I)),
    ("systematic_review", re.compile(r"\bprisma\b|\bscoping review\b.*\b(arksey|jbi|joanna briggs)\b|\b(we|was|were) (conducted|performed|undertook|carried out) (a |an )?(systematic|scoping|umbrella) review", re.I)),
    ("rct", re.compile(r"\bwere randomi[sz]ed\b|\brandomly (assigned|allocated)\b|\bwere randomly\b|\brandomi[sz]ed (controlled|clinical) trial\b", re.I)),
    ("qualitative", re.compile(r"\bsemi[- ]structured interviews\b|\bthematic(ally)? analy|\bfocus groups? (were|was)\b|\binterpretative phenomenological", re.I)),
    ("cross_sectional", re.compile(r"\bcross[- ]sectional\b|\b(online|national|web-based) survey\b|\bsurvey (was|were) (distributed|administered|sent)\b", re.I)),
    ("cohort", re.compile(r"\b(retrospective|prospective) (cohort|observational|chart|review)\b|\bcohort study\b|\bdata (were|was) (extracted|obtained) from\b.*\b(registry|database)\b", re.I)),
    ("case_series", re.compile(r"\b(this|a) case (report|series)\b|\bwe (describe|present|report) (a|the) case\b|\bcase of an?\b", re.I)),
]

PUBTYPE_RULES = [
    ("protocol", {"Clinical Trial Protocol"}),
    ("meta_analysis", {"Meta-Analysis", "Network Meta-Analysis"}),
    ("systematic_review", {"Systematic Review", "Scoping Review"}),
    ("guideline", {"Practice Guideline", "Guideline", "Consensus Development Conference",
                   "Consensus Development Conference, NIH"}),
    ("rct", {"Randomized Controlled Trial", "Pragmatic Clinical Trial", "Equivalence Trial"}),
]


def classify(title: str, pm: dict | None) -> tuple[str, str]:
    """Return (evidence_type, basis). basis is pubtype|title|abstract|none."""
    pts = set(pm["pubtypes"]) if pm else set()
    title_label = next((lab for lab, rx in TITLE_RULES if rx.search(title or "")), None)
    # Protocol titles win over the RCT pubtype (PubMed tags some protocols as RCTs).
    if title_label == "protocol":
        return "protocol", "title"
    for label, types in PUBTYPE_RULES:
        if pts & types:
            if label == "rct" and "Equivalence Trial" in pts and "Randomized Controlled Trial" not in pts \
                    and not re.search(r"randomi", (title or "") + (pm or {}).get("abstract", ""), re.I):
                continue
            return label, "pubtype"
    if title_label:
        return title_label, "title"
    abstract = pm.get("abstract", "") if pm else ""
    if abstract:
        for label, rx in ABSTRACT_RULES:
            if rx.search(abstract):
                return label, "abstract"
    if "Case Reports" in pts:
        return "case_series", "pubtype"
    if pts & {"Observational Study", "Multicenter Study"} and re.search(r"\bcohort|longitudinal|prospective|retrospective|follow[- ]up\b", abstract, re.I):
        return "cohort", "pubtype+abstract"
    if pts & {"Clinical Trial", "Controlled Clinical Trial", "Clinical Trial, Phase I",
              "Clinical Trial, Phase II"} and re.search(r"\bpilot|feasibility\b", abstract, re.I):
        return "pilot", "pubtype+abstract"
    if "Review" in pts:
        return "narrative", "pubtype"
    return "unknown", "none"

# ──────────────────────────────────────────────────────────── 1. repair ──

PUBLISHER_RE = re.compile(r"(?i)^(?!.*\(.*\)).*(publish|press\b|elsevier|springer|wiley|taylor (&|and) francis|lippincott|\bltd\b|\binc\b\.?|\bllc\b|kluwer|biomed central|massage profession|risk management|association of america)")


def unescape_record(c: dict) -> bool:
    changed = False
    for k, v in list(c.items()):
        if isinstance(v, str):
            nv = html.unescape(v).strip()
            if nv != v:
                c[k] = nv
                changed = True
    return changed


def misaligned(c: dict) -> list[str]:
    flags = []
    d, p, u = str(c.get("doi") or ""), str(c.get("pmid") or ""), str(c.get("url") or "")
    if d and not d.lower().startswith("10."):
        flags.append("doi_not_doi")
    if p and not re.fullmatch(r"\d+", p):
        flags.append("pmid_not_numeric")
    if u and not u.startswith("http"):
        flags.append("url_not_url")
    if "\n" in d or "\n" in str(c.get("library_link") or ""):
        flags.append("multiline_id")
    return flags


def rebuild_from_crossref(c: dict, msg: dict) -> dict:
    authors = []
    for a in msg.get("author", []):
        given = a.get("given", "")
        ini = " ".join(f"{w[0]}." for w in re.split(r"[\s.-]+", given) if w)
        authors.append(f"{ini} {a.get('family', '')}".strip() if a.get("family") else a.get("name", ""))
    parts = (msg.get("published-print") or msg.get("published-online") or msg.get("issued") or {}).get("date-parts", [[None]])
    journal = (msg.get("short-container-title") or msg.get("container-title") or [""])[0]
    title = (msg.get("title") or [c.get("title", "")])[0]
    doi = msg.get("DOI", "")
    return {
        "authors": "; ".join(authors) or c.get("authors", ""),
        "year": parts[0][0] or c.get("year"),
        "title": clean_title(html.unescape(re.sub(r"<[^>]+>", "", title))),
        "journal": html.unescape(journal),
        "volume": msg.get("volume", ""),
        "issue": msg.get("issue", ""),
        "pages": msg.get("page", "") or msg.get("article-number", ""),
        "doi": doi,
        "pmid": "",
        "url": "",
        "library_link": libkey(doi),
        "evidence_type": c.get("evidence_type", "unknown"),
    }


def snapshot() -> dict:
    files = {s: load_file(s) for s in all_slugs()}
    ev = Counter(c.get("evidence_type") or "unknown" for v in files.values() for c in v)
    return {"total": sum(len(v) for v in files.values()), "files": len(files),
            "per_file": {k: len(v) for k, v in files.items()}, "evidence": dict(ev.most_common()),
            "rct_sr_ma": sum(ev[k] for k in ("rct", "systematic_review", "meta_analysis"))}


def cmd_repair() -> None:
    log = load_log()
    log.setdefault("before", snapshot())
    log["repair"] = {"realigned": [], "removed": [], "journal_fixed": [], "pmid_fixed": [],
                     "pmid_cleared": [], "doi_filled": [], "entities_unescaped": 0}
    R = log["repair"]
    files = {s: load_file(s) for s in all_slugs()}

    # Pass A: entity cleanup + misaligned rebuild.
    for slug, cits in files.items():
        keep = []
        for i, c in enumerate(cits):
            if unescape_record(c):
                R["entities_unescaped"] += 1
            flags = misaligned(c)
            if not flags:
                keep.append(c)
                continue
            blob = " ".join(str(c.get(k) or "") for k in ("doi", "pmid", "url", "library_link", "pages"))
            dois = [d.rstrip(".,;") for d in DOI_RE.findall(blob)]
            fixed = None
            for doi in dois:
                pm = pmids_for_dois([doi]).get(doi.lower())
                if pm:
                    r = pubmed_records([pm])[pm]
                    if same_work(c["title"], r, c.get("year")):
                        fixed = record_from_pubmed(r, c.get("evidence_type", "unknown"))
                        break
                msg = crossref(doi)
                if msg and titles_match(c["title"], (msg.get("title") or [""])[0]):
                    fixed = rebuild_from_crossref(c, msg)
                    break
            if fixed is None:
                # A bare number in url/pmid can be the record's own PMID (Bookshelf reports).
                ids = re.findall(r"\b\d{1,8}\b", " ".join(str(c.get(k) or "") for k in ("url", "pmid")))
                for cand in ids:
                    r = pubmed_records([cand])[cand]
                    if same_work(c["title"], r, c.get("year")):
                        fixed = record_from_pubmed(r, c.get("evidence_type", "unknown"))
                        break
            if fixed is None:
                msg = crossref_search(c["title"], c.get("year"))
                if msg:
                    fixed = rebuild_from_crossref(c, msg)
            if fixed is None and not dois:
                pm = pmid_for_title(c["title"], c.get("year"))
                if pm:
                    fixed = record_from_pubmed(pubmed_records([pm])[pm], c.get("evidence_type", "unknown"))
            entry = {"file": slug, "title": c["title"], "flags": flags,
                     "before": {k: c.get(k) for k in ("journal", "volume", "issue", "pages", "doi", "pmid", "url")}}
            if fixed:
                for extra in ("source_type", "what_it_says", "path"):
                    if extra in c:
                        fixed[extra] = c[extra]
                entry["after"] = {k: fixed.get(k) for k in ("journal", "volume", "issue", "pages", "doi", "pmid", "url")}
                R["realigned"].append(entry)
                keep.append(fixed)
            else:
                entry["reason"] = ("no DOI/PMID recoverable from the record and no PubMed title match"
                                   if not dois else "DOI did not resolve to a matching title")
                R["removed"].append(entry)
        files[slug] = keep

    # Pass B: verify every numeric pmid against PubMed by title.
    all_pmids = {str(c.get("pmid")) for cits in files.values() for c in cits if is_real_pmid(str(c.get("pmid") or ""))}
    pubmed_records(all_pmids)
    need_doi = set()
    for cits in files.values():
        for c in cits:
            p = str(c.get("pmid") or "")
            r = _pm_cache.get(p) if is_real_pmid(p) else None
            if not same_work(c["title"], r, c.get("year")) and str(c.get("doi") or "").startswith("10."):
                need_doi.add(c["doi"].lower())
    doi_map = pmids_for_dois(need_doi)

    for slug, cits in files.items():
        for c in cits:
            p = str(c.get("pmid") or "")
            r = _pm_cache.get(p) if is_real_pmid(p) else None
            ok = same_work(c["title"], r, c.get("year"))
            if not ok:
                d = str(c.get("doi") or "").lower()
                real = doi_map.get(d)
                if real and same_work(c["title"], _pm_cache[real], c.get("year")):
                    R["pmid_fixed"].append({"file": slug, "title": c["title"][:120], "from": p, "to": real})
                    if c.get("url", "").startswith("https://www.ncbi.nlm.nih.gov/pubmed/") or not c.get("url"):
                        c["url"] = pubmed_url(real)
                    c["pmid"] = real
                    r, ok = _pm_cache[real], True
                elif p:
                    R["pmid_cleared"].append({"file": slug, "title": c["title"][:120], "from": p,
                                              "why": "EBSCO accession number" if not is_real_pmid(p) else "PMID resolves to a different article"})
                    if c.get("url", "") == pubmed_url(p):
                        c["url"] = ""
                    c["pmid"] = ""
            if ok:
                if not c.get("doi") and r["doi"]:
                    c["doi"], c["library_link"] = r["doi"], c.get("library_link") or libkey(r["doi"])
                    R["doi_filled"].append({"file": slug, "pmid": r["pmid"], "doi": r["doi"]})
                if PUBLISHER_RE.search(c.get("journal") or "") and r["journal"]:
                    R["journal_fixed"].append({"file": slug, "pmid": r["pmid"], "from": c["journal"], "to": r["journal"]})
                    c["journal"] = r["journal"]
            elif PUBLISHER_RE.search(c.get("journal") or "") and str(c.get("doi") or "").startswith("10."):
                msg = crossref(c["doi"])
                if msg and titles_match(c["title"], (msg.get("title") or [""])[0]):
                    j = (msg.get("short-container-title") or msg.get("container-title") or [""])[0]
                    if j:
                        R["journal_fixed"].append({"file": slug, "doi": c["doi"], "from": c["journal"], "to": j})
                        c["journal"] = html.unescape(j)

    # Pass C: records still lacking a PMID and DOI: try an exact PubMed title match.
    for slug, cits in list(files.items()):
        keep = []
        for c in cits:
            keep.append(c)
            if not c.get("pmid") and not str(c.get("doi") or "").startswith("10."):
                pm = pmid_for_title(c["title"], c.get("year"))
                if pm:
                    r = _pm_cache[pm]
                    R["pmid_fixed"].append({"file": slug, "title": c["title"][:120], "from": "", "to": pm, "via": "title"})
                    c["pmid"] = pm
                    if not c.get("url"):
                        c["url"] = pubmed_url(pm)
                    if r["doi"]:
                        c["doi"] = r["doi"]
                        c["library_link"] = c.get("library_link") or libkey(r["doi"])
                    continue
                msg = crossref_search(c["title"], c.get("year"))
                if msg and msg.get("DOI"):
                    R["doi_filled"].append({"file": slug, "title": c["title"][:120], "doi": msg["DOI"], "via": "crossref title"})
                    c["doi"] = msg["DOI"]
                    c["library_link"] = c.get("library_link") or libkey(msg["DOI"])
                    if not c.get("journal"):
                        c["journal"] = html.unescape((msg.get("short-container-title") or msg.get("container-title") or [""])[0])
                    continue
                info = {"file": slug, "year": c.get("year"), "title": c["title"], "journal": c.get("journal", ""),
                        "source_type": c.get("source_type", ""), "url": c.get("url", "")}
                # Records from the 2026-06 workflow import that claim to be peer-reviewed but
                # carry no DOI, PMID, or link: rebuild from Crossref when the title is the
                # same work (often mis-dated), otherwise remove. Nothing on PubMed or
                # Crossref matches them, so they cannot be shown as literature.
                if c.get("source_type") == "peer-reviewed" and not str(c.get("url") or "").startswith("http"):
                    msg = crossref_search(c["title"], c.get("year"), loose=True)
                    if msg and msg.get("DOI"):
                        fixed = rebuild_from_crossref(c, msg)
                        pm = pmids_for_dois([fixed["doi"]]).get(fixed["doi"].lower())
                        if pm:
                            fixed = record_from_pubmed(_pm_cache[pm], c.get("evidence_type", "unknown"))
                        for extra in ("source_type", "what_it_says", "path"):
                            if extra in c:
                                fixed[extra] = c[extra]
                        info["after"] = {k: fixed.get(k) for k in ("year", "title", "journal", "doi", "pmid")}
                        R["realigned"].append(info | {"flags": ["no_identifier_rebuilt_from_title"]})
                        keep[-1] = fixed
                    else:
                        info["reason"] = "claims peer-reviewed; no DOI/PMID/link; no PubMed or Crossref record matches the title"
                        R["removed"].append(info)
                        keep.pop()
                    continue
                # Reports and society documents legitimately lack IDs: kept, but listed.
                R.setdefault("unverified", []).append(info)
        files[slug] = keep

    for slug, cits in files.items():
        save_file(slug, cits)
    save_log(log)
    print(f"realigned {len(R['realigned'])}, removed {len(R['removed'])}, journal fixed {len(R['journal_fixed'])}, "
          f"pmid fixed {len(R['pmid_fixed'])}, pmid cleared {len(R['pmid_cleared'])}, doi filled {len(R['doi_filled'])}, "
          f"entity-unescaped records {R['entities_unescaped']}")

# ──────────────────────────────────────────────────────────── 2. expand ──

OFFTOPIC_PUBTYPES = {"Comment", "Erratum", "Retraction of Publication", "Retracted Publication",
                     "Published Erratum", "News", "Newspaper Article", "Letter", "Editorial",
                     "Expression of Concern", "Preprint"}


def file_keys(cits: list[dict]) -> set[str]:
    keys = set()
    for c in cits:
        if c.get("pmid"):
            keys.add("pmid:" + str(c["pmid"]))
        if c.get("doi"):
            keys.add("doi:" + str(c["doi"]).lower())
        keys.add("ti:" + norm_title(c.get("title", "")))
    return keys


def expand_term(q: dict, macros: dict) -> str:
    term = q["term"]
    for _ in range(3):  # macros may reference macros
        term = re.sub(r"\{(\w+)\}", lambda m: macros.get(m.group(1), m.group(0)), term)
    years = q.get("years", "2015:2026")
    if years:
        term = f"({term}) AND {years}[dp]"
    return f"{term} AND english[la] AND hasabstract"


def cmd_search(only: set[str] | None = None) -> None:
    queries = json.loads((LIT_DIR / "queries.json").read_text())
    macros = queries.get("_macros", {})
    CAND_DIR.mkdir(parents=True, exist_ok=True)
    for slug, spec in queries.items():
        if slug.startswith("_") or (only and slug not in only):
            continue
        existing = file_keys(load_file(slug))
        seen, cands = set(), []
        for qi, q in enumerate(spec["queries"]):
            ids = esearch(expand_term(q, macros), retmax=q.get("retmax", 40))
            recs = pubmed_records(ids)
            for pmid in ids:
                r = recs.get(pmid)
                if not r or pmid in seen:
                    continue
                seen.add(pmid)
                why = None
                if set(r["pubtypes"]) & OFFTOPIC_PUBTYPES:
                    why = "pubtype:" + ",".join(sorted(set(r["pubtypes"]) & OFFTOPIC_PUBTYPES))
                elif not r["title"] or not r["year"] or not r["journal"]:
                    why = "incomplete record"
                elif "eng" not in r["language"]:
                    why = "non-English"
                elif {"pmid:" + pmid, "doi:" + r["doi"].lower(), "ti:" + norm_title(r["title"])} & existing:
                    why = "duplicate of existing"
                et, basis = classify(r["title"], r)
                cands.append({"pmid": pmid, "q": qi, "core": bool(q.get("core")), "year": r["year"], "type": et, "basis": basis,
                              "title": r["title"], "journal": r["journal"], "auto_reject": why})
        (CAND_DIR / f"{slug}.json").write_text(json.dumps(cands, ensure_ascii=False, indent=1) + "\n")
        ok = [c for c in cands if not c["auto_reject"]]
        print(f"{slug}: {len(cands)} hits, {len(ok)} eligible")


def cmd_add(dry: bool = False, only: set[str] | None = None) -> None:
    """Append accepted candidates. dry=True prints the would-be selection (for review)."""
    queries = json.loads((LIT_DIR / "queries.json").read_text())
    rejects = json.loads((LIT_DIR / "rejects.json").read_text())
    log = load_log()
    log.setdefault("added", {})
    for slug, spec in queries.items():
        if slug.startswith("_") or (only and slug not in only):
            continue
        cits = load_file(slug)
        keys = file_keys(cits)
        cands = json.loads((CAND_DIR / f"{slug}.json").read_text())
        rej = {str(k) for k in rejects.get(slug, {})} | {str(k) for k in rejects.get("_global", {})}
        target = spec.get("target", 40)
        cap = max(0, target - len(cits))
        recs = pubmed_records([c["pmid"] for c in cands])
        added = []
        # Selection: round-robin across the slug's queries so each facet (credential-
        # specific, guidelines, reviews, trials) is represented. Within a query,
        # "core" (credential-specific) hits keep PubMed relevance order; the rest
        # go strongest design first, then most recent.
        rank = {"guideline": 0, "meta_analysis": 1, "systematic_review": 2, "rct": 3, "cohort": 4,
                "cross_sectional": 5, "pilot": 5, "case_control": 5, "qualitative": 6, "narrative": 7,
                "unknown": 7, "case_series": 8, "protocol": 9}
        by_q: dict[int, list] = defaultdict(list)
        for c in cands:
            if not c["auto_reject"] and c["pmid"] not in rej:
                by_q[c["q"]].append(c)
        for qi, lst in by_q.items():
            if not lst[0].get("core"):
                lst.sort(key=lambda c: (rank.get(c["type"], 9), -c["year"]))
        ordered, queues = [], [list(by_q[q]) for q in sorted(by_q)]
        while any(queues):
            for qu in queues:
                if qu:
                    ordered.append(qu.pop(0))
        for c in ordered:
            if len(added) >= cap:
                break
            r = recs[c["pmid"]]
            k = {"pmid:" + r["pmid"], "doi:" + r["doi"].lower(), "ti:" + norm_title(r["title"])} - {"doi:"}
            if k & keys:
                continue
            et, _ = classify(r["title"], r)
            rec = record_from_pubmed(r, et)
            cits.append(rec)
            keys |= k
            added.append({"pmid": r["pmid"], "doi": r["doi"], "type": et, "year": r["year"], "title": r["title"]})
            if dry:
                print(f"  {r['pmid']}\t{et[:6]}\t{r['year']}\t{r['title'][:150]} [{r['journal'][:25]}]")
        if dry:
            print(f"## {slug}: +{len(added)} -> {len(cits)} (of {len(ordered)} eligible)")
            continue
        save_file(slug, cits)
        # A re-run tops up to target and dedups, so it appends only what is new.
        log["added"][slug] = log["added"].get(slug, []) + added
        print(f"{slug}: +{len(added)} -> {len(cits)}")
    if not dry:
        save_log(log)

# ────────────────────────────────────────────────────────── 3. classify ──


def cmd_classify() -> None:
    log = load_log()
    files = {s: load_file(s) for s in all_slugs()}
    pmids = {str(c["pmid"]) for cits in files.values() for c in cits if is_real_pmid(str(c.get("pmid") or ""))}
    pubmed_records(pmids)
    counts, basis_counts, changes = Counter(), Counter(), []
    for slug, cits in files.items():
        for c in cits:
            if c.get("evidence_type") not in (None, "", "unknown"):
                continue
            pm = _pm_cache.get(str(c.get("pmid") or ""))
            if pm and not same_work(c["title"], pm, c.get("year")):
                pm = None
            et, basis = classify(c.get("title", ""), pm)
            c["evidence_type"] = et
            counts[et] += 1
            basis_counts[basis] += 1
            if et != "unknown":
                changes.append({"file": slug, "pmid": c.get("pmid", ""), "type": et, "basis": basis,
                                "title": c.get("title", "")[:140]})
    for slug, cits in files.items():
        save_file(slug, cits)
    log["classify"] = {"result_counts": dict(counts.most_common()), "basis_counts": dict(basis_counts),
                       "changes": changes}
    save_log(log)
    print("classified:", dict(counts.most_common()), dict(basis_counts))

# ───────────────────────────────────────────────────────────── 4. stats ──

HIGH = ("rct", "systematic_review", "meta_analysis")


def cmd_stats() -> None:
    meta = json.loads(META_PATH.read_text())
    log = load_log()
    expanded = {s for s, a in log.get("added", {}).items() if a}
    total = hq = 0
    for name, entry in meta.items():
        cits = load_file(entry["slug"])
        mix, years = Counter(), Counter()
        for c in cits:
            mix[c.get("evidence_type") or "unknown"] += 1
            y = c.get("year")
            if isinstance(y, int) and 1980 <= y <= 2030:
                years[y] += 1
        entry["count"] = len(cits)
        entry["evidence_mix"] = dict(mix.most_common())
        entry["year_dist"] = {str(y): n for y, n in sorted(years.items())}
        if entry["slug"] in expanded:
            # Added records were retrieved by script, not reviewed by a librarian:
            # the "Librarian-reviewed" badge must not claim them.
            if entry.get("source") == "librarian":
                entry["source"] = "librarian+eutils-2026-10"
            elif not str(entry.get("source", "")).endswith("eutils-2026-10"):
                entry["source"] = f"{entry.get('source', 'none')}+eutils-2026-10"
            entry["last_reviewed"] = REVIEW_MONTH
        total += len(cits)
        hq += sum(mix[k] for k in HIGH)
    META_PATH.write_text(json.dumps(meta, ensure_ascii=False, indent=2))
    stats = json.loads(STATS_PATH.read_text())
    stats["certCount"] = len(meta)
    stats["citationTotal"] = total
    stats["rctSrMa"] = hq
    STATS_PATH.write_text(json.dumps(stats, indent=2) + "\n")
    print("siteStats:", stats)


def cmd_report() -> None:
    files = {s: load_file(s) for s in all_slugs()}
    ev = Counter(c.get("evidence_type") for cits in files.values() for c in cits)
    sizes = sorted((len(v), k) for k, v in files.items())
    print("total", sum(n for n, _ in sizes), "files", len(sizes))
    print("evidence", dict(ev.most_common()))
    print("under 25:", [(n, k) for n, k in sizes if n < 25])


if __name__ == "__main__":
    cmds = {"repair": cmd_repair, "search": cmd_search, "add": cmd_add,
            "classify": cmd_classify, "stats": cmd_stats, "report": cmd_report}
    if len(sys.argv) < 2 or sys.argv[1] not in cmds:
        sys.exit(f"usage: {sys.argv[0]} {{{'|'.join(cmds)}}}")
    if sys.argv[1] == "search" and len(sys.argv) > 2:
        cmd_search(set(sys.argv[2:]))
    elif sys.argv[1] == "add" and len(sys.argv) > 2:
        args = sys.argv[2:]
        cmd_add(dry="--dry" in args, only={a for a in args if a != "--dry"} or None)
    else:
        cmds[sys.argv[1]]()
