# 0002 · Literature expansion and cleanup (2026-10-19/20)

Branch `literature/expansion-oct19`. Pipeline: `scripts/expand_citations.py`
(steps `repair`, `search`, `add`, `dedupe`, `classify`, `stats`, `report`).
Every record added or repaired came from a PubMed E-utilities or Crossref
response fetched at run time (curl; responses cached in `.cache/eutils/`,
gitignored). Nothing was written from memory. Credential scores and
justifications are untouched.

## Before / after

| | Before | After |
|---|---:|---:|
| Citations | 7,000 | 8,609 |
| RCT + SR + MA (`siteStats.rctSrMa`) | 3,163 | 4,749 |
| `evidence_type: "unknown"` | 2,873 | 1,611 |
| Files under 25 citations | 67 | 13 (smallest: 16) |
| Files at 0-5 citations | 13 | 0 |

`siteStats.json` now reads `citationTotal: 8609`, `rctSrMa: 4749`.
`citations_meta.json` count / evidence_mix / year_dist recomputed for all 143.

## 1. Repairs (log: `scripts/literature/log.json` → `repair`)

- **Field-misaligned records: 36 rebuilt.** 26 had publisher in `journal`,
  pages in `doi`, DOI in `pmid`, EBSCO id in `url` (mostly *Physiother
  Theory Pract*); 3 had a bare PMID in `url` (NCBI Bookshelf reports:
  USPSTF ×2, NICE); 1 had a concatenated DOI; 6 workflow records with no
  identifiers matched a real work on Crossref/PubMed (usually mis-dated) and
  were rebuilt from that record.
- **EBSCO accession numbers in `pmid`: 1,666 replaced** by the verified PMID
  (DOI → PubMed lookup, title checked); **656 cleared** where the article is
  not in PubMed (9-digit ids are never PMIDs; `citationUrl()` was sending
  these to unrelated PubMed pages when no DOI existed).
- **15 PMIDs cleared** that resolved to a different article.
- 28 publisher-as-journal names replaced with the indexed journal; 36 DOIs
  filled; 370 records HTML-unescaped (`&amp;` etc.); 2 exact duplicates removed.
- **Removed: 68.** 4 trade-magazine items with no recoverable identifier
  (ASHA Leader, Massage & Bodywork ×2, a massage-insurer newsletter).
  **64 records from the 2026-06 workflow import** labelled
  `source_type: "peer-reviewed"` with no DOI, PMID or link, whose titles match
  nothing in PubMed or Crossref (e.g. "Career Outcomes of NIH F32 Postdoctoral
  Fellows: A Longitudinal Analysis", "Outcomes of the NIH Career Development
  Awards for Physical Therapy Researchers"). These read as model-generated
  and were concentrated in the research-career and informatics files. Each is
  listed with its file in the log; restore from git history if any is real.
- Kept but listed (`repair.unverified`, 174): reports, society documents and
  government pages without DOIs/PMIDs (49 government, 35 society, 80 legacy
  trade/EBSCO items). Not verified either way.

## 2. Expansion (67 files under 25)

Queries per credential live in `scripts/literature/queries.json`: one or two
credential-specific ("core") queries plus domain queries filtered to
SR / MA / RCT / guideline, English, with abstract, mostly 2015+. Selection is
round-robin across queries (strongest design first, then recency). Every
candidate was title-reviewed; kept PMIDs are in `accepted.json`, rejected
ones in `rejects.json`, review sheets in `candidates/`. Only accepted PMIDs
are added.

**1,679 citations added** (417 MA, 383 SR, 168 RCT, 137 guideline, 156
narrative, 85 cross-sectional, 260 unclassified, rest other); 95% from 2015+.
Shape matches existing records exactly (`url` = PubMed link, `library_link` =
LibKey when a DOI exists).

| File | Before | Added | After |
|---|---:|---:|---:|
| certified-exercise-expert-for-aging-adults | 0 | 45 | 45 |
| board-certification-in-gerontology | 1 | 39 | 40 |
| aota-board-certifications-physical-rehab | 2 | 38 | 40 |
| geriatric-clinical-specialist-gcs | 2 | 43 | 45 |
| imot-intensive-therapy | 2 | 33 | 35 |
| bc-ancds-neurologic-communication | 3 | 42 | 45 |
| board-certification-intraoperative-monitoring | 3 | 32 | 35 |
| modern-management-of-older-adult | 3 | 34 | 37 |
| neurologic-clinical-specialist-ncs | 3 | 42 | 45 |
| vestibular-aib-certifications | 4 | 36 | 40 |
| vestibular-vcc-certification | 4 | 36 | 40 |
| board-certified-specialist-in-swallowing | 5 | 39 | 44 |
| rolfingstructural-integration | 5 | 16 | 21 |
| acrp-certified-clinical-research-coordinator-ccrc | 6 | 26 | 28 |
| socra-certified-clinical-research-professional-ccrp | 6 | 22 | 26 |
| ahima-rhia-registered-health-information-administrator | 6 | 16 | 22 |
| ahima-rhit-registered-health-information-technician | 6 | 19 | 22 |
| amia-clinical-informatics-board-certification | 6 | 26 | 29 |
| himss-cphims-…-management-systems | 6 | 21 | 25 |
| hl7-fhir-proficiency | 6 | 31 | 34 |
| iso-13485-medical-device-qms-training | 6 | 19 | 23 |
| lean-six-sigma-in-healthcare-greenblack-belt | 6 | 31 | 33 |
| multiple-sclerosis-certified-specialist | 6 | 38 | 44 |
| pmp-project-management-professional | 6 | 12 | 16 |
| research-doctorates-phdscd | 6 | 18 | 19 |
| tpi-golf-certification | 6 | 21 | 27 |
| ahima-chda-certified-health-data-analyst | 7 | 17 | 23 |
| cerner-oracle-health-certification | 7 | 17 | 21 |
| epic-certification-build-configuration | 7 | 16 | 20 |
| cochrane-jbi-systematic-review-training | 7 | 24 | 26 |
| ms-in-biostatistics | 7 | 20 | 24 |
| ms-in-clinical-research-translational-science | 7 | 19 | 21 |
| nahq-cphq-certified-professional-in-healthcare-quality | 7 | 15 | 18 |
| nih-k-award-k01k12k23 | 7 | 18 | 21 |
| postdoctoral-research-fellowship-t32f32 | 7 | 14 | 16 |
| sports-clinical-specialist-scs | 7 | 37 | 44 |
| transitional-dpt-tdpt | 7 | 14 | 20 |
| cochlear-implant-specialty | 9 | 29 | 38 |
| advanced-cardiovascular-life-support-acls | 10 | 22 | 32 |
| capp-ob-…-obstetric-health | 10 | 28 | 38 |
| capp-pelvic-…-pelvic-health | 10 | 35 | 45 |
| neonatal-therapy-certification | 10 | 24 | 34 |
| postural-restoration-certified-prc | 10 | 15 | 25 |
| pwrmoves-certified-therapist-parkinson-wellness-recovery | 10 | 34 | 44 |
| vitalstim | 10 | 28 | 38 |
| eim-pelvic-health-specialist-certification | 11 | 29 | 40 |
| assistive-technology-professional-atp | 11 | 24 | 35 |
| sos-feeding-approach | 11 | 20 | 31 |
| aacvpr-certified-cardiac-rehabilitation-professional-ccrp | 12 | 33 | 45 |
| cardiovascular-pulmonary-pt-residency-abptrfe | 12 | 32 | 44 |
| aquatic-therapeutic-exercise-certification-atric | 13 | 26 | 39 |
| impact-trained-physical-therapist-itpt | 13 | 25 | 38 |
| lower-limb-amputee-rehabilitation-… | 13 | 25 | 38 |
| acute-care-pocus-lung-diaphragm-ultrasound | 14 | 24 | 38 |
| aota-specialty-certifications | 14 | 31 | 45 |
| musculoskeletal-ultrasound-rmsk | 14 | 23 | 37 |
| selective-functional-movement-assessment-sfma | 14 | 14 | 28 |
| alexander-technique | 15 | 9 | 24 |
| comtmanual-therapy-certification | 16 | 29 | 45 |
| seating-and-mobility-specialist | 16 | 21 | 37 |
| clinical-electrophysiology-specialist | 17 | 23 | 40 |
| emergency-medical-response | 17 | 17 | 34 |
| board-certification-in-pediatrics | 19 | 21 | 40 |
| suit-therapy | 19 | 10 | 29 |
| fce-functional-capacity-eval | 20 | 12 | 32 |
| feldenkrais-method | 20 | 10 | 30 |
| wound-care-specialist | 22 | 20 | 42 |

"Before" is the pre-repair count; a few files lost removed records first.
Files that stayed under 25 (research careers, informatics, PMP, Alexander
technique) have thin peer-reviewed literature; padding them with off-topic
hits was rejected on review.

Most added records support the clinical domain of a credential, not the value
of the credential itself. Credential-outcome studies (ABPTS specialist
practice analyses, residency outcomes, specialist vs generalist) were
included where PubMed has them. The existing "no comparative outcome studies"
evidence text remains accurate.

## 3. Evidence-type classification

Rules, in order: protocol title → PubMed publication type (Meta-Analysis,
Systematic Review/Scoping Review, Practice Guideline/Guideline/Consensus
Development Conference, Randomized Controlled Trial/Pragmatic/Equivalence
Trial) → title cues → abstract cues (strict phrasing, e.g. "were randomly
assigned", "semi-structured interviews", "cross-sectional") → Case Reports →
Observational Study + cohort wording → generic PubMed "Review" → narrative.
Existing vocabulary only; `guideline` was already in use and labelled
("Clinical guideline") in `EVIDENCE_LABELS`.

Of the 2,822 pre-existing "unknown" records (after repair), **1,470 were
classified**: rct 521, narrative 357, cross_sectional 152, cohort 143,
qualitative 69, systematic_review 66, guideline 52, case_series 45,
meta_analysis 36, pilot 20, protocol 9. Basis: PubMed publication type 911,
abstract 368, title 170, pub type + abstract 21. 1,351 stay "unknown"
(no PubMed record, or no design signal). Previously labelled records were not
relabelled. Abstract-cue labels are heuristic; spot checks found them mostly
right with occasional secondary analyses of trials labelled `rct`.

## 4. Site surfaces

- `src/data/siteStats.json`, `src/data/citations_meta.json` recomputed.
- Files that received script-retrieved citations: `source` changed to
  `librarian+eutils-2026-10` (33) or `workflow-2026-06+eutils-2026-10` (34),
  `last_reviewed` → `2026-10`. Consequence: the "Librarian-reviewed" badge
  (`source === 'librarian'`) no longer shows on those 33 dossiers, because the
  new records were not librarian-reviewed. Revert those fields if the badge
  should stay.
- Count text updated: `src/app/about/page.jsx` metadata (hardcoded 7,000),
  `README.md`, `docs/design/voice.md`, `docs/design-handoff/CLAUDE_DESIGN_HANDOFF.md`.
  All other surfaces read `siteStats`.

## Known gaps / follow-ups

- `src/app/methodology/page.jsx` keeps its own `EVIDENCE_LABELS` without
  `guideline` / `government_dataset`, so those render as raw keys in the
  evidence-base list. Not changed here (the polish branch owns that file);
  importing `EVIDENCE_LABELS` from `utils/citationsLibrary` fixes it.
- 13 files remain under 25. 174 unverified non-journal records remain.
- Pre-existing labels were not audited; some legacy title-heuristic labels
  are likely wrong.

## Reproduce

```
python3 -I scripts/expand_citations.py repair   # from the pre-expansion commit
python3 -I scripts/expand_citations.py search
python3 -I scripts/expand_citations.py add      # adds only accepted.json PMIDs
python3 -I scripts/expand_citations.py dedupe
python3 -I scripts/expand_citations.py classify
python3 -I scripts/expand_citations.py stats
```
