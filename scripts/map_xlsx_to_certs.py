#!/usr/bin/env python3
"""Match the 57 xlsx sheets to the 110 existing certifications by fuzzy title.

Output: scripts/cert_mapping.json  with three lists:
  matched:    [{sheet_name, existing_name, confidence}]
  ambiguous:  [{sheet_name, top_candidates: [{name, score}...]}]
  unmatched:  [sheet_name]
"""

from __future__ import annotations

import json
import re
from difflib import SequenceMatcher
from pathlib import Path


def load_existing_certs(path: str) -> list[str]:
    text = Path(path).read_text()
    # Be tolerant of escaped quotes in single-quoted JS strings.
    names: list[str] = []
    for m in re.finditer(r"name:\s*'((?:[^'\\]|\\.)*)'", text):
        names.append(m.group(1).replace("\\'", "'"))
    return names


KEEP = re.compile(r"[A-Za-z0-9]+")
PUNCT = re.compile(r"[^a-z0-9 ]")


def canonicalize(name: str) -> str:
    s = re.sub(r"^\d+\.?\s*", "", name)          # strip leading "62." order prefix
    s = s.lower()
    s = re.sub(r"\b(certified|certification|specialist|board|therapy|cert|spec)\b", " ", s)
    s = PUNCT.sub(" ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def token_set(name: str) -> set[str]:
    return {w for w in canonicalize(name).split() if len(w) > 2}


def score(sheet: str, cert: str) -> float:
    a = canonicalize(sheet)
    b = canonicalize(cert)
    if not a or not b:
        return 0.0
    seq = SequenceMatcher(None, a, b).ratio()
    tok_a, tok_b = token_set(sheet), token_set(cert)
    jacc = len(tok_a & tok_b) / max(1, len(tok_a | tok_b))
    contains = 1.0 if (a in b or b in a) else 0.0
    return 0.45 * seq + 0.35 * jacc + 0.20 * contains


def main() -> None:
    existing = load_existing_certs("/Users/danielgreen/il-ce-tracker/src/utils/certificationData.js")
    if len(existing) != 110:
        print(f"WARNING: expected 110 existing certs, got {len(existing)}")

    parsed = json.loads(Path("/Users/danielgreen/il-ce-tracker/scripts/citations_normalized.json").read_text())
    sheet_names = [c["sheet_name"] for c in parsed["certifications"]]

    matched: list[dict] = []
    ambiguous: list[dict] = []
    unmatched: list[str] = []
    used_cert_names: set[str] = set()

    for sheet in sheet_names:
        scored = sorted(
            ((cert, score(sheet, cert)) for cert in existing),
            key=lambda x: x[1],
            reverse=True,
        )
        top1, top2 = scored[0], scored[1]
        if top1[1] >= 0.55 and (top1[1] - top2[1]) >= 0.10:
            matched.append({
                "sheet_name": sheet,
                "existing_name": top1[0],
                "confidence": round(top1[1], 3),
            })
            used_cert_names.add(top1[0])
        elif top1[1] >= 0.40:
            ambiguous.append({
                "sheet_name": sheet,
                "top_candidates": [{"name": n, "score": round(s, 3)} for n, s in scored[:4]],
            })
        else:
            unmatched.append(sheet)

    out = {
        "summary": {
            "total_sheets": len(sheet_names),
            "matched": len(matched),
            "ambiguous": len(ambiguous),
            "unmatched": len(unmatched),
            "existing_certs_with_no_sheet": len(set(existing) - used_cert_names),
        },
        "matched": matched,
        "ambiguous": ambiguous,
        "unmatched": unmatched,
        "existing_certs_without_a_sheet": sorted(set(existing) - used_cert_names),
    }
    out_path = Path("/Users/danielgreen/il-ce-tracker/scripts/cert_mapping.json")
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2))
    print(json.dumps(out["summary"], indent=2))
    print(f"\nwrote {out_path}")

    if ambiguous:
        print("\nambiguous:")
        for a in ambiguous:
            print(f"  {a['sheet_name']}")
            for c in a["top_candidates"][:3]:
                print(f"    → {c['score']:.2f} {c['name']}")
    if unmatched:
        print(f"\nunmatched ({len(unmatched)}):")
        for u in unmatched:
            print(f"  {u}")


if __name__ == "__main__":
    main()
