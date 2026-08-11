# Data pipeline scripts

One-shot scripts used to build and audit the credential dataset (`src/utils/certificationData.js`)
and the per-credential citation/justification libraries in `public/citations/` and
`public/justifications/`.

The large generated intermediates these scripts produce (multi-MB citation dumps,
mapping snapshots) are intentionally not committed — the committed dataset files are
the canonical output. Several scripts contain absolute paths from the original
processing machine; they are kept for provenance, not for re-running.
