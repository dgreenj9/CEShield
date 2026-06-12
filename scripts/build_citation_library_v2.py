#!/usr/bin/env python3
"""Rebuild the unified citation library with BOTH librarian batches.

Inputs:
  - scripts/citations_normalized.json          (March 2026 batch, 57 certs)
  - scripts/cert_mapping_final.json
  - scripts/citations_normalized_dec2025.json  (December 2025 batch, 53 certs)
  - scripts/cert_mapping_dec2025.json
  - src/utils/citationsDataFinal.js            (legacy hand-curated — kept ONLY
                                                if neither librarian batch
                                                covered the cert)

Output:
  - src/data/citations.json — single source of truth, with provenance.

Citation schema (per cert):
  {
    "source": "librarian-mar-2026" | "librarian-dec-2025" | "merged-librarian" | "legacy" | "none",
    "last_reviewed": "YYYY-MM",
    "citations": [...]
  }
"""

from __future__ import annotations
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from build_citation_library import load_legacy, normalize_legacy_citation  # reuse

ROOT = Path("/Users/danielgreen/il-ce-tracker")


def main() -> None:
    march = json.loads((ROOT / "scripts/citations_normalized.json").read_text())
    march_map = json.loads((ROOT / "scripts/cert_mapping_final.json").read_text())
    dec = json.loads((ROOT / "scripts/citations_normalized_dec2025.json").read_text())
    dec_map = json.loads((ROOT / "scripts/cert_mapping_dec2025.json").read_text())
    legacy = load_legacy()

    march_sheet_to_cert: dict[str, str] = march_map["sheet_to_cert"]
    dec_sheet_to_cert: dict[str, str] = dec_map["sheet_to_cert"]

    by_cert_name_march: dict[str, list[dict]] = {}
    by_cert_name_dec: dict[str, list[dict]] = {}
    for c in march["certifications"]:
        target = march_sheet_to_cert.get(c["sheet_name"])
        if target:
            by_cert_name_march.setdefault(target, []).extend(c["citations"])
    for c in dec["certifications"]:
        target = dec_sheet_to_cert.get(c["sheet_name"])
        if target:
            by_cert_name_dec.setdefault(target, []).extend(c["citations"])

    def dedupe(citations: list[dict]) -> list[dict]:
        """Drop duplicates by (doi || pmid || title)."""
        seen: set[str] = set()
        out: list[dict] = []
        for cit in citations:
            key = (cit.get("doi") or cit.get("pmid") or cit.get("title") or "").strip().lower()
            if not key or key in seen:
                continue
            seen.add(key)
            out.append(cit)
        return out

    # Walk every existing cert and pick the best available source.
    js = (ROOT / "src/utils/certificationData.js").read_text()
    all_existing = []
    for m in re.finditer(r"name:\s*'((?:[^'\\]|\\.)*)'", js):
        all_existing.append(m.group(1).replace("\\'", "'"))

    library: dict[str, dict] = {}
    counts = {"march": 0, "dec": 0, "merged": 0, "legacy": 0, "none": 0}

    for name in all_existing:
        mar_cites = by_cert_name_march.get(name, [])
        dec_cites = by_cert_name_dec.get(name, [])

        if mar_cites and dec_cites:
            merged = dedupe(mar_cites + dec_cites)
            library[name] = {
                "source": "merged-librarian",
                "last_reviewed": "2026-03",
                "citations": merged,
            }
            counts["merged"] += 1
        elif mar_cites:
            library[name] = {
                "source": "librarian",
                "last_reviewed": "2026-03",
                "citations": dedupe(mar_cites),
            }
            counts["march"] += 1
        elif dec_cites:
            library[name] = {
                "source": "librarian",
                "last_reviewed": "2025-12",
                "citations": dedupe(dec_cites),
            }
            counts["dec"] += 1
        elif name in legacy:
            library[name] = {
                "source": "legacy",
                "last_reviewed": None,
                "citations": [normalize_legacy_citation(c) for c in legacy[name]],
            }
            counts["legacy"] += 1
        else:
            library[name] = {"source": "none", "last_reviewed": None, "citations": []}
            counts["none"] += 1

    (ROOT / "src/data/citations.json").write_text(
        json.dumps(library, ensure_ascii=False, indent=2)
    )

    total_citations = sum(len(v["citations"]) for v in library.values())
    print(f"certs total            : {len(library)}")
    print(f"  March-only librarian : {counts['march']}")
    print(f"  Dec-only librarian   : {counts['dec']}")
    print(f"  Merged (both batches): {counts['merged']}")
    print(f"  Legacy fallback      : {counts['legacy']}")
    print(f"  No evidence          : {counts['none']}")
    print(f"total citations        : {total_citations}")


if __name__ == "__main__":
    main()
