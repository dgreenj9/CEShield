#!/usr/bin/env python3
"""Map the December 2025 librarian sheets to existing certifications.

These 53 sheets correspond to the 53 'legacy' certs that the March 2026 batch
didn't cover. Adds them to the canonical mapping.
"""

from __future__ import annotations
import json
import re
import sys
from pathlib import Path
from difflib import SequenceMatcher

sys.path.insert(0, str(Path(__file__).parent))
from map_xlsx_to_certs import load_existing_certs, score  # reuse

ROOT = Path("/Users/danielgreen/il-ce-tracker")

# Manual overrides — verified by hand from the sheet titles. The fuzzy matcher
# gets most right; these are the abbreviations / truncations / ambiguities.
MANUAL_OVERRIDES = {
    "2. LSVT LOUD Certification": "LSVT LOUD",
    "2. Ergonomic Assessment ": "Ergonomic Assessment",
    "3. ACRM Cognitive rehabilitatio": "ACRM Cognitive Rehabilitation",
    "5. HABIT HABIT-ILE Program": "HABIT/HABIT-ILE",
    "6. MBSR (Mindfulness-Based...)": "MBSR (Mindfulness-Based Stress Reduction)",
    "7. Matter of Balance Certificat": "Matter of Balance",
    "8. Telehealth Cardiac_pulmonary": "Telehealth Cardiac/Pulmonary",
    "10. Pulmonary Rehab Program": "Pulmonary Rehabilitation",
    "11. CIMT": "CIMT (Constraint-Induced Movement)",
    "14. STEADI": "CDC STEADI Fall Prevention",
    "15. AACVPR Cardiac Rehab Cert": "AACVPR Cardiac Rehabilitation",
    "17 Physical Therapy Fellowship": "Physical Therapy Fellowship",
    "20. LSVT BIG Certification": "LSVT BIG",
    "22. Yoga": "IAYT Yoga Therapy",
    "26. Vestibular Rehab Training": "Vestibular Rehabilitation",
    "27. VR_Medical-Grade": "VR (Medical-Grade)",
    "28.NIDCAP Neonatal": "NIDCAP Neonatal",
    "29. Neonatal Therapy Cert": "Neonatal Therapy Certification",
    "35. McKenzie Method (MDT)": "McKenzie Method (MDT)",
    "35. COMT Manual Therapy Cert": "COMT/Manual Therapy Certification",
    "38.FCE_Functional Capacity Eval": "FCE (Functional Capacity Eval)",
    "39.Early Intervention Specialis": "Early Intervention Specialist",
    "39. Certified Hand Therapist": "Certified Hand Therapist (CHT)",
    "41.Multiple Sclerosis Certified": "Multiple Sclerosis Certified Specialist",
    "41. Orthopedic Clinical Special": "Orthopedic Clinical Specialist (OCS)",
    "41. BOC - Orthopedic Specialty": "BOC-Orthopedic Specialty",
    "43. NDT": "Neurodevelopmental Treatment (NDT)",
    "45.Sports Clinical Specialist (": "Sports Clinical Specialist (SCS)",
    "45. Telehealth_Digital Health": "Telehealth/Digital Health",
    "48.Certified Aging in Place Spe": "Certified Aging in Place Specialist (CAPS)",
    "49. ACSM Clinical exercise phys": "ACSM Clinical Exercise Physiologist",
    "50. Certified Brain Injury Spec": "Certified Brain Injury Specialist",
    "52. Certified Stroke Rehab Spec": "Certified Stroke Rehabilitation Specialist",
    "52. Hippotherapy Certification": "Hippotherapy",
    "52. Robotic Upper Limb Technolo": "Robotic Upper Limb",
    "60. Virtual-Augmented Reality": "Virtual/Augmented Reality",
}


def main() -> None:
    existing = load_existing_certs(str(ROOT / "src/utils/certificationData.js"))
    parsed = json.loads((ROOT / "scripts/citations_normalized_dec2025.json").read_text())
    sheet_names = [c["sheet_name"] for c in parsed["certifications"]]

    final: dict[str, str] = {}
    unresolved: list[str] = []

    for sheet in sheet_names:
        if sheet in MANUAL_OVERRIDES:
            final[sheet] = MANUAL_OVERRIDES[sheet]
            continue
        # Try fuzzy match
        scored = sorted(
            ((cert, score(sheet, cert)) for cert in existing),
            key=lambda x: x[1],
            reverse=True,
        )
        top1, top2 = scored[0], scored[1]
        if top1[1] >= 0.55 and (top1[1] - top2[1]) >= 0.10:
            final[sheet] = top1[0]
        else:
            unresolved.append((sheet, [(n, round(s, 2)) for n, s in scored[:3]]))

    if unresolved:
        print("UNRESOLVED:")
        for sheet, candidates in unresolved:
            print(f"  {sheet}")
            for n, s in candidates:
                print(f"    → {s} {n}")
        return

    # Sanity check: every target must exist in certificationData.js
    existing_set = set(existing)
    bad = [t for t in final.values() if t not in existing_set]
    if bad:
        print("TARGETS NOT FOUND:", bad)
        return

    out = {
        "sheet_to_cert": final,
        "summary": {
            "total_mapped": len(final),
            "manual_overrides_applied": len(MANUAL_OVERRIDES),
        },
    }
    (ROOT / "scripts/cert_mapping_dec2025.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2)
    )
    print(f"mapped: {len(final)} / 53")
    print("wrote cert_mapping_dec2025.json")


if __name__ == "__main__":
    main()
