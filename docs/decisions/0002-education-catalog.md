# Provider-independent education catalog

The public `/learn` catalog extends CE Shield beyond its ranked credentials.
Providers, education offerings, clinical subjects, course evaluations, and
jurisdictional CE approvals are separate concepts. An individual course may be
available independently and also contribute to a certification pathway.

## Data and identity

- `src/data/education/credentialLinks.json`: destinations keyed by the existing
  dossier slug. Each ranked credential must have at least one attributed link.
  Link types distinguish program pages, directories, and official resources.
  Broad technologies and historical credentials must not imply open enrollment.
- `providers.json`: extensible source registry, audience, official catalog URL,
  and provider-specific URL inclusion pattern. Professional directories support
  discovery of providers beyond the initial registry.
- `courses.json`: manually checked facts with source URL and review date.
  Unknown hours, prices, and eligibility remain unknown. Prices are snapshots.
  International prices use `price: { amount, currency }` with an ISO currency
  code. Legacy `priceUsd` values are explicitly displayed as USD. Do not infer
  contact hours from video runtime or convert currencies without a dated source.
- `discoveredCourses.json`: public provider listings with title, source URL,
  discovery date, and unknown availability. Discovery does not verify the
  curriculum, licensing eligibility, or CE acceptance.
- `coverage.json`: dated source attempts and candidate URL counts. Candidate
  URLs are not verified course counts; they can include sessions and duplicates.
- `unavailableCourses.json`: dated provider statements that enrollment is closed.
  These records suppress both discovery listings and older curated facts in
  public results. A successful later detail check can return the listing to
  unknown availability; disappearance of a closure notice does not prove open
  enrollment. Failed requests preserve the closure record.

Identity is provider plus normalized URL. Tracking parameters and fragments
are removed, along with cache-control query parameters; course IDs, session,
and format parameters are preserved. A checked record
overrides a discovered record with the same identity. Different vendors' courses
are never merged by title. Distinct session URLs remain distinct listings until
a reviewer establishes a shared parent course. This is an explicit limitation
of the first discovery import, not a count of unique curricula.

Titles generate provisional subject tags. Checked records can override them.
Profession filters use a checked course audience where available, falling back
to the provider's audience with disclosure. A provider serving SLPs does not
establish that every course is intended for SLPs.

## Course comparison

Clinicians can select up to three listings and compare facts at `/learn`.
The `compare` query parameter stores the selected IDs, and `tab=compare`
opens the comparison. Selections survive filtering and reloads. Unknown and
closed IDs are ignored. When checked facts replace a discovery record, its
older ID remains an alias in the merged catalog, preserving existing links.

Comparison shows explicit unknowns for unchecked audience, hours, price,
format, and scope. Provider-wide audience does not become course eligibility.
Currencies are shown as listed without conversion. Course scores retain their
subject, access basis, rationale, sources, and limitations; comparisons do not
calculate an overall winner. Scheduled online cohorts can be distinguished
from on-demand courses using `blendedOnline` and `liveOnline` formats.

## Course review and ranking

The progression is `discovered` → `verified` (facts checked) → `ranked`.
No course scores are inherited from credential scores, intervention evidence,
provider reputation, or provider star ratings. The initial course rubric is:

| Dimension | Weight | Review basis |
| --- | ---: | --- |
| Evidence alignment | 30% | Course claims, cited research, limitations, and consistency with current evidence |
| Clinical application | 25% | Stated objectives, cases, practice tasks, and relevance to the intended audience |
| Teaching and assessment | 20% | Instructional methods, feedback, assessment, and demonstrated learning evidence |
| Curriculum transparency | 15% | Syllabus, instructor qualifications, disclosures, prerequisites, and sources |
| Time and cost value | 10% | Total investment relative to depth, access, support, and comparable offerings |

Every dimension requires a 0–100 score, written rationale, and public supporting
source URLs. The review must name its subject, reviewer, and review date.
Incomplete evaluations display no score. Ranking comparisons are restricted to
the selected subject. Reviewers should also consider audience and objectives;
the subject filter alone does not make different course depths equivalent.
The first published evaluations assess public curriculum materials only. They are
explicitly provisional and do not establish teaching effectiveness or outcomes.

Every published evaluation also states its `reviewBasis` (`public-materials`
or `course-access`) and `limitations`. These are visible with the evaluation.
The application withholds scores when these disclosures are missing.

Course facts and advertising alone generally cannot establish teaching
effectiveness or patient outcomes. Reviews should distinguish direct course
evidence from curriculum-based judgment and state access limitations.

## CE acceptance

The existing `courseCatalog.json` is the separate, vetted compliance-gap catalog.
Discovery imports never write to it. Public course records contain an explicit
`ceApprovals` array, initially empty. A future approval record must identify
profession, jurisdiction, category, format, approval period, applicable session,
and the authoritative source before feeding the Ledger. A provider's contact
hours are not automatically accepted credit hours for any particular license.

## Updating the catalog

```sh
# Collect findings without altering public data.
python3 scripts/catalog/discover.py --details 30 --sitemaps 5

# Review artifacts/catalog/discovery.json, then update discovery records.
python3 scripts/catalog/discover.py --publish --details 30 --sitemaps 5

# Target one provider; expand page limits for deeper catalog coverage.
python3 scripts/catalog/discover.py --provider eim --details 500 --publish

# Refresh ambiguous anchor titles from detail pages.
python3 scripts/catalog/discover.py --provider physiotutors --details 50 --refresh-titles --publish

# Repeated bounded imports reuse prior titles and advance to new detail pages.
python3 scripts/catalog/discover.py --provider summit --details 60 --publish

# Retry failed or incomplete extraction immediately instead of after seven days.
python3 scripts/catalog/discover.py --provider summit --details 60 --retry-after-days 0

# Follow registered public catalog pagination, capped at 200 pages per provider.
python3 scripts/catalog/discover.py --provider physicaltherapy --provider speechpathology --catalog-pages 200 --details 0 --publish

node scripts/catalog/check-links.mjs
python3 -m unittest discover -s scripts/catalog -p 'test_*.py'
node --test scripts/catalog/test-review.mjs
npm test
npm run build
```

The crawler reads public catalogs and sitemaps, respects robots.txt, rate-limits
each provider, bounds response sizes and requests, and records failures. It does
not bypass login walls, restrictions, or unavailable sources. Source rules need
periodic maintenance as provider websites change. Failures preserve valid prior
discoveries; absence from a new sitemap does not prove retirement. Availability
must be checked separately before marking an offering as open or retired.

Network reports stay in ignored `artifacts/catalog/`. Publication here means a
local dataset update, not deployment. Weekly recurring discovery and link audits run through the Catalog maintenance
GitHub Actions workflow. Proposed changes and review reports are saved as artifacts;
they do not automatically replace the deployed dataset.

`crawl-state.json` preserves successful extraction and attempted URLs between
runs, including dry runs. Recently attempted pages without useful titles are
deferred for seven days so broken pages do not consume every run's page budget.
`--refresh-titles` explicitly rereads pages, while `--retry-after-days` controls
failed extraction retries. Every run also saves a dated discovery report; the
latest report remains `discovery.json`. Run one importer process at a time to
avoid concurrent writes to shared state and published datasets.

The provider coverage view dates each source check and distinguishes sources
that need access review. Candidate URLs, published listings, and checked facts
remain separate counts. A bounded run is not a complete provider inventory.

Catalog pagination is opt-in through `catalogPaginationPattern`. Only same-host
Next links matching that path pattern are followed, with canonical URL cycle
detection and a `--catalog-pages` budget (default one, maximum 200). Coverage
records the pages attempted and whether pagination remained when the budget
was exhausted. Existing explicit catalog seeds are always attempted.

JSON-LD Course objects supply names and URLs for catalogs whose links require
JavaScript. They do not supply checked facts, prices, CE approvals, or scores.
`structuredUrlOriginAliases` handles an explicitly verified provider quirk:
OccupationalTherapy.com emits Continued.com URLs in its structured data while
its rendered course cards link to the same paths on OccupationalTherapy.com.
Only the registered exact origin is rewritten; all resulting links still pass
the provider host and course-path checks. Numeric review-count anchors are
excluded so they cannot replace short course titles.

OccupationalTherapy.com also registers its public Continued search API through
`publicCatalogApi`. The adapter uses a fixed read-only GraphQL query, the public
learning-space identifier observed in the catalog, and no authentication. It
requests titles, slugs, published format types, duration, instructional level,
and pagination metadata. Duration, level, and formats are separately stored in
`providerFacts` with a source and date, displayed as provider-reported, and never
converted to accepted CE hours.
The API host has its own robots check, response limit, and rate limiter. Course
links still pass the original provider host and path checks. Prices, ratings,
enrollment records, and CE approvals are not requested. `--catalog-pages` also
bounds API pagination; coverage records `apiPagesFetched` and
`apiPaginationPending`. Repeated pages, GraphQL errors, and changed response
shapes stop the API pass and retain successful earlier findings.

```sh
python3 scripts/catalog/discover.py --provider occupationaltherapy --catalog-pages 50 --details 0 --publish
```

Imports acquire an exclusive process lock before reading or writing shared
state. Providers are restricted to their registered hostname (with a `www`
alias), not the whole hosting domain. This keeps unrelated Teachable tenants
out of the same provider. A registered `maxResponseBytes` can raise the default
4 MB limit up to 12 MB for larger public catalogs. `catalogLinkPattern` and
`sitemapDiscovery: false` can limit mixed product catalogs to identifiable
course links, as with Northern Speech's course codes.
`detailTitleSource: "document"` handles pages whose course heading is split
across multiple heading elements. An optional `browseUrl` points clinicians to
the provider's current public site when the discovery source is a legacy catalog.

## Editorial review workflow

```sh
# Prioritize checked facts; rotate providers within each review stage.
node scripts/catalog/review.mjs queue --limit 50
node scripts/catalog/review.mjs queue --subject pain --limit 12

# Create a draft without scores; existing drafts cannot be overwritten.
node scripts/catalog/review.mjs draft --course eim-pne-online --subject pain

# After research, validate the completed review without changing public data.
node scripts/catalog/review.mjs validate --file artifacts/catalog/reviews/eim-pne-online.json

# Preview the calculated score, then write the local record when complete.
node scripts/catalog/review.mjs apply --file artifacts/catalog/reviews/eim-pne-online.json
node scripts/catalog/review.mjs apply --file artifacts/catalog/reviews/eim-pne-online.json --write
```

Queue order is editorial work order, not a quality ranking. Discovered listings
must first have facts checked and be added to `courses.json`. Drafts require a
reviewed subject, named reviewer, valid review date, explicit access basis and
limitations, and supported rationale for every dimension. A fingerprint of the
curated record prevents applying a draft after its facts or evaluation change.
Known closed offerings cannot be drafted or published through this workflow.
No command purchases a course, accesses a private account, or deploys changes.
Research drafts and queues remain in ignored `artifacts/catalog/reviews/`.

## Learning plans and classifications

The catalog supports reviewed learning goals, clinical settings, populations,
and instructional levels. Unclassified courses are excluded when a facet is
selected. A provider-reported level or format is a disclosed fallback, not
independent fact verification. Video duration does not populate contact hours.

A browser-local plan holds up to 100 courses, dates, notes, profession, and state.
Exports preserve those details and the current source URLs. Plans do not sync
between devices or add completed hours. Aliases preserve selections when a
listing is curated; missing or closed listings remain visible in the plan as
unavailable instead of silently disappearing.

Acceptance stays unknown unless a dated, verified course-specific record matches
profession, jurisdiction, delivery format, and planned date. Provider CEUs alone
never establish state-license acceptance. No state-specific approval records
have been published in this release. The course-log handoff prefills title and
provider only; the clinician must enter the completion date and credited hours
and confirm format and category. Signing in preserves the requested course.

## Scheduled maintenance

`.github/workflows/catalog-maintenance.yml` runs Mondays at 10:17 UTC and can be
started manually. The full run discovers all registered sources with bounded
pagination and detail requests, audits every unique credential destination plus
a rotating sample of 250 course URLs, validates datasets, and generates a
review queue and maintenance summary. Missing links are reported, not deleted;
blocked requests are not treated as proof that a course is closed. Review
artifacts are retained for 30 days, with crawl progress cached across runs.
The quick manual scope checks AbleNet discovery plus the same link audit and
validation pipeline. Both scopes have read-only repository permissions. Review
and an ordinary code release are required to publish proposed data changes.
