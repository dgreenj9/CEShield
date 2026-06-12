#!/usr/bin/env python3
"""Audit current hand-typed clinicalOutcomes sub-scores against the new
librarian-curated evidence base.

Output (scripts/scoring_audit.json):
{
  "summary": { ... },
  "audit": [
    {
      "cert": str,
      "current_clinical_outcomes_score": int,
      "evidence_profile": { meta_analysis, systematic_review, rct, ..., total },
      "evidence_strength_score": float,  # 0..6
      "implied_band": "Strong" | "Good" | "Moderate" | "Limited",
      "current_band": "Strong" | "Good" | "Moderate" | "Limited",
      "delta_band": int,                 # 0 == aligned
      "flag": "OK" | "REVIEW_HIGH" | "REVIEW_LOW" | "NO_EVIDENCE" | "SPARSE",
      "rationale": str,
    }, ...
  ]
}

flag legend:
  REVIEW_HIGH  current score >= 70 but evidence sparse  (overrated suspect)
  REVIEW_LOW   current score < 50 but >=5 strong studies (underrated suspect)
  NO_EVIDENCE  zero citations in library
  SPARSE       <5 total citations
  OK           current score aligned with evidence strength
"""

from __future__ import annotations
import json
import re
from pathlib import Path
from collections import Counter

ROOT = Path("/Users/danielgreen/il-ce-tracker")

STRENGTH = {
    "meta_analysis": 6, "systematic_review": 5, "rct": 4, "guideline": 4,
    "cohort": 3, "case_control": 2, "cross_sectional": 2, "pilot": 2,
    "case_series": 1, "qualitative": 1, "narrative": 1, "protocol": 1, "unknown": 0,
}


def band(score: int) -> str:
    if score >= 70: return "Strong"
    if score >= 50: return "Good"
    if score >= 30: return "Moderate"
    return "Limited"


def implied_band_from_evidence(profile: dict) -> str:
    """Map evidence profile -> expected band for clinicalOutcomes."""
    high = profile.get("meta_analysis", 0) + profile.get("systematic_review", 0)
    rct = profile.get("rct", 0)
    total = sum(profile.values())
    if high >= 5 and rct >= 8:
        return "Strong"
    if high >= 2 and rct >= 4:
        return "Good"
    if total >= 5:
        return "Moderate"
    return "Limited"


BAND_RANK = {"Limited": 0, "Moderate": 1, "Good": 2, "Strong": 3}


def parse_certifications_js(js: str) -> list[dict]:
    """Pull each cert's name and clinicalOutcomes sub-score from JS source.
    Cheap regex parse — no need for a full JS parser."""
    out: list[dict] = []
    # Each cert is a `{ name: 'X', ... subScores: { clinicalOutcomes: N, ...` block.
    pattern = re.compile(
        r"name:\s*'((?:[^'\\]|\\.)*)'.*?subScores:\s*\{[^}]*?clinicalOutcomes:\s*(\d+)",
        re.DOTALL,
    )
    for m in pattern.finditer(js):
        name = m.group(1).replace("\\'", "'")
        out.append({"name": name, "clinicalOutcomes": int(m.group(2))})
    return out


def main() -> None:
    library = json.loads((ROOT / "src/data/citations.json").read_text())
    js = (ROOT / "src/utils/certificationData.js").read_text()
    certs = parse_certifications_js(js)
    print(f"parsed {len(certs)} certs from certificationData.js")

    audit = []
    flag_counts = Counter()
    for c in certs:
        entry = library.get(c["name"], {"citations": [], "source": "none"})
        profile = Counter()
        weighted = 0
        for cit in entry["citations"]:
            t = cit.get("evidence_type") or "unknown"
            profile[t] += 1
            weighted += STRENGTH.get(t, 0)
        total = sum(profile.values())
        strength = round(weighted / total, 2) if total else 0.0

        cb = band(c["clinicalOutcomes"])
        ib = implied_band_from_evidence(profile) if total else "Limited"
        delta = BAND_RANK[cb] - BAND_RANK[ib]

        if total == 0:
            flag = "NO_EVIDENCE"
            rationale = "Zero citations in library; either expand the curation or accept a lower clinical-outcomes score."
        elif total < 5:
            flag = "SPARSE"
            rationale = f"Only {total} citations; thin evidence base regardless of band."
        elif delta >= 2:
            flag = "REVIEW_HIGH"
            rationale = (
                f"Current score implies '{cb}' band but evidence supports only '{ib}'. "
                f"Probably overrated for clinicalOutcomes — review."
            )
        elif delta <= -2:
            flag = "REVIEW_LOW"
            rationale = (
                f"Current score implies '{cb}' but evidence supports '{ib}'. "
                f"Probably underrated — consider raising clinicalOutcomes."
            )
        else:
            flag = "OK"
            rationale = f"Score band '{cb}' aligned with evidence band '{ib}'."

        flag_counts[flag] += 1
        audit.append({
            "cert": c["name"],
            "current_clinical_outcomes_score": c["clinicalOutcomes"],
            "current_band": cb,
            "implied_band": ib,
            "delta_band": delta,
            "evidence_profile": dict(profile),
            "total_citations": total,
            "evidence_strength_score": strength,
            "library_source": entry["source"],
            "flag": flag,
            "rationale": rationale,
        })

    audit.sort(key=lambda x: (
        {"REVIEW_HIGH": 0, "REVIEW_LOW": 1, "SPARSE": 2, "NO_EVIDENCE": 3, "OK": 4}[x["flag"]],
        -x["total_citations"],
    ))

    out = {
        "summary": {
            "total_certs": len(certs),
            **dict(flag_counts),
        },
        "audit": audit,
    }
    (ROOT / "scripts/scoring_audit.json").write_text(json.dumps(out, indent=2))
    print(json.dumps(out["summary"], indent=2))

    print("\nREVIEW_HIGH (current score may be overrated):")
    for a in audit:
        if a["flag"] == "REVIEW_HIGH":
            print(f"  {a['current_clinical_outcomes_score']:>3}  {a['cert']:<45} "
                  f"{a['current_band']:>8} -> {a['implied_band']:<8}  "
                  f"evidence: {a['evidence_profile']}")

    print("\nREVIEW_LOW (current score may be underrated):")
    for a in audit:
        if a["flag"] == "REVIEW_LOW":
            print(f"  {a['current_clinical_outcomes_score']:>3}  {a['cert']:<45} "
                  f"{a['current_band']:>8} -> {a['implied_band']:<8}  "
                  f"evidence: {a['evidence_profile']}")


if __name__ == "__main__":
    main()
