# State CE Rules Schema

Each `{STATE}-{LICENSE}.js` file exports a `rules` object matching this shape.
The engine in `src/utils/calculations.js` consumes these directly.

```ts
type Rules = {
  state: string;              // 'IL', 'WI', 'NC'
  licenseType: 'PT' | 'OT';
  jurisdictionName: string;   // e.g. 'Illinois', 'Wisconsin'

  // Source-of-truth for audit
  citation: string;           // e.g. '225 ILCS 90 / 68 Ill. Adm. Code 1340'
  boardUrl: string;           // direct link to the licensing board CE page
  lastReviewed: string;       // 'YYYY-MM' when these values were last confirmed
  verified: boolean;          // true ONLY if values have been verified by a clinician

  // Cycle
  totalHours: number;         // total CE hours per renewal cycle
  cycleYears: number;         // length of the renewal cycle (usually 2)
  cycleEndsOnOddYear: boolean | null;  // some states fix cycle ends to odd/even years

  // Mandatory sub-categories — keys must match the `category` enum in courses
  mandatory: {
    ethics?: number;
    sexualHarassment?: number;
    culturalCompetency?: number;
    implicitBias?: number;
    dementia?: number;
    jurisprudence?: number;
    // Other states may add more — extend Course.category union when adding new ones.
  };

  // Caps on what counts toward the total — keys must match the `format` enum
  limits: {
    selfStudy?: number;
    teaching?: number;
    clinicalInstructor?: number;
    journalClubs?: number;
    inservices?: number;
    districtMeetings?: number;
    skillsCertification?: number;
  };

  // First-renewal exemption (common in PT)
  firstRenewalExempt: boolean;

  // Free-text notes the UI surfaces in the settings/methodology page
  notes: string[];
};
```

## Verification protocol

When adding or refreshing a state:
1. Visit the `boardUrl` and confirm the totalHours + each mandatory + each limit
2. Cross-reference any recent legislative additions (ethics, implicit bias, etc.)
3. Update `lastReviewed` and flip `verified: true` only when each number is checked
4. Add a citation comment next to any value that differs from your prior cycle

A `verified: false` rules file shows a banner in the user's dashboard
warning that the state's rules are draft and may not reflect current law.
