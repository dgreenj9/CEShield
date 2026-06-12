#!/usr/bin/env python3
"""Apply manual overrides to the fuzzy-match result and produce the canonical
sheet -> existing cert name mapping that the citation enricher consumes.
"""

from __future__ import annotations
import json
from pathlib import Path

MANUAL_OVERRIDES = {
    # ambiguous (top candidate is right; just below confidence threshold)
    "58. Pediatric Clinical Speciali": "Pediatric Clinical Specialist (PCS)",
    "58. Board Certification Pediatr": "Board Certification in Pediatrics",
    "69. Craniosacral Therapy_Upled": "Craniosacral Therapy/Upledger",
    "77.Geriatric Clinical Speciali ": "Geriatric Clinical Specialist (GCS)",
    "77.Neurologic Clinical Speciali": "Neurologic Clinical Specialist (NCS)",
    "85.Clinical Doctorate vs Master": "Clinical Doctorate (DPT/OTD) vs Masters",
    "108. Kinesio Taping Certificati": "Kinesio Taping (CKTP)",
    # the fuzzy matcher picked "Specialty" over "Board" — fix
    "81. AOTA Board Cert": "AOTA Board Certifications (Physical Rehab)",
    # unmatched
    "50. Certified Strength and Cond": "Certified Strength & Conditioning (CSCS)",
    "77. CEEAA": "Certified Exercise Expert for Aging Adults",
    "81. AOTA Speciality": "AOTA Specialty Certifications",
}


def main() -> None:
    auto = json.loads(Path("/Users/danielgreen/il-ce-tracker/scripts/cert_mapping.json").read_text())
    final: dict[str, str] = {}
    for m in auto["matched"]:
        final[m["sheet_name"]] = m["existing_name"]
    for sheet, cert in MANUAL_OVERRIDES.items():
        final[sheet] = cert

    # Sanity check: every sheet must be mapped
    citations = json.loads(Path("/Users/danielgreen/il-ce-tracker/scripts/citations_normalized.json").read_text())
    sheet_names = {c["sheet_name"] for c in citations["certifications"]}
    missing = sheet_names - set(final.keys())
    if missing:
        print("STILL UNMAPPED:", missing)
        return

    # Sanity check: every target must exist in certificationData.js.
    # Handle JS single-quoted strings with escaped apostrophes (Women\'s).
    import re
    cert_data = Path("/Users/danielgreen/il-ce-tracker/src/utils/certificationData.js").read_text()
    existing_names: set[str] = set()
    for m in re.finditer(r"name:\s*'((?:[^'\\]|\\.)*)'", cert_data):
        existing_names.add(m.group(1).replace("\\'", "'"))
    bad_targets = set(final.values()) - existing_names
    if bad_targets:
        print("TARGETS NOT IN certificationData.js:", bad_targets)
        return

    out = {
        "sheet_to_cert": final,
        "summary": {
            "total_mapped": len(final),
            "manual_overrides_applied": len(MANUAL_OVERRIDES),
            "existing_certs_without_a_sheet": sorted(existing_names - set(final.values())),
        },
    }
    Path("/Users/danielgreen/il-ce-tracker/scripts/cert_mapping_final.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2)
    )
    print(f"mapped: {len(final)} / 57")
    print(f"existing certs with NO sheet: {len(existing_names - set(final.values()))}")
    print("wrote cert_mapping_final.json")


if __name__ == "__main__":
    main()
