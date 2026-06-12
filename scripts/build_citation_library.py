#!/usr/bin/env python3
"""Build the unified citation library that the app consumes at runtime.

Inputs:
  - scripts/citations_normalized.json   (Advocate librarian curation, 2,395 cites)
  - scripts/cert_mapping_final.json     (sheet -> existing cert name)
  - src/utils/citationsDataFinal.js     (legacy hand-curated citations, kept
                                         for the 53 certs without a librarian sheet)

Output:
  - src/data/citations.json             (single source of truth)

Schema:
{
  "<cert name>": {
    "source": "librarian" | "legacy",
    "last_reviewed": "2026-03" | null,
    "citations": [
      {
        "authors": str, "year": int|null, "title": str, "journal": str,
        "volume": str, "issue": str, "pages": str,
        "doi": str, "pmid": str, "url": str, "library_link": str,
        "evidence_type": "rct|systematic_review|meta_analysis|cohort|...|unknown",
      }
    ]
  }
}
"""

from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path("/Users/danielgreen/il-ce-tracker")


def load_legacy() -> dict[str, list[dict]]:
    """Parse the legacy JS object literal."""
    js = (ROOT / "src/utils/citationsDataFinal.js").read_text()
    # Find each top-level key in citationsData = { "Name": [ ... ], "Name": [ ... ] }
    # Strategy: locate `export const citationsData = {`, walk to the closing brace
    # at depth 0, then evaluate each "Key": [ ... ] block.
    m = re.search(r"export const citationsData\s*=\s*\{", js)
    if not m:
        raise SystemExit("could not find citationsData export")
    start = m.end()
    depth = 1
    i = start
    while i < len(js) and depth > 0:
        ch = js[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
        i += 1
    body = js[start : i - 1]

    legacy: dict[str, list[dict]] = {}
    # Match: "key": [   ...   ],
    # We walk manually to handle nested brackets/braces and escaped quotes.
    j = 0
    while j < len(body):
        km = re.match(r'\s*"([^"]+)"\s*:\s*\[', body[j:])
        if not km:
            j += 1
            continue
        key = km.group(1)
        j_start = j + km.end()
        # walk to matching ]
        bracket_depth = 1
        k = j_start
        while k < len(body) and bracket_depth > 0:
            c = body[k]
            if c == "[":
                bracket_depth += 1
            elif c == "]":
                bracket_depth -= 1
            elif c == '"':
                # skip string
                k += 1
                while k < len(body) and body[k] != '"':
                    if body[k] == "\\":
                        k += 1
                    k += 1
            k += 1
        arr_body = body[j_start : k - 1]
        # parse each object in arr_body
        legacy[key] = parse_js_object_array(arr_body)
        # advance past optional comma
        j = k
        while j < len(body) and body[j] in " \t\n\r,":
            j += 1
    return legacy


def parse_js_object_array(s: str) -> list[dict]:
    """Parse a JS array body of object literals -> list of dicts. Each obj has
    simple key: value pairs where value is a string or number or null."""
    out: list[dict] = []
    i = 0
    while i < len(s):
        # skip ws/commas
        while i < len(s) and s[i] in " \t\n\r,":
            i += 1
        if i >= len(s):
            break
        if s[i] != "{":
            i += 1
            continue
        # find matching }
        depth = 1
        j = i + 1
        while j < len(s) and depth > 0:
            c = s[j]
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
            elif c == '"':
                j += 1
                while j < len(s) and s[j] != '"':
                    if s[j] == "\\":
                        j += 1
                    j += 1
            j += 1
        obj_body = s[i + 1 : j - 1]
        out.append(parse_js_object(obj_body))
        i = j
    return out


def parse_js_object(s: str) -> dict:
    """Parse 'key: "value", key2: 1999, key3: "x"' (JS-ish) into dict."""
    out: dict = {}
    for m in re.finditer(r'(\w+)\s*:\s*("(?:[^"\\]|\\.)*"|\d+|null|true|false)\s*,?', s):
        key = m.group(1)
        raw = m.group(2)
        if raw.startswith('"'):
            val = re.sub(r'\\(.)', r'\1', raw[1:-1])
        elif raw == "null":
            val = None
        elif raw in ("true", "false"):
            val = raw == "true"
        else:
            val = int(raw) if raw.isdigit() else raw
        out[key] = val
    return out


def normalize_legacy_citation(c: dict) -> dict:
    """Conform legacy fields to the unified schema."""
    evidence_map = {
        "RCT": "rct",
        "Systematic Review": "systematic_review",
        "Meta-analysis": "meta_analysis",
        "Meta-Analysis": "meta_analysis",
        "Guideline": "guideline",
        "Position Statement": "guideline",
        "Cohort Study": "cohort",
        "Economic Analysis": "narrative",
        "Practice Guideline": "guideline",
    }
    return {
        "authors": c.get("authors", "") or "",
        "year": c.get("year"),
        "title": c.get("title", "") or "",
        "journal": c.get("journal", "") or "",
        "volume": str(c.get("volume", "") or ""),
        "issue": str(c.get("issue", "") or ""),
        "pages": str(c.get("pages", "") or ""),
        "doi": c.get("doi", "") or "",
        "pmid": str(c.get("pubmedId") or c.get("pmid") or "") or "",
        "url": c.get("url", "") or "",
        "library_link": "",
        "evidence_type": evidence_map.get(c.get("type", ""), "unknown"),
    }


def main() -> None:
    librarian = json.loads((ROOT / "scripts/citations_normalized.json").read_text())
    mapping = json.loads((ROOT / "scripts/cert_mapping_final.json").read_text())
    sheet_to_cert: dict[str, str] = mapping["sheet_to_cert"]
    legacy = load_legacy()
    print(f"legacy keys: {len(legacy)}")

    by_cert_name: dict[str, list[dict]] = {}
    # Librarian citations indexed by canonical cert name
    for c in librarian["certifications"]:
        target = sheet_to_cert.get(c["sheet_name"])
        if not target:
            continue
        by_cert_name.setdefault(target, []).extend(c["citations"])

    library: dict[str, dict] = {}
    # Start with all 110 existing certs to ensure full coverage
    js = (ROOT / "src/utils/certificationData.js").read_text()
    all_existing = []
    for m in re.finditer(r"name:\s*'((?:[^'\\]|\\.)*)'", js):
        all_existing.append(m.group(1).replace("\\'", "'"))

    librarian_used = 0
    legacy_used = 0
    no_evidence = []

    for name in all_existing:
        if name in by_cert_name:
            library[name] = {
                "source": "librarian",
                "last_reviewed": "2026-03",
                "citations": by_cert_name[name],
            }
            librarian_used += 1
        elif name in legacy:
            library[name] = {
                "source": "legacy",
                "last_reviewed": None,
                "citations": [normalize_legacy_citation(c) for c in legacy[name]],
            }
            legacy_used += 1
        else:
            library[name] = {
                "source": "none",
                "last_reviewed": None,
                "citations": [],
            }
            no_evidence.append(name)

    out_dir = ROOT / "src/data"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "citations.json").write_text(json.dumps(library, ensure_ascii=False, indent=2))

    total_citations = sum(len(v["citations"]) for v in library.values())
    print(f"certs total           : {len(library)}")
    print(f"  with librarian data : {librarian_used}")
    print(f"  with legacy data    : {legacy_used}")
    print(f"  with NO evidence    : {len(no_evidence)}")
    print(f"total citations       : {total_citations}")
    print(f"wrote src/data/citations.json")
    if no_evidence:
        print("\ncerts WITHOUT any citations yet:")
        for n in no_evidence:
            print(f"  - {n}")


if __name__ == "__main__":
    main()
