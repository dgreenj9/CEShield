#!/usr/bin/env python3
"""Split the unified citations.json into a small metadata file (sync) and
per-cert citation files (fetched on demand).

Output:
  - src/data/citations_meta.json
      Small, sync import. Keyed by cert name:
        { source, last_reviewed, count, evidence_mix, slug }
      Used by list rows + score badges WITHOUT fetching full citations.

  - public/citations/<slug>.json
      One file per cert, fetched by /explore detail pane on demand.
      Shape: { citations: [...] }

The cert detail page goes from ~4.2MB upfront → small metadata + ~10-200KB
per-cert request as the user navigates.
"""

from __future__ import annotations
import json
import re
import shutil
from collections import Counter
from pathlib import Path

ROOT = Path("/Users/danielgreen/il-ce-tracker")
SRC_DATA = ROOT / "src/data"
PUB_DIR = ROOT / "public/citations"


def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[-\s]+", "-", s).strip("-")
    return s


def main() -> None:
    # The unified library lives in scripts/citations.full.json (moved out of
    # src/data when we shipped the per-cert split). Falls back to src/data if
    # the legacy location still exists.
    candidates = [
        ROOT / "scripts/citations.full.json",
        SRC_DATA / "citations.json",
    ]
    src_path = next((p for p in candidates if p.exists()), None)
    if src_path is None:
        raise SystemExit("could not find unified citations source")
    full = json.loads(src_path.read_text())

    # Clean target directories so stale files don't linger.
    if PUB_DIR.exists():
        shutil.rmtree(PUB_DIR)
    PUB_DIR.mkdir(parents=True, exist_ok=True)

    meta: dict[str, dict] = {}
    used_slugs: dict[str, str] = {}  # slug → original name (for collision check)
    total_citations = 0
    high_quality = 0

    for name, entry in full.items():
        slug = slugify(name)
        # Disambiguate if two certs happen to slug-collide.
        if slug in used_slugs and used_slugs[slug] != name:
            i = 2
            while f"{slug}-{i}" in used_slugs:
                i += 1
            slug = f"{slug}-{i}"
        used_slugs[slug] = name

        citations = entry.get("citations", [])
        # Evidence-type distribution + year distribution per cert.
        mix: Counter[str] = Counter()
        years: Counter[int] = Counter()
        for c in citations:
            t = c.get("evidence_type") or "unknown"
            mix[t] += 1
            if t in ("rct", "systematic_review", "meta_analysis"):
                high_quality += 1
            year = c.get("year")
            if isinstance(year, int) and 1980 <= year <= 2030:
                years[year] += 1
        total_citations += len(citations)

        meta[name] = {
            "slug": slug,
            "source": entry.get("source", "none"),
            "last_reviewed": entry.get("last_reviewed"),
            "count": len(citations),
            "evidence_mix": dict(mix),
            # Per-year citation counts. Sparse — only years with at least one
            # citation. Sparkline component reads this and renders the trend.
            "year_dist": {str(y): n for y, n in sorted(years.items())},
        }

        # Write per-cert file
        (PUB_DIR / f"{slug}.json").write_text(
            json.dumps({"citations": citations}, ensure_ascii=False)
        )

    (SRC_DATA / "citations_meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2)
    )

    meta_size = (SRC_DATA / "citations_meta.json").stat().st_size
    per_cert_total = sum(p.stat().st_size for p in PUB_DIR.glob("*.json"))
    print(f"certs                 : {len(full)}")
    print(f"total citations       : {total_citations}")
    print(f"high-quality (RCT/SR/MA): {high_quality}")
    print(f"meta file (sync)      : {meta_size:>10,} bytes")
    print(f"per-cert files (lazy) : {per_cert_total:>10,} bytes total")
    print(f"average per-cert      : {per_cert_total // len(full):>10,} bytes")
    print(f"wrote src/data/citations_meta.json + public/citations/<slug>.json × {len(full)}")


if __name__ == "__main__":
    main()
