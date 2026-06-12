// Five career-path lenses for the matrix.
//
// Per-path scoring model: each path has its own native dimensions, its own
// default weights, and its own evidence frame. A certification's "score"
// only exists in the context of a path — there's no global score, because
// the criteria genuinely differ.
//
// To add a new path: append to PATHS below, define its dimensions + default
// weights + evidence frame, and the matrix UI picks it up automatically.

// ─── Dimension labels per path ─────────────────────────────────────────────
//
// Each dimension is a 0-100 score on the certification. Labels here drive
// what the matrix renders as slider labels + score-breakdown rows when the
// path is the active lens.

export const PATH_DIMENSIONS = {
  clinical: {
    clinicalOutcomes:      { label: 'Clinical outcomes',        description: 'Magnitude and durability of functional improvements in patients.' },
    caseloadApplicability: { label: 'Caseload applicability',   description: 'What proportion of a typical caseload directly benefits.' },
    reimbursement:         { label: 'Billing & reimbursement',  description: 'Whether the cert unlocks codes, gates payer authorization, or strengthens medical-necessity documentation.' },
    efficiency:            { label: 'Certification investment', description: 'Cost, time, and accessibility of training.' },
    marketDemand:          { label: 'Employer demand',          description: 'How widely held and how often required by clinical employers.' },
    patientSatisfaction:   { label: 'Patient experience',       description: 'Patient-reported adherence, engagement, and outcomes.' },
  },
  business: {
    cashPayViability:      { label: 'Cash-pay viability',       description: 'Whether consumers will pay out of pocket for services this credential enables.' },
    pricingLeverage:       { label: 'Pricing leverage',         description: 'How much premium pricing the credential supports vs commodity competitors.' },
    marketDifferentiation: { label: 'Market differentiation',   description: 'Defensibility of the niche this credential creates.' },
    ownerLeverage:         { label: 'Owner leverage',           description: 'Whether the credential enables building a clinic/practice around the credential-holder vs around the credential-holder being the only deliverer.' },
    marketDemand:          { label: 'Consumer demand',          description: 'Direct-to-consumer recognition and demand for the service.' },
    efficiency:            { label: 'Credential investment',    description: 'Cost, time, and accessibility of training.' },
  },
  academicClinical: {
    facultyRecognition:    { label: 'Faculty recognition',      description: 'Whether the credential is recognized for promotion / tenure / faculty roles at PT/OT programs.' },
    scholarship:           { label: 'Scholarship signal',       description: 'Publications, presentations, and scholarly activity associated with credential holders.' },
    teachingValue:         { label: 'Teaching value',           description: 'Curricular relevance — does the credential strengthen the holder as an instructor.' },
    evidenceDepth:         { label: 'Evidence depth',           description: 'Quality of the literature base for the underlying intervention.' },
    facultyDemand:         { label: 'Faculty demand',           description: 'How often the credential is required or preferred for academic clinical positions.' },
    efficiency:            { label: 'Credential investment',    description: 'Cost, time, and accessibility of training.' },
  },
  research: {
    methodologyDepth:        { label: 'Methodology depth',          description: 'Rigor of research-methods training: study design, biostatistics, qualitative methods, causal inference.' },
    publicationTrack:        { label: 'Publication signal',         description: 'Peer-reviewed publication output associated with credential holders.' },
    grantReadiness:          { label: 'Grant readiness',            description: 'Whether the credential prepares holders to win independent funding (NIH K, R, F awards; NSF; foundation grants).' },
    pathwayToIndependence:   { label: 'Pathway to PI',              description: 'How directly the credential leads to independent investigator (PI) status.' },
    interdisciplinaryFit:    { label: 'Interdisciplinary fit',      description: 'Whether the credential opens collaborations across rehab, medicine, public health, engineering, data science.' },
    efficiency:              { label: 'Credential investment',      description: 'Time-to-credential and opportunity cost vs the clinical alternative.' },
  },
  healthTech: {
    industryPlacement:     { label: 'Industry placement',       description: 'Rate at which credential holders land roles at EHR vendors, payers, MedTech, digital-health companies, AI/ML startups.' },
    vendorDemand:          { label: 'Vendor / employer demand', description: 'How often the credential appears in job postings at Epic, Cerner/Oracle Health, HIMSS-member companies, payers.' },
    salaryPremium:         { label: 'Salary premium',           description: 'Compensation delta vs same-experience clinical roles.' },
    technicalSkillDepth:   { label: 'Technical skill depth',    description: 'Depth of usable technical skill the credential develops (build, configuration, data, analytics, regulatory).' },
    transitionFit:         { label: 'Transition fit',           description: 'How well the credential bridges from a clinical background into a non-clinical industry role.' },
    efficiency:            { label: 'Credential investment',    description: 'Cost, time, and accessibility of training.' },
  },
};

// ─── Path metadata + default weights ──────────────────────────────────────

export const PATHS = {
  clinical: {
    key: 'clinical',
    label: 'Clinical',
    description: 'Direct patient care, hospital and outpatient practice. Optimizes for credentials that move outcomes for a broad caseload and unlock billing.',
    evidenceFrame: 'clinical-intervention',
    defaultWeights: {
      clinicalOutcomes: 35,
      caseloadApplicability: 15,
      reimbursement: 15,
      efficiency: 20,
      marketDemand: 10,
      patientSatisfaction: 5,
    },
  },
  business: {
    key: 'business',
    label: 'Business',
    description: 'Private practice, cash-pay, entrepreneurship. Optimizes for credentials that justify premium pricing and build a defensible niche.',
    evidenceFrame: 'mixed',
    defaultWeights: {
      cashPayViability: 25,
      pricingLeverage: 20,
      marketDifferentiation: 15,
      ownerLeverage: 15,
      marketDemand: 15,
      efficiency: 10,
    },
  },
  academicClinical: {
    key: 'academicClinical',
    label: 'Academic Clinical',
    description: 'Faculty roles at PT/OT programs, clinical instructor leadership, DCE positions. Optimizes for credentials recognized in academic clinical hiring.',
    evidenceFrame: 'clinical-intervention',
    defaultWeights: {
      facultyRecognition: 25,
      scholarship: 20,
      teachingValue: 15,
      evidenceDepth: 20,
      facultyDemand: 10,
      efficiency: 10,
    },
  },
  research: {
    key: 'research',
    label: 'Research',
    description: 'PI track in academic medicine or industry R&D. Optimizes for credentials that develop research methodology, support grant capture, and accelerate the pathway to independent investigator.',
    evidenceFrame: 'career-outcome',
    defaultWeights: {
      methodologyDepth: 25,
      publicationTrack: 20,
      grantReadiness: 20,
      pathwayToIndependence: 15,
      interdisciplinaryFit: 10,
      efficiency: 10,
    },
  },
  healthTech: {
    key: 'healthTech',
    label: 'HealthTech & Industry',
    description: 'Clinical informatics, EHR consulting, digital-health startups, payer-side roles, MedTech, AI/ML in healthcare. Optimizes for credentials with measurable industry placement and compensation impact.',
    evidenceFrame: 'career-outcome',
    defaultWeights: {
      industryPlacement: 25,
      vendorDemand: 20,
      salaryPremium: 20,
      technicalSkillDepth: 15,
      transitionFit: 10,
      efficiency: 10,
    },
  },
};

export const PATH_ORDER = ['clinical', 'business', 'academicClinical', 'research', 'healthTech'];

// Canonical lens accent colors. Single source of truth — UI components
// import from here instead of re-declaring hex values locally.
export const LENS_COLORS = {
  clinical: '#3b82f6',
  business: '#A87B3F',
  academicClinical: '#2F6B4D',
  research: '#8b5cf6',
  healthTech: '#475569',
};

// Canonical score→color mapping for text/score displays.
// Ochre is darkened (#8A6332) relative to the border/bar shade (#A87B3F)
// so small text passes WCAG AA on white.
export const scoreColor = (n) => {
  if (n >= 65) return '#2F6B4D';
  if (n >= 40) return '#8A6332';
  return '#94a3b8';
};

export const getPathDefaultWeights = (pathKey) => {
  const path = PATHS[pathKey];
  if (!path) return null;
  return { ...path.defaultWeights };
};

// Returns true if `weights` matches the path's default weight bundle. Used
// by the matrix to label the active lens vs "Custom weights".
export const weightsMatchPathDefault = (weights, pathKey) => {
  const def = getPathDefaultWeights(pathKey);
  if (!def) return false;
  const keys = Object.keys(def);
  if (keys.length !== Object.keys(weights || {}).length) return false;
  return keys.every((k) => def[k] === weights[k]);
};

// Given a weights object, find which path's default matches. Returns null
// for custom weights.
export const matchPathByWeights = (weights) => {
  if (!weights) return null;
  for (const key of PATH_ORDER) {
    if (weightsMatchPathDefault(weights, key)) return key;
  }
  return null;
};

// Back-compat: old code imported PATH_PRESETS as a map of { weights } per path.
export const PATH_PRESETS = Object.fromEntries(
  PATH_ORDER.map((key) => [
    key,
    {
      label: PATHS[key].label,
      description: PATHS[key].description,
      weights: PATHS[key].defaultWeights,
    },
  ]),
);

// Back-compat: old matchPresetKey API.
export const matchPresetKey = matchPathByWeights;
