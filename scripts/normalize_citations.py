#!/usr/bin/env python3
"""Normalize the parsed xlsx into a clean citations DB keyed by certification.

Output schema:
{
  "certifications": [
    {
      "sheet_name": "62. Lymphedema Certification",
      "order_num": 62,
      "title": "Lymphedema Certification",
      "citation_count": 101,
      "citations": [
        {
          "authors": "A. Akgul; ...",
          "year": 2025,
          "title": "...",
          "journal": "Support Care Cancer",
          "volume": "33",
          "issue": "5",
          "pages": "375",
          "doi": "10.1007/s00520-025-09436-3",
          "pmid": "40214771",
          "url": "https://...",
          "library_link": "https://libkey.io/...",
          "evidence_type": "rct" | "systematic_review" | "meta_analysis" | "cohort"
                          | "case_series" | "narrative" | "protocol" | "unknown"
        }, ...
      ]
    }, ...
  ],
  "stats": { ... }
}
"""

from __future__ import annotations

import json
import re
from pathlib import Path

HEADERS_EXPECTED = {
    "author": 0, "year": 1, "title": 2, "journal": 3,
    "volume": 4, "issue": 5, "pages": 6, "doi": 7,
    "pmid": 8, "url": 9, "library_link": 10,
}

EVIDENCE_PATTERNS = [
    ("meta_analysis", re.compile(r"\bmeta[- ]?anal", re.I)),
    ("systematic_review", re.compile(r"\bsystematic review\b|\bscoping review\b|\bumbrella review\b", re.I)),
    ("rct", re.compile(r"\brandomi[sz]ed\b|\brandomi[sz]ed controlled\b|\brct\b", re.I)),
    ("protocol", re.compile(r"\bprotocol\b(?!.*\bguideline\b)", re.I)),
    ("guideline", re.compile(r"\bclinical practice guideline\b|\bconsensus statement\b|\brecommendation\b", re.I)),
    ("cohort", re.compile(r"\bcohort\b|\bprospective\b|\blongitudinal\b", re.I)),
    ("case_control", re.compile(r"\bcase[- ]control\b", re.I)),
    ("cross_sectional", re.compile(r"\bcross[- ]sectional\b|\bsurvey\b", re.I)),
    ("case_series", re.compile(r"\bcase series\b|\bcase report\b|\bcase stud", re.I)),
    ("narrative", re.compile(r"\bnarrative review\b|\bliterature review\b|\boverview\b|\bperspective\b", re.I)),
    ("qualitative", re.compile(r"\bqualitative\b|\binterview stud", re.I)),
    ("pilot", re.compile(r"\bpilot stud|\bfeasibility\b", re.I)),
]


def classify_evidence(title: str) -> str:
    if not title:
        return "unknown"
    for label, pat in EVIDENCE_PATTERNS:
        if pat.search(title):
            return label
    return "unknown"


def parse_year(raw: str) -> int | None:
    if not raw:
        return None
    m = re.search(r"\d{4}", str(raw))
    return int(m.group(0)) if m else None


def normalize_sheet_name(sheet_name: str) -> tuple[int | None, str]:
    """'62. Lymphedema Certification' → (62, 'Lymphedema Certification')."""
    s = sheet_name.strip()
    m = re.match(r"(\d+)\.?\s*(.*)", s)
    if not m:
        return None, s
    return int(m.group(1)), m.group(2).strip()


def is_header_row(row: list[str]) -> bool:
    """Detect header rows: real ('Author', 'Year', ...) or junk ('Column1', ...)."""
    if not row:
        return False
    head = " ".join(str(c).lower() for c in row[:5])
    if "author" in head and "year" in head and "title" in head:
        return True
    if re.search(r"column\d+\s+column\d+", head):
        return True
    return False


def normalize_citations(parsed_path: str, out_path: str) -> None:
    data = json.loads(Path(parsed_path).read_text())
    certs: list[dict] = []
    total_citations = 0
    skipped_empty = 0

    for sheet_name, sheet in data.items():
        order, title = normalize_sheet_name(sheet_name)
        rows = sheet["rows"]
        citations: list[dict] = []
        for row in rows:
            if not row or all(not str(c).strip() for c in row):
                continue
            if is_header_row(row):
                continue
            # row is a list; pad short rows
            def cell(idx: int) -> str:
                if idx < len(row) and row[idx]:
                    return str(row[idx]).strip()
                return ""

            title_cell = cell(HEADERS_EXPECTED["title"])
            author_cell = cell(HEADERS_EXPECTED["author"])
            if not title_cell and not author_cell:
                # not a citation row
                continue
            citation = {
                "authors": author_cell,
                "year": parse_year(cell(HEADERS_EXPECTED["year"])),
                "title": title_cell,
                "journal": cell(HEADERS_EXPECTED["journal"]),
                "volume": cell(HEADERS_EXPECTED["volume"]),
                "issue": cell(HEADERS_EXPECTED["issue"]),
                "pages": cell(HEADERS_EXPECTED["pages"]),
                "doi": cell(HEADERS_EXPECTED["doi"]),
                "pmid": cell(HEADERS_EXPECTED["pmid"]),
                "url": cell(HEADERS_EXPECTED["url"]),
                "library_link": cell(HEADERS_EXPECTED["library_link"]),
                "evidence_type": classify_evidence(title_cell),
            }
            citations.append(citation)

        if not citations:
            skipped_empty += 1
            print(f"  (empty) {sheet_name}")
            continue

        certs.append({
            "sheet_name": sheet_name,
            "order_num": order,
            "title": title,
            "citation_count": len(citations),
            "citations": citations,
        })
        total_citations += len(citations)

    # Aggregate stats
    from collections import Counter
    evidence_counts: Counter[str] = Counter()
    year_counts: Counter[int] = Counter()
    for c in certs:
        for cit in c["citations"]:
            evidence_counts[cit["evidence_type"]] += 1
            if cit["year"]:
                year_counts[cit["year"]] += 1

    out = {
        "certifications": certs,
        "stats": {
            "total_certifications_with_citations": len(certs),
            "total_citations": total_citations,
            "empty_sheets_skipped": skipped_empty,
            "evidence_type_distribution": dict(evidence_counts.most_common()),
            "year_distribution": dict(sorted(year_counts.items(), reverse=True)),
        },
    }
    Path(out_path).write_text(json.dumps(out, ensure_ascii=False, indent=2))
    print(f"\nwrote {out_path}")
    print(f"  certifications with citations: {len(certs)}")
    print(f"  total citations: {total_citations}")
    print(f"  empty sheets skipped: {skipped_empty}")
    print(f"  evidence distribution: {dict(evidence_counts.most_common())}")


if __name__ == "__main__":
    normalize_citations(
        "/Users/danielgreen/il-ce-tracker/scripts/consolidated_green.json",
        "/Users/danielgreen/il-ce-tracker/scripts/citations_normalized.json",
    )
