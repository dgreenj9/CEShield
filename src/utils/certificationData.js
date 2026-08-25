// Per-path certification scoring data.
//
// Each certification carries one or more `pathScores` blocks keyed by path
// (clinical / business / academicClinical / research / healthTech). The
// matrix filters certs to those that have a pathScores block for the
// active lens, then ranks them by the lens-specific weighted sum.
//
// Path dimensions + default weights are defined in utils/careerPaths.js.
//
// NOTE: per-dimension justification strings live in
// public/justifications/<slug>.json (lazy-loaded client-side, fs-read at
// build time by the SSG credential pages). Keeping them out of this module
// keeps ~282KB out of the client bundle. See scripts/split_justifications.mjs.

export const ALL_DISCIPLINES = ['PT', 'OT', 'SLP', 'AT', 'EP', 'RT', 'RN', 'MT', 'Audiology', 'Informatics', 'IT', 'HIM', 'QA', 'PM', 'Researcher'];

export const certifications = [
  {
    "name": "Pulmonary Rehabilitation",
    "type": "Program",
    "discipline": "PT/OT/RT",
    "disciplines": [
      "PT",
      "OT",
      "RT"
    ],
    "evidence": "Cochrane meta-analysis: 6MWD +49m, HRQL improvement, 68% fewer exacerbation hospitalizations. 5-year sustained benefit. Medicare-covered. CMS reimburses certified programs.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 90,
        "efficiency": 42,
        "caseloadApplicability": 35,
        "reimbursement": 90,
        "marketDemand": 48,
        "patientSatisfaction": 80
      },
      "business": {
        "cashPayViability": 15,
        "pricingLeverage": 20,
        "marketDifferentiation": 30,
        "ownerLeverage": 25,
        "marketDemand": 20,
        "efficiency": 45
      },
      "academicClinical": {
        "facultyRecognition": 55,
        "scholarship": 70,
        "teachingValue": 65,
        "evidenceDepth": 80,
        "facultyDemand": 40,
        "efficiency": 55
      }
    }
  },
  {
    "name": "AACVPR Cardiac Rehabilitation",
    "type": "Certification",
    "discipline": "PT/OT/RN",
    "disciplines": [
      "PT",
      "OT",
      "RN"
    ],
    "evidence": "Cochrane: 26% cardiovascular mortality reduction. AACVPR-certified programs show 13-15% lower 1-year mortality vs non-certified. Medicare Phase II/III covered.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 88,
        "efficiency": 40,
        "caseloadApplicability": 35,
        "reimbursement": 92,
        "marketDemand": 55,
        "patientSatisfaction": 78
      },
      "business": {
        "cashPayViability": 15,
        "pricingLeverage": 20,
        "marketDifferentiation": 30,
        "ownerLeverage": 25,
        "marketDemand": 20,
        "efficiency": 45
      },
      "academicClinical": {
        "facultyRecognition": 60,
        "scholarship": 72,
        "teachingValue": 68,
        "evidenceDepth": 82,
        "facultyDemand": 42,
        "efficiency": 55
      }
    }
  },
  {
    "name": "Otago Exercise Programme",
    "type": "Program",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "35-40% fall reduction in RCTs. Medicare covers delivery. $938 cost savings per participant. Campbell et al meta-analysis: NNT=11 to prevent one fall.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 87,
        "efficiency": 70,
        "caseloadApplicability": 62,
        "reimbursement": 62,
        "marketDemand": 58,
        "patientSatisfaction": 68
      },
      "business": {
        "cashPayViability": 35,
        "pricingLeverage": 25,
        "marketDifferentiation": 30,
        "ownerLeverage": 55,
        "marketDemand": 25,
        "efficiency": 80
      },
      "academicClinical": {
        "facultyRecognition": 50,
        "scholarship": 70,
        "teachingValue": 65,
        "evidenceDepth": 85,
        "facultyDemand": 35,
        "efficiency": 80
      }
    }
  },
  {
    "name": "LSVT LOUD",
    "type": "Certification",
    "discipline": "SLP",
    "disciplines": [
      "SLP"
    ],
    "evidence": "50+ peer-reviewed studies. 5.05-point UPDRS-III motor improvement. Voice amplitude gains maintained at 2 years. ASHA-recognized evidence-based practice.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 80,
        "efficiency": 48,
        "caseloadApplicability": 55,
        "reimbursement": 52,
        "marketDemand": 82,
        "patientSatisfaction": 76
      },
      "business": {
        "cashPayViability": 55,
        "pricingLeverage": 60,
        "marketDifferentiation": 70,
        "ownerLeverage": 65,
        "marketDemand": 55,
        "efficiency": 50
      },
      "academicClinical": {
        "facultyRecognition": 60,
        "scholarship": 75,
        "teachingValue": 70,
        "evidenceDepth": 75,
        "facultyDemand": 50,
        "efficiency": 55
      }
    }
  },
  {
    "name": "ACRM Cognitive Rehabilitation",
    "type": "Certification",
    "discipline": "OT/PT/SLP",
    "disciplines": [
      "OT",
      "PT",
      "SLP"
    ],
    "evidence": "258 studies reviewed. 78.7% of comparisons favor structured cognitive rehab. ACRM Practice Standards. Gains in memory, attention, and executive function post-ABI.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 72,
        "efficiency": 45,
        "caseloadApplicability": 55,
        "reimbursement": 52,
        "marketDemand": 42,
        "patientSatisfaction": 65
      },
      "business": {
        "cashPayViability": 40,
        "pricingLeverage": 50,
        "marketDifferentiation": 65,
        "ownerLeverage": 55,
        "marketDemand": 35,
        "efficiency": 45
      },
      "academicClinical": {
        "facultyRecognition": 70,
        "scholarship": 80,
        "teachingValue": 72,
        "evidenceDepth": 75,
        "facultyDemand": 50,
        "efficiency": 50
      }
    }
  },
  {
    "name": "ACLM Lifestyle Medicine",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "6-pillar framework (nutrition, activity, sleep, stress, substance, relationships). 6,700+ certified practitioners. Type 2 DM remission documented with intensive lifestyle.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 75,
        "efficiency": 55,
        "caseloadApplicability": 60,
        "reimbursement": 50,
        "marketDemand": 38,
        "patientSatisfaction": 75
      },
      "business": {
        "cashPayViability": 75,
        "pricingLeverage": 65,
        "marketDifferentiation": 65,
        "ownerLeverage": 70,
        "marketDemand": 60,
        "efficiency": 45
      },
      "academicClinical": {
        "facultyRecognition": 45,
        "scholarship": 55,
        "teachingValue": 55,
        "evidenceDepth": 60,
        "facultyDemand": 25,
        "efficiency": 45
      }
    }
  },
  {
    "name": "HABIT/HABIT-ILE",
    "type": "Program",
    "discipline": "OT/PT",
    "disciplines": [
      "OT",
      "PT"
    ],
    "evidence": "Superior to conventional therapy for bilateral CP in RCTs. 60-90 hour intensive format. HABIT-ILE adds lower extremity to original hand-arm protocol.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 78,
        "efficiency": 35,
        "caseloadApplicability": 25,
        "reimbursement": 50,
        "marketDemand": 25,
        "patientSatisfaction": 72
      },
      "business": {
        "cashPayViability": 60,
        "pricingLeverage": 65,
        "marketDifferentiation": 75,
        "ownerLeverage": 40,
        "marketDemand": 45,
        "efficiency": 35
      },
      "academicClinical": {
        "facultyRecognition": 65,
        "scholarship": 78,
        "teachingValue": 65,
        "evidenceDepth": 78,
        "facultyDemand": 35,
        "efficiency": 40
      }
    }
  },
  {
    "name": "MBSR (Mindfulness-Based Stress Reduction)",
    "type": "Certification",
    "discipline": "All",
    "disciplines": [
      "PT",
      "OT",
      "SLP",
      "AT",
      "EP",
      "RT",
      "RN",
      "MT",
      "Audiology"
    ],
    "evidence": "Neuroplasticity evidence; fMRI shows amygdala volume reduction after 8 weeks. JAMA meta-analysis: moderate effect on anxiety, depression, pain.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 73,
        "efficiency": 52,
        "caseloadApplicability": 72,
        "reimbursement": 45,
        "marketDemand": 52,
        "patientSatisfaction": 78
      },
      "business": {
        "cashPayViability": 70,
        "pricingLeverage": 55,
        "marketDifferentiation": 45,
        "ownerLeverage": 75,
        "marketDemand": 70,
        "efficiency": 25
      },
      "academicClinical": {
        "facultyRecognition": 35,
        "scholarship": 55,
        "teachingValue": 50,
        "evidenceDepth": 60,
        "facultyDemand": 20,
        "efficiency": 30
      }
    }
  },
  {
    "name": "Matter of Balance",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "$938 annual medical cost reduction per participant. Group-based, lay-leader delivery model. CDC-endorsed. Fear of falling and activity restriction reduced.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 70,
        "efficiency": 85,
        "caseloadApplicability": 52,
        "reimbursement": 52,
        "marketDemand": 38,
        "patientSatisfaction": 72
      },
      "business": {
        "cashPayViability": 15,
        "pricingLeverage": 15,
        "marketDifferentiation": 20,
        "ownerLeverage": 45,
        "marketDemand": 15,
        "efficiency": 85
      },
      "academicClinical": {
        "facultyRecognition": 30,
        "scholarship": 50,
        "teachingValue": 45,
        "evidenceDepth": 60,
        "facultyDemand": 20,
        "efficiency": 85
      }
    }
  },
  {
    "name": "Telehealth Cardiac/Pulmonary",
    "type": "Technology",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "30-50% cost reduction vs in-person; maintained clinical effectiveness in RCTs. Wearable integration enables remote monitoring. Post-COVID access expansion.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 74,
        "efficiency": 65,
        "caseloadApplicability": 45,
        "reimbursement": 72,
        "marketDemand": 52,
        "patientSatisfaction": 80
      },
      "business": {
        "cashPayViability": 50,
        "pricingLeverage": 45,
        "marketDifferentiation": 55,
        "ownerLeverage": 75,
        "marketDemand": 45,
        "efficiency": 70
      },
      "academicClinical": {
        "facultyRecognition": 40,
        "scholarship": 55,
        "teachingValue": 55,
        "evidenceDepth": 50,
        "facultyDemand": 30,
        "efficiency": 65
      },
      "healthTech": {
        "industryPlacement": 58,
        "vendorDemand": 60,
        "salaryPremium": 48,
        "technicalSkillDepth": 50,
        "transitionFit": 60,
        "efficiency": 60
      }
    }
  },
  {
    "name": "Motivational Interviewing",
    "type": "Certification",
    "discipline": "All",
    "disciplines": [
      "PT",
      "OT",
      "SLP",
      "AT",
      "EP",
      "RT",
      "RN",
      "MT",
      "Audiology"
    ],
    "evidence": "1,800+ RCTs across health behaviors. Improves adherence 1.5-2x in physical rehab when integrated. MINT certification widely recognized.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 68,
        "efficiency": 72,
        "caseloadApplicability": 90,
        "reimbursement": 52,
        "marketDemand": 62,
        "patientSatisfaction": 72
      },
      "business": {
        "cashPayViability": 30,
        "pricingLeverage": 20,
        "marketDifferentiation": 25,
        "ownerLeverage": 55,
        "marketDemand": 25,
        "efficiency": 75
      },
      "academicClinical": {
        "facultyRecognition": 45,
        "scholarship": 70,
        "teachingValue": 70,
        "evidenceDepth": 80,
        "facultyDemand": 40,
        "efficiency": 75
      }
    }
  },
  {
    "name": "CIMT (Constraint-Induced Movement)",
    "type": "Certification",
    "discipline": "OT/PT",
    "disciplines": [
      "OT",
      "PT"
    ],
    "evidence": "EXCITE trial: 14-point Wolf Motor Function Test improvement sustained 2 years. Pediatric CIMT superior for hemiplegia. Neuroplasticity mechanism established.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 83,
        "efficiency": 38,
        "caseloadApplicability": 32,
        "reimbursement": 52,
        "marketDemand": 48,
        "patientSatisfaction": 68
      },
      "business": {
        "cashPayViability": 35,
        "pricingLeverage": 40,
        "marketDifferentiation": 55,
        "ownerLeverage": 45,
        "marketDemand": 30,
        "efficiency": 35
      },
      "academicClinical": {
        "facultyRecognition": 65,
        "scholarship": 80,
        "teachingValue": 75,
        "evidenceDepth": 85,
        "facultyDemand": 45,
        "efficiency": 40
      }
    }
  },
  {
    "name": "Health Coaching",
    "type": "Certification",
    "discipline": "All",
    "disciplines": [
      "PT",
      "OT",
      "SLP",
      "AT",
      "EP",
      "RT",
      "RN",
      "MT",
      "Audiology"
    ],
    "evidence": "New CPT codes 99401-99404 enable billing. Growing insurance recognition. Behavior change theory base; outcomes strongest for chronic disease management.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 65,
        "efficiency": 68,
        "caseloadApplicability": 75,
        "reimbursement": 62,
        "marketDemand": 62,
        "patientSatisfaction": 68
      },
      "business": {
        "cashPayViability": 70,
        "pricingLeverage": 55,
        "marketDifferentiation": 40,
        "ownerLeverage": 75,
        "marketDemand": 65,
        "efficiency": 65
      },
      "academicClinical": {
        "facultyRecognition": 30,
        "scholarship": 50,
        "teachingValue": 55,
        "evidenceDepth": 55,
        "facultyDemand": 25,
        "efficiency": 60
      }
    }
  },
  {
    "name": "Athletic Training BOC",
    "type": "Certification",
    "discipline": "AT",
    "disciplines": [
      "AT"
    ],
    "evidence": "22% injury reduction with AT presence. 50% reduction in school injury costs. 92% diagnostic accuracy. NATA consensus: AT reduces catastrophic injury risk.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 70,
        "efficiency": 22,
        "caseloadApplicability": 85,
        "reimbursement": 52,
        "marketDemand": 88,
        "patientSatisfaction": 72
      },
      "business": {
        "cashPayViability": 60,
        "pricingLeverage": 50,
        "marketDifferentiation": 55,
        "ownerLeverage": 65,
        "marketDemand": 55,
        "efficiency": 30
      },
      "academicClinical": {
        "facultyRecognition": 70,
        "scholarship": 70,
        "teachingValue": 75,
        "evidenceDepth": 70,
        "facultyDemand": 65,
        "efficiency": 25
      }
    }
  },
  {
    "name": "CDC STEADI Fall Prevention",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "Addresses $31B Medicare fall injury spend. EHR-integrated screening. Trifecta approach: screen, assess, intervene. CDC-backed algorithm.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 72,
        "efficiency": 95,
        "caseloadApplicability": 70,
        "reimbursement": 55,
        "marketDemand": 45,
        "patientSatisfaction": 65
      },
      "business": {
        "cashPayViability": 25,
        "pricingLeverage": 20,
        "marketDifferentiation": 20,
        "ownerLeverage": 45,
        "marketDemand": 25,
        "efficiency": 90
      },
      "academicClinical": {
        "facultyRecognition": 40,
        "scholarship": 60,
        "teachingValue": 70,
        "evidenceDepth": 65,
        "facultyDemand": 35,
        "efficiency": 90
      }
    }
  },
  {
    "name": "Physical Therapy Fellowship",
    "type": "Fellowship",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "Superior patient outcomes vs residency-trained (25,843-patient study). ABPTRFE-accredited. Fastest pathway to clinical expert performance.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 68,
        "efficiency": 18,
        "caseloadApplicability": 62,
        "reimbursement": 52,
        "marketDemand": 52,
        "patientSatisfaction": 68
      },
      "business": {
        "cashPayViability": 75,
        "pricingLeverage": 80,
        "marketDifferentiation": 85,
        "ownerLeverage": 40,
        "marketDemand": 50,
        "efficiency": 15
      },
      "academicClinical": {
        "facultyRecognition": 95,
        "scholarship": 85,
        "teachingValue": 90,
        "evidenceDepth": 75,
        "facultyDemand": 80,
        "efficiency": 20
      }
    }
  },
  {
    "name": "Pilates Rehabilitation",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "Network meta-analysis: superior to other exercise for chronic LBP. Gains in core strength, posture, and flexibility. Polestar/STOTT certifications most recognized.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 65,
        "efficiency": 58,
        "caseloadApplicability": 55,
        "reimbursement": 52,
        "marketDemand": 42,
        "patientSatisfaction": 68
      },
      "business": {
        "cashPayViability": 80,
        "pricingLeverage": 65,
        "marketDifferentiation": 50,
        "ownerLeverage": 70,
        "marketDemand": 75,
        "efficiency": 30
      },
      "academicClinical": {
        "facultyRecognition": 20,
        "scholarship": 35,
        "teachingValue": 35,
        "evidenceDepth": 35,
        "facultyDemand": 15,
        "efficiency": 30
      }
    }
  },
  {
    "name": "AI + Wearable Sensors",
    "type": "Technology",
    "discipline": "All",
    "disciplines": [
      "PT",
      "OT",
      "SLP",
      "AT",
      "EP",
      "RT",
      "RN",
      "MT",
      "Audiology"
    ],
    "evidence": "89% ROM accuracy vs goniometry. 98% gait pattern recognition. Remote monitoring enables between-session feedback. FDA Class II cleared devices available.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 62,
        "efficiency": 65,
        "caseloadApplicability": 55,
        "reimbursement": 52,
        "marketDemand": 38,
        "patientSatisfaction": 62
      },
      "business": {
        "cashPayViability": 65,
        "pricingLeverage": 70,
        "marketDifferentiation": 80,
        "ownerLeverage": 75,
        "marketDemand": 60,
        "efficiency": 55
      },
      "academicClinical": {
        "facultyRecognition": 70,
        "scholarship": 90,
        "teachingValue": 75,
        "evidenceDepth": 60,
        "facultyDemand": 55,
        "efficiency": 50
      },
      "healthTech": {
        "industryPlacement": 70,
        "vendorDemand": 72,
        "salaryPremium": 58,
        "technicalSkillDepth": 68,
        "transitionFit": 75,
        "efficiency": 62
      },
      "research": {
        "methodologyDepth": 45,
        "publicationTrack": 50,
        "grantReadiness": 48,
        "pathwayToIndependence": 35,
        "interdisciplinaryFit": 70,
        "efficiency": 60
      }
    }
  },
  {
    "name": "ABCDEF ICU Bundle",
    "type": "Protocol",
    "discipline": "PT/OT/RT",
    "disciplines": [
      "PT",
      "OT",
      "RT"
    ],
    "evidence": "68% mortality reduction when fully implemented. Reduced ICU-acquired weakness, delirium, and ventilator days. SCCM-endorsed. Strong implementation science base.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 78,
        "efficiency": 78,
        "caseloadApplicability": 55,
        "reimbursement": 52,
        "marketDemand": 55,
        "patientSatisfaction": 65
      },
      "business": {
        "cashPayViability": 10,
        "pricingLeverage": 10,
        "marketDifferentiation": 15,
        "ownerLeverage": 15,
        "marketDemand": 10,
        "efficiency": 85
      },
      "academicClinical": {
        "facultyRecognition": 55,
        "scholarship": 80,
        "teachingValue": 75,
        "evidenceDepth": 85,
        "facultyDemand": 45,
        "efficiency": 85
      },
      "research": {
        "methodologyDepth": 50,
        "publicationTrack": 55,
        "grantReadiness": 48,
        "pathwayToIndependence": 32,
        "interdisciplinaryFit": 65,
        "efficiency": 60
      }
    }
  },
  {
    "name": "LSVT BIG",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "Parkinson's mobility and gait improvement. Amplitude-based training; complements LSVT LOUD. 4x/week × 4 weeks protocol. UPDRS motor score improvements.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 72,
        "efficiency": 48,
        "caseloadApplicability": 52,
        "reimbursement": 52,
        "marketDemand": 78,
        "patientSatisfaction": 73
      },
      "business": {
        "cashPayViability": 45,
        "pricingLeverage": 50,
        "marketDifferentiation": 65,
        "ownerLeverage": 60,
        "marketDemand": 55,
        "efficiency": 45
      },
      "academicClinical": {
        "facultyRecognition": 50,
        "scholarship": 70,
        "teachingValue": 70,
        "evidenceDepth": 65,
        "facultyDemand": 45,
        "efficiency": 45
      }
    }
  },
  {
    "name": "IAYT Yoga Therapy",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "800-hour training standard. Growing evidence for chronic pain, anxiety, and cancer fatigue. IAYT accreditation establishes minimum training floor.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 60,
        "efficiency": 42,
        "caseloadApplicability": 55,
        "reimbursement": 40,
        "marketDemand": 28,
        "patientSatisfaction": 72
      },
      "business": {
        "cashPayViability": 72,
        "pricingLeverage": 55,
        "marketDifferentiation": 60,
        "ownerLeverage": 45,
        "marketDemand": 58,
        "efficiency": 25
      },
      "academicClinical": {
        "facultyRecognition": 25,
        "scholarship": 35,
        "teachingValue": 30,
        "evidenceDepth": 35,
        "facultyDemand": 15,
        "efficiency": 20
      }
    }
  },
  {
    "name": "Alexander Technique",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "ATEAM trial (BMJ): 24-lesson AT superior to massage for chronic LBP at 1 year. Limited evidence outside musculoskeletal. 1,600-hour training requirement.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 58,
        "efficiency": 12,
        "caseloadApplicability": 30,
        "reimbursement": 35,
        "marketDemand": 12,
        "patientSatisfaction": 62
      },
      "business": {
        "cashPayViability": 65,
        "pricingLeverage": 55,
        "marketDifferentiation": 70,
        "ownerLeverage": 25,
        "marketDemand": 40,
        "efficiency": 15
      },
      "academicClinical": {
        "facultyRecognition": 20,
        "scholarship": 30,
        "teachingValue": 25,
        "evidenceDepth": 40,
        "facultyDemand": 10,
        "efficiency": 15
      }
    }
  },
  {
    "name": "IMOT Intensive Therapy",
    "type": "Program",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "94% of children achieve motor improvements in camp format. 60-120 hour intensive delivery. Emerging evidence for CP and ABI populations.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 65,
        "efficiency": 32,
        "caseloadApplicability": 22,
        "reimbursement": 52,
        "marketDemand": 18,
        "patientSatisfaction": 68
      },
      "business": {
        "cashPayViability": 80,
        "pricingLeverage": 70,
        "marketDifferentiation": 65,
        "ownerLeverage": 60,
        "marketDemand": 55,
        "efficiency": 40
      },
      "academicClinical": {
        "facultyRecognition": 25,
        "scholarship": 25,
        "teachingValue": 30,
        "evidenceDepth": 30,
        "facultyDemand": 15,
        "efficiency": 35
      }
    }
  },
  {
    "name": "Blood Flow Restriction (BFR)",
    "type": "Technology",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "Equal strength gains to high-load resistance at 20-50% 1RM loads. Zero serious adverse events in systematic reviews. Post-surgical and elderly applications strongest.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 68,
        "efficiency": 78,
        "caseloadApplicability": 72,
        "reimbursement": 52,
        "marketDemand": 75,
        "patientSatisfaction": 58
      },
      "business": {
        "cashPayViability": 70,
        "pricingLeverage": 55,
        "marketDifferentiation": 50,
        "ownerLeverage": 70,
        "marketDemand": 60,
        "efficiency": 80
      },
      "academicClinical": {
        "facultyRecognition": 50,
        "scholarship": 70,
        "teachingValue": 70,
        "evidenceDepth": 75,
        "facultyDemand": 35,
        "efficiency": 75
      }
    }
  },
  {
    "name": "Ergonomic Assessment",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "OSHA compliance standard. Work-related MSK injury prevention evidence consistent. Return-to-work facilitation reduces indemnity costs.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 55,
        "efficiency": 65,
        "caseloadApplicability": 55,
        "reimbursement": 55,
        "marketDemand": 52,
        "patientSatisfaction": 58
      },
      "business": {
        "cashPayViability": 55,
        "pricingLeverage": 50,
        "marketDifferentiation": 35,
        "ownerLeverage": 75,
        "marketDemand": 45,
        "efficiency": 70
      },
      "academicClinical": {
        "facultyRecognition": 30,
        "scholarship": 45,
        "teachingValue": 50,
        "evidenceDepth": 50,
        "facultyDemand": 20,
        "efficiency": 65
      }
    }
  },
  {
    "name": "Vestibular Rehabilitation",
    "type": "Training",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "Strong CPG support from AAN and AAO-HNS. 6-week median treatment. Canalith repositioning >90% effective for BPPV. Cochrane support for chronic vestibular dysfunction.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 72,
        "efficiency": 62,
        "caseloadApplicability": 70,
        "reimbursement": 52,
        "marketDemand": 78,
        "patientSatisfaction": 68
      },
      "business": {
        "cashPayViability": 50,
        "pricingLeverage": 60,
        "marketDifferentiation": 70,
        "ownerLeverage": 75,
        "marketDemand": 55,
        "efficiency": 60
      },
      "academicClinical": {
        "facultyRecognition": 70,
        "scholarship": 80,
        "teachingValue": 80,
        "evidenceDepth": 85,
        "facultyDemand": 55,
        "efficiency": 60
      }
    }
  },
  {
    "name": "VR (Medical-Grade)",
    "type": "Technology",
    "discipline": "All",
    "disciplines": [
      "PT",
      "OT",
      "SLP",
      "AT",
      "EP",
      "RT",
      "RN",
      "MT",
      "Audiology"
    ],
    "evidence": "Engagement tool with comparable outcomes to conventional rehab for UE stroke and pain management. FDA-cleared products (MindMaze, XRHealth) available.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 58,
        "efficiency": 45,
        "caseloadApplicability": 40,
        "reimbursement": 52,
        "marketDemand": 32,
        "patientSatisfaction": 65
      },
      "business": {
        "cashPayViability": 55,
        "pricingLeverage": 55,
        "marketDifferentiation": 70,
        "ownerLeverage": 70,
        "marketDemand": 50,
        "efficiency": 50
      },
      "academicClinical": {
        "facultyRecognition": 40,
        "scholarship": 65,
        "teachingValue": 65,
        "evidenceDepth": 55,
        "facultyDemand": 25,
        "efficiency": 55
      },
      "healthTech": {
        "industryPlacement": 60,
        "vendorDemand": 58,
        "salaryPremium": 45,
        "technicalSkillDepth": 55,
        "transitionFit": 62,
        "efficiency": 55
      }
    }
  },
  {
    "name": "NIDCAP Neonatal",
    "type": "Certification",
    "discipline": "OT/PT/SLP",
    "disciplines": [
      "OT",
      "PT",
      "SLP"
    ],
    "evidence": "2.32-week reduced NICU LOS. $50K savings per 6 infants. Neurobehavioral outcomes improved at 9 months. NIDCAP Federation International certification.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 68,
        "efficiency": 25,
        "caseloadApplicability": 15,
        "reimbursement": 52,
        "marketDemand": 30,
        "patientSatisfaction": 62
      },
      "business": {
        "cashPayViability": 10,
        "pricingLeverage": 15,
        "marketDifferentiation": 40,
        "ownerLeverage": 10,
        "marketDemand": 10,
        "efficiency": 10
      },
      "academicClinical": {
        "facultyRecognition": 75,
        "scholarship": 80,
        "teachingValue": 60,
        "evidenceDepth": 70,
        "facultyDemand": 35,
        "efficiency": 20
      }
    }
  },
  {
    "name": "Neonatal Therapy Certification",
    "type": "Certification",
    "discipline": "PT/OT/SLP",
    "disciplines": [
      "PT",
      "OT",
      "SLP"
    ],
    "evidence": "NTCB certification. Standardized NICU competency framework. Feeding, positioning, and developmental outcomes in premature infants.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 62,
        "efficiency": 30,
        "caseloadApplicability": 20,
        "reimbursement": 52,
        "marketDemand": 42,
        "patientSatisfaction": 62
      },
      "business": {
        "cashPayViability": 10,
        "pricingLeverage": 15,
        "marketDifferentiation": 35,
        "ownerLeverage": 10,
        "marketDemand": 10,
        "efficiency": 35
      },
      "academicClinical": {
        "facultyRecognition": 65,
        "scholarship": 60,
        "teachingValue": 60,
        "evidenceDepth": 60,
        "facultyDemand": 35,
        "efficiency": 45
      }
    }
  },
  {
    "name": "Exoskeleton Training",
    "type": "Technology",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "FDA-approved (Ekso, ReWalk, Indego). Enables stepping in complete SCI. No superiority over intensive conventional gait training in ambulatory populations.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 55,
        "efficiency": 28,
        "caseloadApplicability": 12,
        "reimbursement": 42,
        "marketDemand": 22,
        "patientSatisfaction": 52
      },
      "business": {
        "cashPayViability": 45,
        "pricingLeverage": 60,
        "marketDifferentiation": 75,
        "ownerLeverage": 55,
        "marketDemand": 40,
        "efficiency": 30
      },
      "academicClinical": {
        "facultyRecognition": 40,
        "scholarship": 60,
        "teachingValue": 60,
        "evidenceDepth": 50,
        "facultyDemand": 25,
        "efficiency": 40
      },
      "healthTech": {
        "industryPlacement": 55,
        "vendorDemand": 50,
        "salaryPremium": 50,
        "technicalSkillDepth": 60,
        "transitionFit": 55,
        "efficiency": 38
      }
    }
  },
  {
    "name": "Transplant Rehabilitation",
    "type": "Specialty",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "15-20% mortality reduction with ERAS protocols incorporating rehabilitation. Pre-habilitation before transplant reduces post-operative complications.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 62,
        "efficiency": 45,
        "caseloadApplicability": 20,
        "reimbursement": 52,
        "marketDemand": 35,
        "patientSatisfaction": 60
      },
      "business": {
        "cashPayViability": 8,
        "pricingLeverage": 15,
        "marketDifferentiation": 35,
        "ownerLeverage": 10,
        "marketDemand": 8,
        "efficiency": 40
      },
      "academicClinical": {
        "facultyRecognition": 30,
        "scholarship": 35,
        "teachingValue": 30,
        "evidenceDepth": 45,
        "facultyDemand": 20,
        "efficiency": 45
      }
    }
  },
  {
    "name": "Robotic Devices (Lokomat)",
    "type": "Technology",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "Safe; FDA-cleared. Cochrane: no superiority over intensive conventional gait training. Best evidence for high-dose repetitions in early stroke.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 52,
        "efficiency": 28,
        "caseloadApplicability": 15,
        "reimbursement": 42,
        "marketDemand": 22,
        "patientSatisfaction": 55
      },
      "business": {
        "cashPayViability": 35,
        "pricingLeverage": 30,
        "marketDifferentiation": 55,
        "ownerLeverage": 45,
        "marketDemand": 30,
        "efficiency": 10
      },
      "academicClinical": {
        "facultyRecognition": 40,
        "scholarship": 60,
        "teachingValue": 55,
        "evidenceDepth": 55,
        "facultyDemand": 25,
        "efficiency": 15
      },
      "healthTech": {
        "industryPlacement": 50,
        "vendorDemand": 45,
        "salaryPremium": 45,
        "technicalSkillDepth": 58,
        "transitionFit": 50,
        "efficiency": 35
      }
    }
  },
  {
    "name": "Feldenkrais Method",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "Balance improvement in elderly consistent. MS and chronic pain applications emerging. 4-year practitioner training. Limited RCT quality.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 50,
        "efficiency": 15,
        "caseloadApplicability": 38,
        "reimbursement": 35,
        "marketDemand": 15,
        "patientSatisfaction": 58
      },
      "business": {
        "cashPayViability": 65,
        "pricingLeverage": 55,
        "marketDifferentiation": 60,
        "ownerLeverage": 15,
        "marketDemand": 35,
        "efficiency": 10
      },
      "academicClinical": {
        "facultyRecognition": 20,
        "scholarship": 20,
        "teachingValue": 25,
        "evidenceDepth": 25,
        "facultyDemand": 10,
        "efficiency": 10
      }
    }
  },
  {
    "name": "SOS Feeding Approach",
    "type": "Certification",
    "discipline": "OT/SLP",
    "disciplines": [
      "OT",
      "SLP"
    ],
    "evidence": "Sequential-Oral-Sensory approach for pediatric feeding disorders. Feasibility studies positive. Lacks RCT evidence; widely used in pediatric feeding clinics.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 48,
        "efficiency": 52,
        "caseloadApplicability": 45,
        "reimbursement": 52,
        "marketDemand": 52,
        "patientSatisfaction": 55
      },
      "business": {
        "cashPayViability": 70,
        "pricingLeverage": 60,
        "marketDifferentiation": 70,
        "ownerLeverage": 55,
        "marketDemand": 45,
        "efficiency": 55
      },
      "academicClinical": {
        "facultyRecognition": 45,
        "scholarship": 40,
        "teachingValue": 55,
        "evidenceDepth": 40,
        "facultyDemand": 35,
        "efficiency": 55
      }
    }
  },
  {
    "name": "COMT/Manual Therapy Certification",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "NAIOMT COMT certification. Manual therapy benefits for LBP, neck pain, and headache documented across multiple meta-analyses. Certification-specific outcomes limited.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 58,
        "efficiency": 45,
        "caseloadApplicability": 70,
        "reimbursement": 52,
        "marketDemand": 68,
        "patientSatisfaction": 60
      },
      "business": {
        "cashPayViability": 75,
        "pricingLeverage": 65,
        "marketDifferentiation": 45,
        "ownerLeverage": 25,
        "marketDemand": 55,
        "efficiency": 35
      },
      "academicClinical": {
        "facultyRecognition": 55,
        "scholarship": 50,
        "teachingValue": 70,
        "evidenceDepth": 55,
        "facultyDemand": 45,
        "efficiency": 40
      }
    }
  },
  {
    "name": "McKenzie Method (MDT)",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "Directional preference classification guides treatment. Cochrane: moderate evidence for acute/subacute LBP. Classification reliability good when trained. Widely available globally.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 63,
        "efficiency": 62,
        "caseloadApplicability": 70,
        "reimbursement": 52,
        "marketDemand": 72,
        "patientSatisfaction": 62
      },
      "business": {
        "cashPayViability": 55,
        "pricingLeverage": 50,
        "marketDifferentiation": 50,
        "ownerLeverage": 35,
        "marketDemand": 45,
        "efficiency": 40
      },
      "academicClinical": {
        "facultyRecognition": 50,
        "scholarship": 60,
        "teachingValue": 65,
        "evidenceDepth": 65,
        "facultyDemand": 35,
        "efficiency": 45
      }
    }
  },
  {
    "name": "Pain Neuroscience Education",
    "type": "Training",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "Moderate effects on pain catastrophizing, disability, and pain intensity when combined with other interventions. Most effective as adjunct, not standalone.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 58,
        "efficiency": 72,
        "caseloadApplicability": 85,
        "reimbursement": 52,
        "marketDemand": 62,
        "patientSatisfaction": 60
      },
      "business": {
        "cashPayViability": 40,
        "pricingLeverage": 35,
        "marketDifferentiation": 30,
        "ownerLeverage": 50,
        "marketDemand": 25,
        "efficiency": 70
      },
      "academicClinical": {
        "facultyRecognition": 50,
        "scholarship": 70,
        "teachingValue": 75,
        "evidenceDepth": 70,
        "facultyDemand": 40,
        "efficiency": 75
      }
    }
  },
  {
    "name": "FCE (Functional Capacity Eval)",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "Workers' comp standard for RTW decision-making. Isernhagen, EPIC, and Blankenship systems most validated. Reliability moderate; predictive validity for RTW is limited.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 52,
        "efficiency": 55,
        "caseloadApplicability": 48,
        "reimbursement": 68,
        "marketDemand": 48,
        "patientSatisfaction": 52
      },
      "business": {
        "cashPayViability": 30,
        "pricingLeverage": 55,
        "marketDifferentiation": 50,
        "ownerLeverage": 65,
        "marketDemand": 30,
        "efficiency": 60
      },
      "academicClinical": {
        "facultyRecognition": 25,
        "scholarship": 25,
        "teachingValue": 35,
        "evidenceDepth": 35,
        "facultyDemand": 15,
        "efficiency": 55
      }
    }
  },
  {
    "name": "Certified Hand Therapist (CHT)",
    "type": "Certification",
    "discipline": "OT/PT",
    "disciplines": [
      "OT",
      "PT"
    ],
    "evidence": "Improved outcomes for complex hand conditions and post-surgical recovery. HTCC certification requires 3 years experience + 4000 hours. Insurance-recognized specialty.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 55,
        "efficiency": 28,
        "caseloadApplicability": 62,
        "reimbursement": 72,
        "marketDemand": 88,
        "patientSatisfaction": 60
      },
      "business": {
        "cashPayViability": 45,
        "pricingLeverage": 75,
        "marketDifferentiation": 85,
        "ownerLeverage": 60,
        "marketDemand": 55,
        "efficiency": 15
      },
      "academicClinical": {
        "facultyRecognition": 75,
        "scholarship": 65,
        "teachingValue": 70,
        "evidenceDepth": 70,
        "facultyDemand": 55,
        "efficiency": 20
      }
    }
  },
  {
    "name": "Early Intervention Specialist",
    "type": "Certification",
    "discipline": "PT/OT/SLP",
    "disciplines": [
      "PT",
      "OT",
      "SLP"
    ],
    "evidence": "IDEA Part C federally mandated. 1/3 of EI graduates need no additional support at school age. £2.40 ROI per £1 invested (UK data). Brain plasticity window maximized.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 60,
        "efficiency": 52,
        "caseloadApplicability": 62,
        "reimbursement": 65,
        "marketDemand": 65,
        "patientSatisfaction": 62
      },
      "business": {
        "cashPayViability": 25,
        "pricingLeverage": 25,
        "marketDifferentiation": 35,
        "ownerLeverage": 55,
        "marketDemand": 30,
        "efficiency": 55
      },
      "academicClinical": {
        "facultyRecognition": 50,
        "scholarship": 55,
        "teachingValue": 65,
        "evidenceDepth": 60,
        "facultyDemand": 45,
        "efficiency": 55
      }
    }
  },
  {
    "name": "Multiple Sclerosis Certified Specialist",
    "type": "Certification",
    "discipline": "PT/OT/SLP",
    "disciplines": [
      "PT",
      "OT",
      "SLP"
    ],
    "evidence": "CMSC certification with MS-specific protocols. Fatigue management, mobility, and cognition outcomes documented in MS populations.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 52,
        "efficiency": 38,
        "caseloadApplicability": 42,
        "reimbursement": 52,
        "marketDemand": 45,
        "patientSatisfaction": 55
      },
      "business": {
        "cashPayViability": 20,
        "pricingLeverage": 25,
        "marketDifferentiation": 55,
        "ownerLeverage": 25,
        "marketDemand": 20,
        "efficiency": 55
      },
      "academicClinical": {
        "facultyRecognition": 55,
        "scholarship": 50,
        "teachingValue": 55,
        "evidenceDepth": 55,
        "facultyDemand": 30,
        "efficiency": 60
      }
    }
  },
  {
    "name": "Neurodevelopmental Treatment (NDT)",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "Positive outcomes for CP and stroke. Systematic reviews: beneficial but not superior to other approaches when dose-matched. No certified vs non-certified studies.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 50,
        "efficiency": 32,
        "caseloadApplicability": 65,
        "reimbursement": 52,
        "marketDemand": 72,
        "patientSatisfaction": 55
      },
      "business": {
        "cashPayViability": 35,
        "pricingLeverage": 35,
        "marketDifferentiation": 45,
        "ownerLeverage": 20,
        "marketDemand": 35,
        "efficiency": 25
      },
      "academicClinical": {
        "facultyRecognition": 30,
        "scholarship": 25,
        "teachingValue": 40,
        "evidenceDepth": 25,
        "facultyDemand": 25,
        "efficiency": 30
      }
    }
  },
  {
    "name": "Orthopedic Clinical Specialist (OCS)",
    "type": "Board Cert",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "ABPTS board certification. No demonstrated effectiveness difference vs non-certified. Evidence suggests better value per dollar for MSK care.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 52,
        "efficiency": 22,
        "caseloadApplicability": 82,
        "reimbursement": 52,
        "marketDemand": 92,
        "patientSatisfaction": 55
      },
      "business": {
        "cashPayViability": 55,
        "pricingLeverage": 55,
        "marketDifferentiation": 50,
        "ownerLeverage": 60,
        "marketDemand": 40,
        "efficiency": 45
      },
      "academicClinical": {
        "facultyRecognition": 92,
        "scholarship": 75,
        "teachingValue": 90,
        "evidenceDepth": 80,
        "facultyDemand": 88,
        "efficiency": 55
      }
    }
  },
  {
    "name": "BOC-Orthopedic Specialty",
    "type": "Board Cert",
    "discipline": "AT",
    "disciplines": [
      "AT"
    ],
    "evidence": "Athletic training orthopedic specialization. NATA-aligned certification. Limited comparative outcome studies vs generalist AT.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 48,
        "efficiency": 25,
        "caseloadApplicability": 72,
        "reimbursement": 52,
        "marketDemand": 42,
        "patientSatisfaction": 52
      },
      "business": {
        "cashPayViability": 45,
        "pricingLeverage": 40,
        "marketDifferentiation": 55,
        "ownerLeverage": 45,
        "marketDemand": 25,
        "efficiency": 50
      },
      "academicClinical": {
        "facultyRecognition": 45,
        "scholarship": 40,
        "teachingValue": 55,
        "evidenceDepth": 65,
        "facultyDemand": 35,
        "efficiency": 55
      }
    }
  },
  {
    "name": "Sports Clinical Specialist (SCS)",
    "type": "Board Cert",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "ABPTS board certification. Limited evidence of outcome differences. Efficiency gains from advanced sports medicine knowledge possible.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 48,
        "efficiency": 22,
        "caseloadApplicability": 60,
        "reimbursement": 52,
        "marketDemand": 65,
        "patientSatisfaction": 52
      },
      "business": {
        "cashPayViability": 80,
        "pricingLeverage": 75,
        "marketDifferentiation": 70,
        "ownerLeverage": 70,
        "marketDemand": 60,
        "efficiency": 40
      },
      "academicClinical": {
        "facultyRecognition": 85,
        "scholarship": 72,
        "teachingValue": 80,
        "evidenceDepth": 75,
        "facultyDemand": 70,
        "efficiency": 45
      }
    }
  },
  {
    "name": "Telehealth/Digital Health",
    "type": "Training",
    "discipline": "All",
    "disciplines": [
      "PT",
      "OT",
      "SLP",
      "AT",
      "EP",
      "RT",
      "RN",
      "MT",
      "Audiology"
    ],
    "evidence": "Effective for musculoskeletal, mental health, and chronic disease management. No certification-specific outcomes; skills-based training is primary value.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 50,
        "efficiency": 65,
        "caseloadApplicability": 85,
        "reimbursement": 55,
        "marketDemand": 58,
        "patientSatisfaction": 55
      },
      "business": {
        "cashPayViability": 65,
        "pricingLeverage": 35,
        "marketDifferentiation": 30,
        "ownerLeverage": 75,
        "marketDemand": 55,
        "efficiency": 85
      },
      "academicClinical": {
        "facultyRecognition": 35,
        "scholarship": 45,
        "teachingValue": 60,
        "evidenceDepth": 50,
        "facultyDemand": 40,
        "efficiency": 80
      },
      "healthTech": {
        "industryPlacement": 65,
        "vendorDemand": 68,
        "salaryPremium": 50,
        "technicalSkillDepth": 48,
        "transitionFit": 70,
        "efficiency": 72
      }
    }
  },
  {
    "name": "Wound Care Specialist",
    "type": "Certification",
    "discipline": "PT/OT/RN",
    "disciplines": [
      "PT",
      "OT",
      "RN"
    ],
    "evidence": "40-60% amputation reduction in certified wound centers. ANCC/WOCN certification. Limited PT/OT-specific outcome data vs RN/MD wound specialists.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 55,
        "efficiency": 45,
        "caseloadApplicability": 52,
        "reimbursement": 65,
        "marketDemand": 72,
        "patientSatisfaction": 52
      },
      "business": {
        "cashPayViability": 15,
        "pricingLeverage": 25,
        "marketDifferentiation": 50,
        "ownerLeverage": 30,
        "marketDemand": 15,
        "efficiency": 50
      },
      "academicClinical": {
        "facultyRecognition": 50,
        "scholarship": 50,
        "teachingValue": 55,
        "evidenceDepth": 65,
        "facultyDemand": 30,
        "efficiency": 55
      }
    }
  },
  {
    "name": "Certified Aging in Place Specialist (CAPS)",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "NAHB certification. Home modification planning for aging adults. Limited outcome data on falls prevented or ADL maintained post-modification.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 45,
        "efficiency": 68,
        "caseloadApplicability": 58,
        "reimbursement": 52,
        "marketDemand": 42,
        "patientSatisfaction": 55
      },
      "business": {
        "cashPayViability": 70,
        "pricingLeverage": 55,
        "marketDifferentiation": 65,
        "ownerLeverage": 70,
        "marketDemand": 55,
        "efficiency": 80
      },
      "academicClinical": {
        "facultyRecognition": 30,
        "scholarship": 25,
        "teachingValue": 45,
        "evidenceDepth": 35,
        "facultyDemand": 20,
        "efficiency": 70
      }
    }
  },
  {
    "name": "ACSM Clinical Exercise Physiologist",
    "type": "Certification",
    "discipline": "EP",
    "disciplines": [
      "EP"
    ],
    "evidence": "ACSM-CEP credential. Exercise testing and prescription in clinical populations. Limited comparison to non-certified EP outcomes.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 50,
        "efficiency": 42,
        "caseloadApplicability": 58,
        "reimbursement": 52,
        "marketDemand": 52,
        "patientSatisfaction": 52
      },
      "business": {
        "cashPayViability": 55,
        "pricingLeverage": 45,
        "marketDifferentiation": 55,
        "ownerLeverage": 60,
        "marketDemand": 35,
        "efficiency": 50
      },
      "academicClinical": {
        "facultyRecognition": 60,
        "scholarship": 65,
        "teachingValue": 70,
        "evidenceDepth": 80,
        "facultyDemand": 45,
        "efficiency": 55
      }
    }
  },
  {
    "name": "Certified Strength & Conditioning (CSCS)",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "NSCA credential for athletic performance. Not rehabilitation-specific. Limited evidence of superiority over standard PT for clinical outcomes.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 45,
        "efficiency": 52,
        "caseloadApplicability": 45,
        "reimbursement": 52,
        "marketDemand": 58,
        "patientSatisfaction": 50
      },
      "business": {
        "cashPayViability": 75,
        "pricingLeverage": 50,
        "marketDifferentiation": 30,
        "ownerLeverage": 75,
        "marketDemand": 65,
        "efficiency": 80
      },
      "academicClinical": {
        "facultyRecognition": 45,
        "scholarship": 55,
        "teachingValue": 65,
        "evidenceDepth": 75,
        "facultyDemand": 35,
        "efficiency": 75
      }
    }
  },
  {
    "name": "Certified Brain Injury Specialist",
    "type": "Certification",
    "discipline": "PT/OT/SLP",
    "disciplines": [
      "PT",
      "OT",
      "SLP"
    ],
    "evidence": "BIAA CBIS certification. Standardized care protocols for TBI populations. No comparative outcome studies vs non-certified clinicians.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 48,
        "efficiency": 55,
        "caseloadApplicability": 50,
        "reimbursement": 55,
        "marketDemand": 48,
        "patientSatisfaction": 50
      },
      "business": {
        "cashPayViability": 15,
        "pricingLeverage": 20,
        "marketDifferentiation": 30,
        "ownerLeverage": 25,
        "marketDemand": 15,
        "efficiency": 65
      },
      "academicClinical": {
        "facultyRecognition": 35,
        "scholarship": 40,
        "teachingValue": 55,
        "evidenceDepth": 55,
        "facultyDemand": 30,
        "efficiency": 70
      }
    }
  },
  {
    "name": "Certified Stroke Rehabilitation Specialist",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "CSRS certification. Stroke-specific rehabilitation protocols. No comparative outcome data vs non-certified stroke rehab.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 48,
        "efficiency": 58,
        "caseloadApplicability": 55,
        "reimbursement": 52,
        "marketDemand": 45,
        "patientSatisfaction": 52
      },
      "business": {
        "cashPayViability": 18,
        "pricingLeverage": 25,
        "marketDifferentiation": 35,
        "ownerLeverage": 25,
        "marketDemand": 18,
        "efficiency": 55
      },
      "academicClinical": {
        "facultyRecognition": 45,
        "scholarship": 50,
        "teachingValue": 65,
        "evidenceDepth": 70,
        "facultyDemand": 35,
        "efficiency": 60
      }
    }
  },
  {
    "name": "Hippotherapy",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "AHA-PATH certification. High patient satisfaction but small effect sizes in RCTs. Beneficial for CP, MS, and ASD in feasibility studies.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 40,
        "efficiency": 22,
        "caseloadApplicability": 10,
        "reimbursement": 40,
        "marketDemand": 18,
        "patientSatisfaction": 68
      },
      "business": {
        "cashPayViability": 60,
        "pricingLeverage": 55,
        "marketDifferentiation": 80,
        "ownerLeverage": 25,
        "marketDemand": 45,
        "efficiency": 20
      },
      "academicClinical": {
        "facultyRecognition": 25,
        "scholarship": 30,
        "teachingValue": 30,
        "evidenceDepth": 35,
        "facultyDemand": 15,
        "efficiency": 25
      }
    }
  },
  {
    "name": "Robotic Upper Limb",
    "type": "Technology",
    "discipline": "OT",
    "disciplines": [
      "OT"
    ],
    "evidence": "Cochrane: no superiority over dose-matched conventional OT for upper limb stroke. High repetition capacity. FDA-cleared devices (InMotion ARM, Amadeo).",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 42,
        "efficiency": 28,
        "caseloadApplicability": 12,
        "reimbursement": 45,
        "marketDemand": 20,
        "patientSatisfaction": 48
      },
      "business": {
        "cashPayViability": 55,
        "pricingLeverage": 60,
        "marketDifferentiation": 70,
        "ownerLeverage": 50,
        "marketDemand": 40,
        "efficiency": 25
      },
      "academicClinical": {
        "facultyRecognition": 35,
        "scholarship": 55,
        "teachingValue": 50,
        "evidenceDepth": 50,
        "facultyDemand": 20,
        "efficiency": 30
      },
      "healthTech": {
        "industryPlacement": 48,
        "vendorDemand": 42,
        "salaryPremium": 42,
        "technicalSkillDepth": 55,
        "transitionFit": 48,
        "efficiency": 35
      }
    }
  },
  {
    "name": "Certified Mulligan Practitioner",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "Mobilization with movement (MWM) technique. Immediate pain relief documented for shoulder, ankle, knee, and cervical spine in RCTs. Long-term superiority not established.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 45,
        "efficiency": 55,
        "caseloadApplicability": 70,
        "reimbursement": 52,
        "marketDemand": 52,
        "patientSatisfaction": 50
      },
      "business": {
        "cashPayViability": 60,
        "pricingLeverage": 55,
        "marketDifferentiation": 50,
        "ownerLeverage": 30,
        "marketDemand": 30,
        "efficiency": 55
      },
      "academicClinical": {
        "facultyRecognition": 25,
        "scholarship": 35,
        "teachingValue": 45,
        "evidenceDepth": 45,
        "facultyDemand": 15,
        "efficiency": 55
      }
    }
  },
  {
    "name": "Pelvic Floor Rehabilitation (PRPC)",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "APTA PRPC certification. Cochrane: pelvic floor PT superior to watchful waiting for stress/urge urinary incontinence. Large underserved population.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 50,
        "efficiency": 35,
        "caseloadApplicability": 45,
        "reimbursement": 55,
        "marketDemand": 72,
        "patientSatisfaction": 55
      },
      "business": {
        "cashPayViability": 92,
        "pricingLeverage": 85,
        "marketDifferentiation": 70,
        "ownerLeverage": 70,
        "marketDemand": 80,
        "efficiency": 55
      },
      "academicClinical": {
        "facultyRecognition": 45,
        "scholarship": 45,
        "teachingValue": 60,
        "evidenceDepth": 55,
        "facultyDemand": 35,
        "efficiency": 55
      }
    }
  },
  {
    "name": "Women's Health Clinical Specialist",
    "type": "Board Specialty",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "The clinical DOMAIN this credential attests to has strong, high-quality evidence: Cochrane reviews establish pelvic floor muscle training as first-line care for female urinary incontinence (Dumoulin 2018), with good RCT/SR support for pelvic organ prolapse, peripartum lumbopelvic pain, fecal incontinence, and provoked vestibulodynia/dyspareunia, and weaker evidence for diastasis recti. Evidence about the CREDENTIAL ITSELF is genuinely thin: there are no published outcome studies comparing WCS-certified pelvic PTs to non-certified pelvic PTs, and the broader literature on ABPTS board specialization shows mixed results (employer-perceived value and a modest salary premium, but a 2025 survey found no difference in guideline adherence by specialization). Note the credential was formally renamed Pelvic and Women's Health Clinical Specialist (PWCS) by ABPTS in September 2025; ~954 specialists were certified as of July 2025.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 60,
        "efficiency": 38,
        "caseloadApplicability": 52,
        "reimbursement": 52,
        "marketDemand": 60,
        "patientSatisfaction": 60
      },
      "business": {
        "cashPayViability": 90,
        "pricingLeverage": 86,
        "marketDifferentiation": 85,
        "ownerLeverage": 70,
        "marketDemand": 72,
        "efficiency": 20
      },
      "academicClinical": {
        "facultyRecognition": 88,
        "scholarship": 70,
        "teachingValue": 78,
        "evidenceDepth": 62,
        "facultyDemand": 62,
        "efficiency": 25
      }
    }
  },
  {
    "name": "Certified Driver Rehabilitation Specialist",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "CDRS certification. Driving evaluation and adaptive equipment prescription. Functional independence outcome (return to driving) is meaningful for patient autonomy.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 42,
        "efficiency": 45,
        "caseloadApplicability": 18,
        "reimbursement": 55,
        "marketDemand": 38,
        "patientSatisfaction": 48
      },
      "business": {
        "cashPayViability": 75,
        "pricingLeverage": 70,
        "marketDifferentiation": 90,
        "ownerLeverage": 55,
        "marketDemand": 55,
        "efficiency": 20
      },
      "academicClinical": {
        "facultyRecognition": 25,
        "scholarship": 25,
        "teachingValue": 30,
        "evidenceDepth": 30,
        "facultyDemand": 15,
        "efficiency": 25
      }
    }
  },
  {
    "name": "Pediatric Clinical Specialist (PCS)",
    "type": "Board Cert",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "ABPTS board certification. No comparative outcome studies vs non-PCS-certified pediatric PT. Expertise signal for employers.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 40,
        "efficiency": 25,
        "caseloadApplicability": 72,
        "reimbursement": 52,
        "marketDemand": 55,
        "patientSatisfaction": 45
      },
      "business": {
        "cashPayViability": 55,
        "pricingLeverage": 60,
        "marketDifferentiation": 70,
        "ownerLeverage": 50,
        "marketDemand": 50,
        "efficiency": 20
      },
      "academicClinical": {
        "facultyRecognition": 92,
        "scholarship": 75,
        "teachingValue": 85,
        "evidenceDepth": 65,
        "facultyDemand": 70,
        "efficiency": 25
      }
    }
  },
  {
    "name": "Board Certification in Pediatrics",
    "type": "Board Cert",
    "discipline": "OT",
    "disciplines": [
      "OT"
    ],
    "evidence": "AOTA certification. Pediatric OT specialty credential. No comparative outcome studies vs non-certified pediatric OT.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 38,
        "efficiency": 28,
        "caseloadApplicability": 72,
        "reimbursement": 52,
        "marketDemand": 52,
        "patientSatisfaction": 45
      },
      "business": {
        "cashPayViability": 55,
        "pricingLeverage": 60,
        "marketDifferentiation": 70,
        "ownerLeverage": 50,
        "marketDemand": 50,
        "efficiency": 25
      },
      "academicClinical": {
        "facultyRecognition": 90,
        "scholarship": 70,
        "teachingValue": 85,
        "evidenceDepth": 60,
        "facultyDemand": 70,
        "efficiency": 30
      }
    }
  },
  {
    "name": "Virtual/Augmented Reality",
    "type": "Training",
    "discipline": "All",
    "disciplines": [
      "PT",
      "OT",
      "SLP",
      "AT",
      "EP",
      "RT",
      "RN",
      "MT",
      "Audiology"
    ],
    "evidence": "Emerging technology. VR training certifications are largely vendor-specific. Insufficient peer-reviewed evidence for training certification outcomes.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 42,
        "efficiency": 48,
        "caseloadApplicability": 42,
        "reimbursement": 52,
        "marketDemand": 30,
        "patientSatisfaction": 50
      },
      "business": {
        "cashPayViability": 35,
        "pricingLeverage": 40,
        "marketDifferentiation": 55,
        "ownerLeverage": 50,
        "marketDemand": 30,
        "efficiency": 35
      },
      "academicClinical": {
        "facultyRecognition": 35,
        "scholarship": 55,
        "teachingValue": 45,
        "evidenceDepth": 40,
        "facultyDemand": 20,
        "efficiency": 40
      },
      "healthTech": {
        "industryPlacement": 50,
        "vendorDemand": 50,
        "salaryPremium": 42,
        "technicalSkillDepth": 50,
        "transitionFit": 55,
        "efficiency": 52
      }
    }
  },
  {
    "name": "Ventilator Weaning",
    "type": "Protocol",
    "discipline": "RT/PT",
    "disciplines": [
      "RT",
      "PT"
    ],
    "evidence": "RT-led protocolized weaning reduces ventilator days. PT/OT early mobility integration reduces ICU-acquired weakness. PT-specific weaning certification role limited.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 40,
        "efficiency": 35,
        "caseloadApplicability": 35,
        "reimbursement": 52,
        "marketDemand": 50,
        "patientSatisfaction": 35
      },
      "business": {
        "cashPayViability": 5,
        "pricingLeverage": 10,
        "marketDifferentiation": 20,
        "ownerLeverage": 10,
        "marketDemand": 5,
        "efficiency": 30
      },
      "academicClinical": {
        "facultyRecognition": 40,
        "scholarship": 55,
        "teachingValue": 55,
        "evidenceDepth": 65,
        "facultyDemand": 25,
        "efficiency": 45
      }
    }
  },
  {
    "name": "Lymphedema (CLT/LANA)",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "LANA examination. Complete Decongestive Therapy (CDT) shows consistent volume reduction in systematic reviews. 200-hour training standard. Insurance-recognized.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 45,
        "efficiency": 38,
        "caseloadApplicability": 45,
        "reimbursement": 70,
        "marketDemand": 72,
        "patientSatisfaction": 45
      },
      "business": {
        "cashPayViability": 45,
        "pricingLeverage": 55,
        "marketDifferentiation": 70,
        "ownerLeverage": 65,
        "marketDemand": 55,
        "efficiency": 35
      },
      "academicClinical": {
        "facultyRecognition": 55,
        "scholarship": 60,
        "teachingValue": 60,
        "evidenceDepth": 70,
        "facultyDemand": 40,
        "efficiency": 35
      }
    }
  },
  {
    "name": "Seating and Mobility Specialist",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "SMS certification from RESNA. Complex wheelchair and seating prescription. Reduces pressure injuries and improves participation.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 40,
        "efficiency": 38,
        "caseloadApplicability": 40,
        "reimbursement": 58,
        "marketDemand": 55,
        "patientSatisfaction": 42
      },
      "business": {
        "cashPayViability": 15,
        "pricingLeverage": 35,
        "marketDifferentiation": 60,
        "ownerLeverage": 40,
        "marketDemand": 25,
        "efficiency": 40
      },
      "academicClinical": {
        "facultyRecognition": 50,
        "scholarship": 45,
        "teachingValue": 60,
        "evidenceDepth": 50,
        "facultyDemand": 35,
        "efficiency": 50
      },
      "healthTech": {
        "industryPlacement": 48,
        "vendorDemand": 50,
        "salaryPremium": 42,
        "technicalSkillDepth": 48,
        "transitionFit": 52,
        "efficiency": 42
      }
    }
  },
  {
    "name": "Dry Needling",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "Mixed systematic review evidence. Most effective for trigger point pain short-term. State-dependent practice. IL permits PT dry needling with training.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 40,
        "efficiency": 68,
        "caseloadApplicability": 72,
        "reimbursement": 55,
        "marketDemand": 88,
        "patientSatisfaction": 42
      },
      "business": {
        "cashPayViability": 85,
        "pricingLeverage": 75,
        "marketDifferentiation": 60,
        "ownerLeverage": 55,
        "marketDemand": 75,
        "efficiency": 65
      },
      "academicClinical": {
        "facultyRecognition": 35,
        "scholarship": 50,
        "teachingValue": 45,
        "evidenceDepth": 45,
        "facultyDemand": 20,
        "efficiency": 60
      }
    }
  },
  {
    "name": "TPI Golf Certification",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "Titleist Performance Institute credential. Sport-specific movement screening for golf. Limited peer-reviewed clinical outcome data for rehabilitation context.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 35,
        "efficiency": 78,
        "caseloadApplicability": 18,
        "reimbursement": 35,
        "marketDemand": 28,
        "patientSatisfaction": 40
      },
      "business": {
        "cashPayViability": 90,
        "pricingLeverage": 80,
        "marketDifferentiation": 70,
        "ownerLeverage": 50,
        "marketDemand": 70,
        "efficiency": 70
      },
      "academicClinical": {
        "facultyRecognition": 15,
        "scholarship": 25,
        "teachingValue": 25,
        "evidenceDepth": 25,
        "facultyDemand": 10,
        "efficiency": 55
      }
    }
  },
  {
    "name": "ASTYM Therapy",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "Soft tissue mobilization technique. Limited comparative evidence vs IASTM or standard manual therapy. Training required for certification.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 36,
        "efficiency": 62,
        "caseloadApplicability": 65,
        "reimbursement": 52,
        "marketDemand": 52,
        "patientSatisfaction": 40
      },
      "business": {
        "cashPayViability": 50,
        "pricingLeverage": 45,
        "marketDifferentiation": 40,
        "ownerLeverage": 55,
        "marketDemand": 35,
        "efficiency": 50
      },
      "academicClinical": {
        "facultyRecognition": 20,
        "scholarship": 30,
        "teachingValue": 30,
        "evidenceDepth": 30,
        "facultyDemand": 10,
        "efficiency": 50
      }
    }
  },
  {
    "name": "Rolfing/Structural Integration",
    "type": "Certification",
    "discipline": "MT",
    "disciplines": [
      "MT"
    ],
    "evidence": "Systematic reviews find insufficient evidence. Small studies suggest postural and pain benefits. 700-hour training. Not covered by most payers.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 32,
        "efficiency": 22,
        "caseloadApplicability": 35,
        "reimbursement": 35,
        "marketDemand": 10,
        "patientSatisfaction": 42
      },
      "business": {
        "cashPayViability": 80,
        "pricingLeverage": 70,
        "marketDifferentiation": 75,
        "ownerLeverage": 25,
        "marketDemand": 55,
        "efficiency": 15
      },
      "academicClinical": {
        "facultyRecognition": 10,
        "scholarship": 15,
        "teachingValue": 15,
        "evidenceDepth": 20,
        "facultyDemand": 5,
        "efficiency": 15
      }
    }
  },
  {
    "name": "Therapeutic Pain Specialist",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "TPS certification. Pain neuroscience education advanced application. Limited outcome studies specific to this credential.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 36,
        "efficiency": 55,
        "caseloadApplicability": 80,
        "reimbursement": 52,
        "marketDemand": 55,
        "patientSatisfaction": 38
      },
      "business": {
        "cashPayViability": 55,
        "pricingLeverage": 55,
        "marketDifferentiation": 60,
        "ownerLeverage": 60,
        "marketDemand": 40,
        "efficiency": 50
      },
      "academicClinical": {
        "facultyRecognition": 55,
        "scholarship": 75,
        "teachingValue": 70,
        "evidenceDepth": 75,
        "facultyDemand": 35,
        "efficiency": 50
      }
    }
  },
  {
    "name": "Craniosacral Therapy/Upledger",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "Systematic reviews find insufficient evidence. CSF rhythm detection reliability very low in blinded studies. Theoretical mechanism lacks anatomical support.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 14,
        "efficiency": 35,
        "caseloadApplicability": 40,
        "reimbursement": 35,
        "marketDemand": 18,
        "patientSatisfaction": 28
      },
      "business": {
        "cashPayViability": 70,
        "pricingLeverage": 55,
        "marketDifferentiation": 55,
        "ownerLeverage": 30,
        "marketDemand": 45,
        "efficiency": 25
      },
      "academicClinical": {
        "facultyRecognition": 10,
        "scholarship": 15,
        "teachingValue": 15,
        "evidenceDepth": 15,
        "facultyDemand": 5,
        "efficiency": 25
      }
    }
  },
  {
    "name": "Certified Low Vision Therapist",
    "type": "Certification",
    "discipline": "OT",
    "disciplines": [
      "OT"
    ],
    "evidence": "CLVT certification from Academy for Certification of Vision Rehabilitation. Vision rehabilitation functional outcomes documented. Limited comparative studies.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 32,
        "efficiency": 42,
        "caseloadApplicability": 22,
        "reimbursement": 52,
        "marketDemand": 42,
        "patientSatisfaction": 38
      },
      "business": {
        "cashPayViability": 25,
        "pricingLeverage": 40,
        "marketDifferentiation": 70,
        "ownerLeverage": 45,
        "marketDemand": 20,
        "efficiency": 35
      },
      "academicClinical": {
        "facultyRecognition": 45,
        "scholarship": 40,
        "teachingValue": 55,
        "evidenceDepth": 50,
        "facultyDemand": 30,
        "efficiency": 35
      }
    }
  },
  {
    "name": "Suit Therapy",
    "type": "Equipment",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "TheraSuit/Adeli suit. Multiple studies: no additional benefit over control PT when dose-matched. High family interest but evidence does not support premium use.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 28,
        "efficiency": 38,
        "caseloadApplicability": 15,
        "reimbursement": 40,
        "marketDemand": 12,
        "patientSatisfaction": 35
      },
      "business": {
        "cashPayViability": 75,
        "pricingLeverage": 70,
        "marketDifferentiation": 65,
        "ownerLeverage": 60,
        "marketDemand": 55,
        "efficiency": 25
      },
      "academicClinical": {
        "facultyRecognition": 15,
        "scholarship": 25,
        "teachingValue": 25,
        "evidenceDepth": 25,
        "facultyDemand": 10,
        "efficiency": 20
      }
    }
  },
  {
    "name": "Advanced Competency in Home Health",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "ACHH certification from APTA. Home health specialty competency. No comparative outcome studies vs non-certified home health PT/OT.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 28,
        "efficiency": 58,
        "caseloadApplicability": 62,
        "reimbursement": 52,
        "marketDemand": 42,
        "patientSatisfaction": 32
      },
      "business": {
        "cashPayViability": 15,
        "pricingLeverage": 25,
        "marketDifferentiation": 30,
        "ownerLeverage": 40,
        "marketDemand": 20,
        "efficiency": 70
      },
      "academicClinical": {
        "facultyRecognition": 35,
        "scholarship": 30,
        "teachingValue": 45,
        "evidenceDepth": 40,
        "facultyDemand": 25,
        "efficiency": 65
      }
    }
  },
  {
    "name": "Barral Institute Certification",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "Visceral and neural manipulation. Systematic reviews find insufficient evidence. Detection reliability unstudied. Theoretical mechanisms not supported by anatomy.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 16,
        "efficiency": 18,
        "caseloadApplicability": 32,
        "reimbursement": 32,
        "marketDemand": 8,
        "patientSatisfaction": 25
      },
      "business": {
        "cashPayViability": 80,
        "pricingLeverage": 75,
        "marketDifferentiation": 75,
        "ownerLeverage": 25,
        "marketDemand": 50,
        "efficiency": 20
      },
      "academicClinical": {
        "facultyRecognition": 15,
        "scholarship": 20,
        "teachingValue": 25,
        "evidenceDepth": 20,
        "facultyDemand": 10,
        "efficiency": 15
      }
    }
  },
  {
    "name": "Transitional DPT (tDPT)",
    "type": "Degree",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "No outcome improvements documented vs MPT graduates. Primarily credential equivalency degree. Administrative/career value without clinical outcome benefit.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 25,
        "efficiency": 22,
        "caseloadApplicability": 50,
        "reimbursement": 52,
        "marketDemand": 30,
        "patientSatisfaction": 28
      },
      "business": {
        "cashPayViability": 20,
        "pricingLeverage": 25,
        "marketDifferentiation": 20,
        "ownerLeverage": 30,
        "marketDemand": 30,
        "efficiency": 35
      },
      "academicClinical": {
        "facultyRecognition": 55,
        "scholarship": 35,
        "teachingValue": 50,
        "evidenceDepth": 40,
        "facultyDemand": 50,
        "efficiency": 40
      },
      "research": {
        "methodologyDepth": 35,
        "publicationTrack": 25,
        "grantReadiness": 22,
        "pathwayToIndependence": 28,
        "interdisciplinaryFit": 35,
        "efficiency": 55
      }
    }
  },
  {
    "name": "Physical Therapy Residency",
    "type": "Training",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "ABPTRFE-accredited. Surprising finding: worse efficiency than entry-level in large comparative study (25,843 patients). Fellowship outperforms residency. May reflect case complexity.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 28,
        "efficiency": 18,
        "caseloadApplicability": 65,
        "reimbursement": 52,
        "marketDemand": 58,
        "patientSatisfaction": 28
      },
      "business": {
        "cashPayViability": 55,
        "pricingLeverage": 55,
        "marketDifferentiation": 65,
        "ownerLeverage": 50,
        "marketDemand": 35,
        "efficiency": 25
      },
      "academicClinical": {
        "facultyRecognition": 90,
        "scholarship": 75,
        "teachingValue": 85,
        "evidenceDepth": 75,
        "facultyDemand": 80,
        "efficiency": 30
      }
    }
  },
  {
    "name": "Certified Exercise Expert for Aging Adults",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "CEEAA certification from APTA. Exercise prescription for older adults. No comparative outcome studies vs non-certified.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 22,
        "efficiency": 75,
        "caseloadApplicability": 68,
        "reimbursement": 52,
        "marketDemand": 35,
        "patientSatisfaction": 28
      },
      "business": {
        "cashPayViability": 60,
        "pricingLeverage": 45,
        "marketDifferentiation": 45,
        "ownerLeverage": 60,
        "marketDemand": 40,
        "efficiency": 70
      },
      "academicClinical": {
        "facultyRecognition": 35,
        "scholarship": 35,
        "teachingValue": 55,
        "evidenceDepth": 55,
        "facultyDemand": 25,
        "efficiency": 65
      }
    }
  },
  {
    "name": "Geriatric Clinical Specialist (GCS)",
    "type": "Board Cert",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "ABPTS board certification. No comparative outcome studies despite relevance to aging population. Signals geriatric expertise.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 28,
        "efficiency": 28,
        "caseloadApplicability": 72,
        "reimbursement": 52,
        "marketDemand": 65,
        "patientSatisfaction": 32
      },
      "business": {
        "cashPayViability": 45,
        "pricingLeverage": 50,
        "marketDifferentiation": 70,
        "ownerLeverage": 55,
        "marketDemand": 30,
        "efficiency": 35
      },
      "academicClinical": {
        "facultyRecognition": 90,
        "scholarship": 70,
        "teachingValue": 85,
        "evidenceDepth": 75,
        "facultyDemand": 80,
        "efficiency": 50
      }
    }
  },
  {
    "name": "Neurologic Clinical Specialist (NCS)",
    "type": "Board Cert",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "ABPTS board certification. No outcome data despite high-need neurological population. Signals specialty expertise.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 30,
        "efficiency": 28,
        "caseloadApplicability": 70,
        "reimbursement": 52,
        "marketDemand": 72,
        "patientSatisfaction": 35
      },
      "business": {
        "cashPayViability": 60,
        "pricingLeverage": 65,
        "marketDifferentiation": 80,
        "ownerLeverage": 55,
        "marketDemand": 40,
        "efficiency": 30
      },
      "academicClinical": {
        "facultyRecognition": 92,
        "scholarship": 80,
        "teachingValue": 90,
        "evidenceDepth": 80,
        "facultyDemand": 85,
        "efficiency": 45
      }
    }
  },
  {
    "name": "Board Certification in Gerontology",
    "type": "Board Cert",
    "discipline": "OT",
    "disciplines": [
      "OT"
    ],
    "evidence": "BCG certification from AOTA. Geriatric OT specialty. No comparative outcome studies.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 22,
        "efficiency": 28,
        "caseloadApplicability": 70,
        "reimbursement": 52,
        "marketDemand": 48,
        "patientSatisfaction": 28
      },
      "business": {
        "cashPayViability": 45,
        "pricingLeverage": 50,
        "marketDifferentiation": 65,
        "ownerLeverage": 55,
        "marketDemand": 30,
        "efficiency": 40
      },
      "academicClinical": {
        "facultyRecognition": 85,
        "scholarship": 65,
        "teachingValue": 85,
        "evidenceDepth": 70,
        "facultyDemand": 75,
        "efficiency": 55
      }
    }
  },
  {
    "name": "AOTA Board Certifications (Physical Rehab)",
    "type": "Board Cert",
    "discipline": "OT",
    "disciplines": [
      "OT"
    ],
    "evidence": "AOTA BCPR. Zero comparative outcome studies identified across systematic searches. Professional signaling credential.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 20,
        "efficiency": 30,
        "caseloadApplicability": 60,
        "reimbursement": 52,
        "marketDemand": 35,
        "patientSatisfaction": 25
      },
      "business": {
        "cashPayViability": 22,
        "pricingLeverage": 28,
        "marketDifferentiation": 35,
        "ownerLeverage": 30,
        "marketDemand": 18,
        "efficiency": 25
      },
      "academicClinical": {
        "facultyRecognition": 78,
        "scholarship": 60,
        "teachingValue": 72,
        "evidenceDepth": 58,
        "facultyDemand": 62,
        "efficiency": 40
      }
    }
  },
  {
    "name": "AOTA Specialty Certifications",
    "type": "Board Cert",
    "discipline": "OT",
    "disciplines": [
      "OT"
    ],
    "evidence": "Driving, Environmental Mod, Feeding, Low Vision, School. No outcome studies across any of these specialty certifications.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 18,
        "efficiency": 32,
        "caseloadApplicability": 45,
        "reimbursement": 52,
        "marketDemand": 30,
        "patientSatisfaction": 22
      },
      "business": {
        "cashPayViability": 30,
        "pricingLeverage": 30,
        "marketDifferentiation": 35,
        "ownerLeverage": 32,
        "marketDemand": 20,
        "efficiency": 28
      },
      "academicClinical": {
        "facultyRecognition": 60,
        "scholarship": 50,
        "teachingValue": 65,
        "evidenceDepth": 55,
        "facultyDemand": 50,
        "efficiency": 42
      }
    }
  },
  {
    "name": "Cardiovascular/Pulmonary Specialist",
    "type": "Board Specialty",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "This record covers the ABPTS Cardiovascular & Pulmonary Clinical Specialist (CCS) board certification, and the evidence must be read in two layers. The CLINICAL DOMAIN it attests competence in is among the best-evidenced in all of physical therapy: exercise-based cardiac rehabilitation reduces cardiovascular mortality and hospitalization (Cochrane Anderson 2016 / Dibben 2021), pulmonary rehabilitation improves dyspnea, exercise capacity and quality of life in COPD (Cochrane McCarthy 2015), and early ICU mobilization improves functional outcomes (Schweickert 2009 Lancet; Tipping 2017). Evidence ABOUT THE CREDENTIAL itself is thin; only one directly relevant study (Prince 2024) shows CCS-eligible specialists educate heart-failure patients more in line with clinical-practice guidelines than experienced nonspecialists, and the broader ABPTS-specialization literature shows only a modest salary premium. Critically, CCS is one of the SMALLEST ABPTS specialties (~591 certified as of July 2025) and is concentrated in hospital/acute-care/ICU/cardiac-rehab settings that are insurance- and Medicare-funded and salaried; the near-inverse of the cash-pay business profile seen in pelvic/women's-health credentials.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 88,
        "caseloadApplicability": 60,
        "reimbursement": 45,
        "efficiency": 40,
        "marketDemand": 62,
        "patientSatisfaction": 78
      },
      "business": {
        "cashPayViability": 12,
        "pricingLeverage": 18,
        "marketDifferentiation": 35,
        "ownerLeverage": 15,
        "marketDemand": 22,
        "efficiency": 30
      },
      "academicClinical": {
        "facultyRecognition": 90,
        "scholarship": 78,
        "teachingValue": 88,
        "evidenceDepth": 80,
        "facultyDemand": 85,
        "efficiency": 58
      }
    }
  },
  {
    "name": "Certified Spinal Manipulative Therapy",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "Spinal manipulation evidence supports benefit for LBP and neck pain; no specific certification comparison to non-certified manipulators.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 24,
        "efficiency": 55,
        "caseloadApplicability": 68,
        "reimbursement": 52,
        "marketDemand": 58,
        "patientSatisfaction": 25
      },
      "business": {
        "cashPayViability": 70,
        "pricingLeverage": 62,
        "marketDifferentiation": 45,
        "ownerLeverage": 35,
        "marketDemand": 55,
        "efficiency": 65
      },
      "academicClinical": {
        "facultyRecognition": 35,
        "scholarship": 38,
        "teachingValue": 55,
        "evidenceDepth": 50,
        "facultyDemand": 25,
        "efficiency": 55
      }
    }
  },
  {
    "name": "Clinical Doctorate (DPT/OTD) vs Masters",
    "type": "Degree",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "No measurable patient outcome differences between DPT and MPT graduates in multiple studies. Credential equivalency; clinical performance is equivalent.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 18,
        "efficiency": 15,
        "caseloadApplicability": 55,
        "reimbursement": 52,
        "marketDemand": 65,
        "patientSatisfaction": 22
      },
      "business": {
        "cashPayViability": 45,
        "pricingLeverage": 40,
        "marketDifferentiation": 25,
        "ownerLeverage": 55,
        "marketDemand": 50,
        "efficiency": 20
      },
      "academicClinical": {
        "facultyRecognition": 80,
        "scholarship": 55,
        "teachingValue": 70,
        "evidenceDepth": 50,
        "facultyDemand": 85,
        "efficiency": 25
      }
    }
  },
  {
    "name": "Sensory Integration (SIPT)",
    "type": "Certification",
    "discipline": "OT",
    "disciplines": [
      "OT"
    ],
    "evidence": "SIPT certification widely used in pediatric OT. Limited evidence in systematic reviews despite widespread use. Bundy & Lane systematic review: inconclusive.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 18,
        "efficiency": 25,
        "caseloadApplicability": 52,
        "reimbursement": 52,
        "marketDemand": 58,
        "patientSatisfaction": 22
      },
      "business": {
        "cashPayViability": 72,
        "pricingLeverage": 65,
        "marketDifferentiation": 70,
        "ownerLeverage": 60,
        "marketDemand": 62,
        "efficiency": 30
      },
      "academicClinical": {
        "facultyRecognition": 55,
        "scholarship": 50,
        "teachingValue": 68,
        "evidenceDepth": 38,
        "facultyDemand": 45,
        "efficiency": 28
      }
    }
  },
  {
    "name": "Modern Management of Older Adult",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "CERT-MMOA course from Duke. Geriatric exercise and function focus. Limited comparative outcome data for certified vs non-certified clinicians.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 20,
        "efficiency": 72,
        "caseloadApplicability": 65,
        "reimbursement": 52,
        "marketDemand": 32,
        "patientSatisfaction": 24
      },
      "business": {
        "cashPayViability": 40,
        "pricingLeverage": 35,
        "marketDifferentiation": 28,
        "ownerLeverage": 45,
        "marketDemand": 30,
        "efficiency": 70
      },
      "academicClinical": {
        "facultyRecognition": 45,
        "scholarship": 40,
        "teachingValue": 65,
        "evidenceDepth": 60,
        "facultyDemand": 35,
        "efficiency": 65
      }
    }
  },
  {
    "name": "Assistive Technology Professional (ATP)",
    "type": "Certification",
    "discipline": "OT/PT",
    "disciplines": [
      "OT",
      "PT"
    ],
    "evidence": "RESNA ATP credential. AT device selection and application. Technology-focused; no comparative outcome studies for ATP vs non-certified AT provision.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 18,
        "efficiency": 45,
        "caseloadApplicability": 42,
        "reimbursement": 52,
        "marketDemand": 52,
        "patientSatisfaction": 22
      },
      "business": {
        "cashPayViability": 18,
        "pricingLeverage": 30,
        "marketDifferentiation": 55,
        "ownerLeverage": 30,
        "marketDemand": 20,
        "efficiency": 55
      },
      "academicClinical": {
        "facultyRecognition": 55,
        "scholarship": 45,
        "teachingValue": 60,
        "evidenceDepth": 55,
        "facultyDemand": 40,
        "efficiency": 55
      },
      "healthTech": {
        "industryPlacement": 55,
        "vendorDemand": 58,
        "salaryPremium": 45,
        "technicalSkillDepth": 52,
        "transitionFit": 60,
        "efficiency": 48
      }
    }
  },
  {
    "name": "VitalStim",
    "type": "Certification",
    "discipline": "SLP",
    "disciplines": [
      "SLP"
    ],
    "evidence": "FDA-cleared for dysphagia. Systematic reviews: insufficient evidence of superiority over standard dysphagia therapy. Sham-controlled RCTs show mixed results.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 14,
        "efficiency": 62,
        "caseloadApplicability": 45,
        "reimbursement": 52,
        "marketDemand": 48,
        "patientSatisfaction": 16
      },
      "business": {
        "cashPayViability": 25,
        "pricingLeverage": 30,
        "marketDifferentiation": 35,
        "ownerLeverage": 40,
        "marketDemand": 18,
        "efficiency": 70
      },
      "academicClinical": {
        "facultyRecognition": 30,
        "scholarship": 28,
        "teachingValue": 45,
        "evidenceDepth": 30,
        "facultyDemand": 25,
        "efficiency": 60
      }
    }
  },
  {
    "name": "Board Certified Specialist in Swallowing",
    "type": "Board Cert",
    "discipline": "SLP",
    "disciplines": [
      "SLP"
    ],
    "evidence": "BCS-S credential from ASHA. Dysphagia specialty certification. No comparative outcome studies vs non-certified SLP dysphagia management.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 14,
        "efficiency": 30,
        "caseloadApplicability": 45,
        "reimbursement": 52,
        "marketDemand": 48,
        "patientSatisfaction": 16
      },
      "business": {
        "cashPayViability": 22,
        "pricingLeverage": 35,
        "marketDifferentiation": 60,
        "ownerLeverage": 25,
        "marketDemand": 15,
        "efficiency": 20
      },
      "academicClinical": {
        "facultyRecognition": 88,
        "scholarship": 78,
        "teachingValue": 82,
        "evidenceDepth": 72,
        "facultyDemand": 70,
        "efficiency": 30
      }
    }
  },
  {
    "name": "Graston/IASTM",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "Instrument-Assisted Soft Tissue Mobilization. Systematic reviews: weak evidence, inconsistent protocols. Similar to standard manual therapy when dose-matched.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 16,
        "efficiency": 68,
        "caseloadApplicability": 65,
        "reimbursement": 52,
        "marketDemand": 58,
        "patientSatisfaction": 18
      },
      "business": {
        "cashPayViability": 65,
        "pricingLeverage": 45,
        "marketDifferentiation": 30,
        "ownerLeverage": 55,
        "marketDemand": 55,
        "efficiency": 70
      },
      "academicClinical": {
        "facultyRecognition": 20,
        "scholarship": 30,
        "teachingValue": 35,
        "evidenceDepth": 30,
        "facultyDemand": 15,
        "efficiency": 65
      }
    }
  },
  {
    "name": "Emergency Medical Response",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "Sports venue first responder role. No rehabilitation outcome data. Safety and preparedness value for sideline coverage. Primarily a liability/access credential.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 8,
        "efficiency": 88,
        "caseloadApplicability": 22,
        "reimbursement": 38,
        "marketDemand": 45,
        "patientSatisfaction": 5
      },
      "business": {
        "cashPayViability": 10,
        "pricingLeverage": 10,
        "marketDifferentiation": 10,
        "ownerLeverage": 15,
        "marketDemand": 10,
        "efficiency": 75
      },
      "academicClinical": {
        "facultyRecognition": 15,
        "scholarship": 10,
        "teachingValue": 25,
        "evidenceDepth": 30,
        "facultyDemand": 20,
        "efficiency": 70
      }
    }
  },
  {
    "name": "Oncology Clinical Specialist",
    "type": "Board Cert",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "ABPTS OncPT board certification. Growing field with emerging evidence. No comparative outcome studies yet between certified and non-certified oncology PT.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 12,
        "efficiency": 32,
        "caseloadApplicability": 40,
        "reimbursement": 52,
        "marketDemand": 38,
        "patientSatisfaction": 14
      },
      "business": {
        "cashPayViability": 30,
        "pricingLeverage": 40,
        "marketDifferentiation": 70,
        "ownerLeverage": 25,
        "marketDemand": 30,
        "efficiency": 20
      },
      "academicClinical": {
        "facultyRecognition": 92,
        "scholarship": 75,
        "teachingValue": 75,
        "evidenceDepth": 75,
        "facultyDemand": 60,
        "efficiency": 30
      }
    }
  },
  {
    "name": "Board Certified Specialist Child Language",
    "type": "Board Cert",
    "discipline": "SLP",
    "disciplines": [
      "SLP"
    ],
    "evidence": "BCS-CL from ASHA. No comparative outcome studies vs non-certified SLP for child language disorders.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 10,
        "efficiency": 28,
        "caseloadApplicability": 55,
        "reimbursement": 52,
        "marketDemand": 38,
        "patientSatisfaction": 12
      },
      "business": {
        "cashPayViability": 55,
        "pricingLeverage": 55,
        "marketDifferentiation": 70,
        "ownerLeverage": 50,
        "marketDemand": 40,
        "efficiency": 25
      },
      "academicClinical": {
        "facultyRecognition": 88,
        "scholarship": 70,
        "teachingValue": 80,
        "evidenceDepth": 75,
        "facultyDemand": 55,
        "efficiency": 30
      }
    }
  },
  {
    "name": "Board Certified Specialist Fluency",
    "type": "Board Cert",
    "discipline": "SLP",
    "disciplines": [
      "SLP"
    ],
    "evidence": "BCS-F from ASHA. Stuttering specialty. No comparative outcome studies vs non-certified SLP for fluency disorders.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 10,
        "efficiency": 28,
        "caseloadApplicability": 35,
        "reimbursement": 52,
        "marketDemand": 35,
        "patientSatisfaction": 12
      },
      "business": {
        "cashPayViability": 80,
        "pricingLeverage": 75,
        "marketDifferentiation": 85,
        "ownerLeverage": 45,
        "marketDemand": 60,
        "efficiency": 25
      },
      "academicClinical": {
        "facultyRecognition": 88,
        "scholarship": 70,
        "teachingValue": 75,
        "evidenceDepth": 70,
        "facultyDemand": 65,
        "efficiency": 30
      }
    }
  },
  {
    "name": "BC-ANCDS Neurologic Communication",
    "type": "Board Cert",
    "discipline": "SLP",
    "disciplines": [
      "SLP"
    ],
    "evidence": "Academy of Neurologic Communication Disorders certification. No comparative outcome studies for aphasia/dysarthria management vs non-certified SLP.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 10,
        "efficiency": 28,
        "caseloadApplicability": 55,
        "reimbursement": 52,
        "marketDemand": 35,
        "patientSatisfaction": 12
      },
      "business": {
        "cashPayViability": 35,
        "pricingLeverage": 50,
        "marketDifferentiation": 75,
        "ownerLeverage": 35,
        "marketDemand": 30,
        "efficiency": 25
      },
      "academicClinical": {
        "facultyRecognition": 85,
        "scholarship": 80,
        "teachingValue": 80,
        "evidenceDepth": 80,
        "facultyDemand": 55,
        "efficiency": 30
      }
    }
  },
  {
    "name": "Clinical Electrophysiology Specialist",
    "type": "Board Cert",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "ABPTS ECS board certification. Narrow scope (EMG, NCS, E-stim). No outcome studies. Very small number of active certifications.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 10,
        "efficiency": 32,
        "caseloadApplicability": 18,
        "reimbursement": 42,
        "marketDemand": 15,
        "patientSatisfaction": 10
      },
      "business": {
        "cashPayViability": 15,
        "pricingLeverage": 35,
        "marketDifferentiation": 80,
        "ownerLeverage": 20,
        "marketDemand": 15,
        "efficiency": 15
      },
      "academicClinical": {
        "facultyRecognition": 85,
        "scholarship": 60,
        "teachingValue": 65,
        "evidenceDepth": 60,
        "facultyDemand": 35,
        "efficiency": 25
      }
    }
  },
  {
    "name": "Board Certification Intraoperative Monitoring",
    "type": "Board Cert",
    "discipline": "Audiology",
    "disciplines": [
      "Audiology"
    ],
    "evidence": "BCS-IOM. Intraoperative neurophysiological monitoring specialty. Audiology-adjacent; no comparative outcome studies in rehabilitation context.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 8,
        "efficiency": 28,
        "caseloadApplicability": 8,
        "reimbursement": 52,
        "marketDemand": 28,
        "patientSatisfaction": 10
      },
      "business": {
        "cashPayViability": 10,
        "pricingLeverage": 60,
        "marketDifferentiation": 85,
        "ownerLeverage": 50,
        "marketDemand": 15,
        "efficiency": 20
      },
      "academicClinical": {
        "facultyRecognition": 60,
        "scholarship": 55,
        "teachingValue": 55,
        "evidenceDepth": 65,
        "facultyDemand": 30,
        "efficiency": 25
      }
    }
  },
  {
    "name": "Cochlear Implant Specialty",
    "type": "Certification",
    "discipline": "Audiology",
    "disciplines": [
      "Audiology"
    ],
    "evidence": "CISC certification. Cochlear implant programming and auditory rehabilitation. Device-specific expertise; limited comparative outcome studies.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 10,
        "efficiency": 45,
        "caseloadApplicability": 20,
        "reimbursement": 60,
        "marketDemand": 45,
        "patientSatisfaction": 12
      },
      "business": {
        "cashPayViability": 25,
        "pricingLeverage": 55,
        "marketDifferentiation": 70,
        "ownerLeverage": 40,
        "marketDemand": 35,
        "efficiency": 40
      },
      "academicClinical": {
        "facultyRecognition": 70,
        "scholarship": 65,
        "teachingValue": 75,
        "evidenceDepth": 80,
        "facultyDemand": 50,
        "efficiency": 45
      }
    }
  },
  {
    "name": "CBIT for Tics",
    "type": "Certification",
    "discipline": "OT",
    "disciplines": [
      "OT"
    ],
    "evidence": "Comprehensive Behavioral Intervention for Tics. RCT evidence supports CBIT for Tourette syndrome. Very specialized population; OT role emerging.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 12,
        "efficiency": 60,
        "caseloadApplicability": 20,
        "reimbursement": 42,
        "marketDemand": 28,
        "patientSatisfaction": 14
      },
      "business": {
        "cashPayViability": 80,
        "pricingLeverage": 70,
        "marketDifferentiation": 85,
        "ownerLeverage": 55,
        "marketDemand": 55,
        "efficiency": 70
      },
      "academicClinical": {
        "facultyRecognition": 50,
        "scholarship": 60,
        "teachingValue": 55,
        "evidenceDepth": 80,
        "facultyDemand": 25,
        "efficiency": 65
      }
    }
  },
  {
    "name": "Schroth Therapist",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "Scoliosis-specific exercise. Cochrane under review. Several RCTs show Cobb angle improvement. Barcelona Scoliosis Physical Therapy School certification.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 12,
        "efficiency": 42,
        "caseloadApplicability": 25,
        "reimbursement": 52,
        "marketDemand": 38,
        "patientSatisfaction": 14
      },
      "business": {
        "cashPayViability": 70,
        "pricingLeverage": 65,
        "marketDifferentiation": 75,
        "ownerLeverage": 55,
        "marketDemand": 50,
        "efficiency": 35
      },
      "academicClinical": {
        "facultyRecognition": 40,
        "scholarship": 50,
        "teachingValue": 55,
        "evidenceDepth": 60,
        "facultyDemand": 25,
        "efficiency": 30
      }
    }
  },
  {
    "name": "Craniomandibular/TMJ Certification",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "TMD specialty training. PT outcomes for TMD documented in systematic reviews. Certification-specific outcomes not studied.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 12,
        "efficiency": 52,
        "caseloadApplicability": 32,
        "reimbursement": 52,
        "marketDemand": 38,
        "patientSatisfaction": 14
      },
      "business": {
        "cashPayViability": 75,
        "pricingLeverage": 65,
        "marketDifferentiation": 70,
        "ownerLeverage": 50,
        "marketDemand": 55,
        "efficiency": 50
      },
      "academicClinical": {
        "facultyRecognition": 30,
        "scholarship": 35,
        "teachingValue": 45,
        "evidenceDepth": 40,
        "facultyDemand": 20,
        "efficiency": 50
      }
    }
  },
  {
    "name": "Advanced Vestibular PT",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "University of Pittsburgh advanced vestibular program. Builds on basic vestibular training. No comparative outcome data beyond standard vestibular certification.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 15,
        "efficiency": 45,
        "caseloadApplicability": 65,
        "reimbursement": 52,
        "marketDemand": 48,
        "patientSatisfaction": 16
      },
      "business": {
        "cashPayViability": 55,
        "pricingLeverage": 55,
        "marketDifferentiation": 65,
        "ownerLeverage": 60,
        "marketDemand": 45,
        "efficiency": 45
      },
      "academicClinical": {
        "facultyRecognition": 60,
        "scholarship": 65,
        "teachingValue": 75,
        "evidenceDepth": 75,
        "facultyDemand": 50,
        "efficiency": 45
      }
    }
  },
  {
    "name": "Vestibular AIB Certifications",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "AIB-VAM/VRII/VR/VRC certification series. Vestibular specialty training pathway. No comparative outcome studies.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 12,
        "efficiency": 48,
        "caseloadApplicability": 65,
        "reimbursement": 52,
        "marketDemand": 52,
        "patientSatisfaction": 14
      },
      "business": {
        "cashPayViability": 50,
        "pricingLeverage": 50,
        "marketDifferentiation": 55,
        "ownerLeverage": 55,
        "marketDemand": 40,
        "efficiency": 55
      },
      "academicClinical": {
        "facultyRecognition": 40,
        "scholarship": 45,
        "teachingValue": 60,
        "evidenceDepth": 55,
        "facultyDemand": 30,
        "efficiency": 55
      }
    }
  },
  {
    "name": "Vestibular VCC Certification",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "IAMT vestibular certification. Vestibular specialty credential. No comparative outcome studies.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 12,
        "efficiency": 48,
        "caseloadApplicability": 62,
        "reimbursement": 52,
        "marketDemand": 40,
        "patientSatisfaction": 14
      },
      "business": {
        "cashPayViability": 50,
        "pricingLeverage": 55,
        "marketDifferentiation": 60,
        "ownerLeverage": 55,
        "marketDemand": 40,
        "efficiency": 45
      },
      "academicClinical": {
        "facultyRecognition": 55,
        "scholarship": 60,
        "teachingValue": 70,
        "evidenceDepth": 70,
        "facultyDemand": 40,
        "efficiency": 40
      }
    }
  },
  {
    "name": "Occupro Certification",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "Work health and ergonomics platform certification. No clinical outcome data published.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 8,
        "efficiency": 75,
        "caseloadApplicability": 35,
        "reimbursement": 52,
        "marketDemand": 12,
        "patientSatisfaction": 10
      },
      "business": {
        "cashPayViability": 25,
        "pricingLeverage": 35,
        "marketDifferentiation": 40,
        "ownerLeverage": 65,
        "marketDemand": 30,
        "efficiency": 60
      },
      "academicClinical": {
        "facultyRecognition": 20,
        "scholarship": 20,
        "teachingValue": 30,
        "evidenceDepth": 35,
        "facultyDemand": 15,
        "efficiency": 55
      }
    }
  },
  {
    "name": "The Back School",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "Online back pain education and movement certification. No comparative outcome studies vs standard LBP education.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 12,
        "efficiency": 80,
        "caseloadApplicability": 72,
        "reimbursement": 52,
        "marketDemand": 25,
        "patientSatisfaction": 12
      },
      "business": {
        "cashPayViability": 25,
        "pricingLeverage": 25,
        "marketDifferentiation": 25,
        "ownerLeverage": 55,
        "marketDemand": 20,
        "efficiency": 65
      },
      "academicClinical": {
        "facultyRecognition": 15,
        "scholarship": 20,
        "teachingValue": 30,
        "evidenceDepth": 25,
        "facultyDemand": 10,
        "efficiency": 60
      }
    }
  },
  {
    "name": "Kinesio Taping (CKTP)",
    "type": "Certification",
    "discipline": "PT/OT/AT",
    "disciplines": [
      "PT",
      "OT",
      "AT"
    ],
    "evidence": "Multiple systematic reviews find insufficient evidence over sham taping. CKTP certification widely held. Pain reduction small and short-term.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 20,
        "efficiency": 82,
        "caseloadApplicability": 70,
        "reimbursement": 52,
        "marketDemand": 60,
        "patientSatisfaction": 22
      },
      "business": {
        "cashPayViability": 45,
        "pricingLeverage": 25,
        "marketDifferentiation": 20,
        "ownerLeverage": 70,
        "marketDemand": 55,
        "efficiency": 80
      },
      "academicClinical": {
        "facultyRecognition": 15,
        "scholarship": 25,
        "teachingValue": 30,
        "evidenceDepth": 25,
        "facultyDemand": 10,
        "efficiency": 75
      }
    }
  },
  {
    "name": "ASHA Board Certified Specialists",
    "type": "Board Cert",
    "discipline": "SLP",
    "disciplines": [
      "SLP"
    ],
    "evidence": "ASHA BCS portfolio of specialty certifications. Limited research across all SLP specialties on certification-specific outcomes.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 8,
        "efficiency": 30,
        "caseloadApplicability": 45,
        "reimbursement": 52,
        "marketDemand": 28,
        "patientSatisfaction": 10
      },
      "business": {
        "cashPayViability": 65,
        "pricingLeverage": 70,
        "marketDifferentiation": 80,
        "ownerLeverage": 60,
        "marketDemand": 50,
        "efficiency": 30
      },
      "academicClinical": {
        "facultyRecognition": 85,
        "scholarship": 80,
        "teachingValue": 85,
        "evidenceDepth": 75,
        "facultyDemand": 75,
        "efficiency": 35
      }
    }
  },
  {
    "name": "Research Doctorates (PhD/ScD)",
    "type": "Degree",
    "discipline": "All",
    "disciplines": [
      "PT",
      "OT",
      "SLP",
      "AT",
      "EP",
      "RT",
      "RN",
      "MT",
      "Audiology",
      "Researcher"
    ],
    "evidence": "The research doctorate (PhD/ScD) is the dominant credential for rehabilitation-science PIs, with NIH K12 and K-award data showing PhD holders achieve subsequent R01 funding at rates above 35-40% and producing the majority of NIH-funded rehab investigators. Programs at Pitt, USC, Northwestern, BU run 4-6 years with rigorous biostatistics, study design, and grant-writing training. Cost and time are high (efficiency low), but pathway to PI status and publication output are the strongest of any rehab credential.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 5,
        "efficiency": 10,
        "caseloadApplicability": 5,
        "reimbursement": 32,
        "marketDemand": 38,
        "patientSatisfaction": 6
      },
      "business": {
        "cashPayViability": 30,
        "pricingLeverage": 50,
        "marketDifferentiation": 60,
        "ownerLeverage": 50,
        "marketDemand": 30,
        "efficiency": 10
      },
      "academicClinical": {
        "facultyRecognition": 98,
        "scholarship": 98,
        "teachingValue": 90,
        "evidenceDepth": 95,
        "facultyDemand": 95,
        "efficiency": 15
      },
      "research": {
        "methodologyDepth": 95,
        "publicationTrack": 90,
        "grantReadiness": 92,
        "pathwayToIndependence": 95,
        "interdisciplinaryFit": 85,
        "efficiency": 12
      }
    }
  },
  {
    "name": "Postdoctoral Research Fellowship (T32/F32)",
    "type": "Fellowship",
    "discipline": "PT/OT/SLP/Researcher",
    "disciplines": [
      "PT",
      "OT",
      "SLP",
      "Researcher"
    ],
    "evidence": "T32/F32 postdoctoral fellowships are the dominant NIH-funded pathway to independent rehabilitation research careers. NIH outcome data and peer-reviewed analyses show F32/T32 alumni achieve K-award rates of roughly 40-55% and subsequent R01 conversion rates 2-3x higher than non-fellowship postdocs, with median time-to-faculty of 3-4 years post-PhD. For DPT-PhDs and rehab scientists specifically, T32 training is the single strongest predictor of subsequent independent NIH funding (Field-Fote & Boninger, 2018).",
    "pathScores": {
      "research": {
        "methodologyDepth": 88,
        "publicationTrack": 85,
        "grantReadiness": 92,
        "pathwayToIndependence": 95,
        "interdisciplinaryFit": 85,
        "efficiency": 18
      }
    },
    "legacyRoiSignals": null
  },
  {
    "name": "NIH K Award (K01/K12/K23)",
    "type": "Fellowship",
    "discipline": "PT/OT/SLP/Researcher",
    "disciplines": [
      "PT",
      "OT",
      "SLP",
      "Researcher"
    ],
    "evidence": "NIH Mentored Career Development (K) awards are the gold-standard bridge from postdoc to independent investigator: NIH career-outcome analyses show K23 recipients convert to R01 funding at roughly 30-40% within 10 years (vs. ~15-20% for non-K-funded peers), and K awardees publish at 2-3x the rate of comparable early-career faculty. For rehab scientists (PT/OT/SLP), K awards are the dominant pathway to R-level independence, with multi-year protected research time (≥75% effort), structured mentorship, and explicit didactic methods training. Time investment is substantial (3-5 years post-PhD) and award rates are competitive (~25-30%), making this a high-impact, low-efficiency credential.",
    "pathScores": {
      "research": {
        "methodologyDepth": 88,
        "publicationTrack": 90,
        "grantReadiness": 95,
        "pathwayToIndependence": 95,
        "interdisciplinaryFit": 85,
        "efficiency": 15
      }
    },
    "legacyRoiSignals": null
  },
  {
    "name": "MS in Biostatistics",
    "type": "Degree",
    "discipline": "PT/OT/SLP/Researcher",
    "disciplines": [
      "PT",
      "OT",
      "SLP",
      "Researcher"
    ],
    "evidence": "An MS in Biostatistics provides 1.5-2 years of rigorous quantitative training (regression, survival analysis, clinical trials, causal inference) and is the standard credential for academic statisticians per BLS. For rehab clinician-scientists, it functions as a methods bridge: Rubio et al. (2011) and Meyers et al. (2012) show K-scholars and clinical-research MS graduates with formal biostats training have measurably higher R-series conversion and publication rates. It does not by itself confer PI status; a clinical doctorate or PhD typically remains required; but it substantially strengthens grant readiness and interdisciplinary placement.",
    "pathScores": {
      "research": {
        "methodologyDepth": 88,
        "publicationTrack": 70,
        "grantReadiness": 78,
        "pathwayToIndependence": 55,
        "interdisciplinaryFit": 90,
        "efficiency": 35
      }
    },
    "legacyRoiSignals": null
  },
  {
    "name": "MS in Clinical Research / Translational Science",
    "type": "Degree",
    "discipline": "PT/OT/SLP/Researcher",
    "disciplines": [
      "PT",
      "OT",
      "SLP",
      "AT",
      "Researcher"
    ],
    "evidence": "CTSA-affiliated MS in Clinical Research / Translational Science programs show K-award conversion rates of roughly 30-40% and federal grant application rates above 60% among graduates (Rubio 2011; Meagher 2021). Graduates demonstrate increased publication productivity and accelerated time-to-first-grant compared to clinically-trained-only peers, and the NIH explicitly identifies CRTPs as a core pipeline intervention. Cost is moderate (typically 2 years, often tuition-subsidized via CTSA KL2/TL1 mechanisms), making it markedly more efficient than a PhD while delivering most methodological core skills.",
    "pathScores": {
      "research": {
        "methodologyDepth": 78,
        "publicationTrack": 65,
        "grantReadiness": 80,
        "pathwayToIndependence": 68,
        "interdisciplinaryFit": 82,
        "efficiency": 45
      }
    },
    "legacyRoiSignals": null
  },
  {
    "name": "ACRP Certified Clinical Research Coordinator (CCRC)",
    "type": "Certification",
    "discipline": "Researcher/RN/PT/OT",
    "disciplines": [
      "Researcher",
      "RN",
      "PT",
      "OT"
    ],
    "evidence": "CCRC is the standard operational credential for clinical trial coordinators, requiring ~3,000 hours of CRC experience plus exam. Evidence (Sonstein & Jones 2018; Stroo 2020) shows it standardizes GCP/regulatory competency and is increasingly required for AMC coordinator hiring, with ~5-10% salary premium (Freel 2017). However, career trajectories lead to senior coordinator/CRA/project manager roles; not PI status; without an additional doctoral degree (Behar-Horenstein 2018).",
    "pathScores": {
      "research": {
        "methodologyDepth": 30,
        "publicationTrack": 20,
        "grantReadiness": 15,
        "pathwayToIndependence": 15,
        "interdisciplinaryFit": 60,
        "efficiency": 70
      }
    },
    "legacyRoiSignals": null
  },
  {
    "name": "SOCRA Certified Clinical Research Professional (CCRP)",
    "type": "Certification",
    "discipline": "PT/OT/SLP/RN/Researcher",
    "disciplines": [
      "PT",
      "OT",
      "SLP",
      "RN",
      "Researcher"
    ],
    "evidence": "SOCRA CCRP is a globally recognized clinical research workforce credential held by ~25,000+ professionals; it is frequently listed as preferred/required for clinical research coordinator (CRC) and research associate roles at AMCs and industry sponsors, with BLS/industry surveys showing CRC salaries ~$60-85K and meaningful wage premiums (~5-15%) for certified vs non-certified coordinators. It is a coordinator-level credential; not a PI pathway; with no direct linkage to K/R-series independent funding and minimal methodology depth (GCP, ICH, regulatory focus rather than study design or biostatistics). Holders work primarily in trial operations rather than as first/last-author investigators.",
    "pathScores": {
      "research": {
        "methodologyDepth": 25,
        "publicationTrack": 20,
        "grantReadiness": 15,
        "pathwayToIndependence": 10,
        "interdisciplinaryFit": 60,
        "efficiency": 80
      }
    },
    "legacyRoiSignals": null
  },
  {
    "name": "Cochrane / JBI Systematic Review Training",
    "type": "Training",
    "discipline": "PT/OT/SLP/AT/EP/RT/RN/MT/Audiology/Researcher",
    "disciplines": [
      "PT",
      "OT",
      "SLP",
      "AT",
      "EP",
      "RT",
      "RN",
      "MT",
      "Audiology",
      "Researcher"
    ],
    "evidence": "Cochrane/JBI training is a low-cost, high-leverage credential for evidence-synthesis careers: Cochrane reviews are cited 2-3x more than non-Cochrane reviews (Bunn 2015) and AMSTAR-quality scores are significantly higher among Cochrane-trained teams (Useem 2015). However, the training is narrow (synthesis methods only, not primary biostatistics or trial design), and rehab-clinician studies (Maher 2008; Scurlock-Evans 2014) show it accelerates publication output and PhD entry but does not on its own confer PI independence or major NIH funding.",
    "pathScores": {
      "research": {
        "methodologyDepth": 55,
        "publicationTrack": 72,
        "grantReadiness": 40,
        "pathwayToIndependence": 28,
        "interdisciplinaryFit": 75,
        "efficiency": 82
      }
    },
    "legacyRoiSignals": null
  },
  {
    "name": "Epic Certification (Build & Configuration)",
    "type": "Certification",
    "discipline": "Informatics/IT",
    "disciplines": [
      "Informatics",
      "IT",
      "PT",
      "OT",
      "SLP",
      "RN"
    ],
    "evidence": "Epic-certified analysts/builders command $85K-$135K base salaries (HIMSS 2024 compensation survey), with senior application analysts and Epic consultants commonly exceeding $150K; a 30-60% premium over staff PT/OT compensation (BLS OES 2024 median PT $99K, OT $96K). Demand is durable: Epic holds roughly 36% of U.S. acute-care EHR market share and 54% of large-hospital deployments (KLAS 2024), and Epic certifications appear in tens of thousands of postings annually on Indeed/LinkedIn. The credential's main constraint is access; Epic training is gated to employees of Epic-using organizations or Epic itself, making the initial \"informatics analyst\" hire the true bottleneck rather than the cert.",
    "pathScores": {
      "healthTech": {
        "industryPlacement": 88,
        "vendorDemand": 95,
        "salaryPremium": 78,
        "technicalSkillDepth": 72,
        "transitionFit": 80,
        "efficiency": 30
      }
    },
    "legacyRoiSignals": null
  },
  {
    "name": "Cerner / Oracle Health Certification",
    "type": "Certification",
    "discipline": "Informatics/IT",
    "disciplines": [
      "PT",
      "OT",
      "SLP",
      "RN",
      "Informatics",
      "IT",
      "HIM"
    ],
    "evidence": "Cerner/Oracle Health certified analysts typically earn $75K-$110K, with senior consultants reaching $120K-$140K; a meaningful premium over bedside PT/OT median (~$95K) but generally below Epic-certified peers due to smaller install base (~25% US hospital market vs Epic ~40%+). Most certifications are gated: candidates must be sponsored by a Cerner/Oracle Health client organization or join Oracle Health consulting, limiting open-market accessibility. Demand persists but is concentrating in DoD/VA (Oracle Health's federal EHR contract) and community/critical-access hospitals.",
    "pathScores": {
      "healthTech": {
        "industryPlacement": 70,
        "vendorDemand": 55,
        "salaryPremium": 60,
        "technicalSkillDepth": 70,
        "transitionFit": 72,
        "efficiency": 30
      }
    },
    "legacyRoiSignals": null
  },
  {
    "name": "AMIA Clinical Informatics Board Certification",
    "type": "Board Cert",
    "discipline": "PT/OT/SLP/Informatics",
    "disciplines": [
      "PT",
      "OT",
      "SLP",
      "Informatics",
      "HIM"
    ],
    "evidence": "For PTs/OTs the practical pathway is AHIC (not the ABMS physician-only board cert), which is increasingly required for senior informatics analyst, clinical product manager, and EHR vendor consultant roles paying $110-160K; a 25-40% premium over bedside (HIMSS 2023). Holders cluster in CMIO-office, vendor (Epic, Oracle Health), and payer informatics teams, with BLS projecting 28% growth in health informatics management through 2032. The credential is strong on signaling but moderate on hands-on technical depth (SQL, build, data science still required).",
    "pathScores": {
      "healthTech": {
        "industryPlacement": 80,
        "vendorDemand": 78,
        "salaryPremium": 75,
        "technicalSkillDepth": 55,
        "transitionFit": 82,
        "efficiency": 45
      }
    },
    "legacyRoiSignals": null
  },
  {
    "name": "AHIMA RHIA (Registered Health Information Administrator)",
    "type": "Certification",
    "discipline": "HIM/Informatics",
    "disciplines": [
      "HIM",
      "Informatics",
      "IT"
    ],
    "evidence": "RHIA holders cluster in HIM director, data integrity, and revenue-cycle informatics roles with AHIMA-reported median salaries of $75K-$95K and director-level pay exceeding $110K, generally above bedside PT/OT base. However, the credential requires a CAHIIM-accredited bachelor's in HIM, so transition fit for rehab clinicians is poor without a second degree. Vendor demand exists primarily at payers, hospital HIM departments, and CDI/coding vendors rather than Epic/Oracle build teams, which prefer clinical-background analysts.",
    "pathScores": {
      "healthTech": {
        "industryPlacement": 70,
        "vendorDemand": 55,
        "salaryPremium": 40,
        "technicalSkillDepth": 55,
        "transitionFit": 20,
        "efficiency": 15
      }
    },
    "legacyRoiSignals": null
  },
  {
    "name": "AHIMA RHIT (Registered Health Information Technician)",
    "type": "Certification",
    "discipline": "HIM/Informatics",
    "disciplines": [
      "HIM",
      "Informatics",
      "IT"
    ],
    "evidence": "RHIT is an associate-degree-level HIM credential geared toward coding, registry, and documentation roles; BLS reports median pay for medical records specialists around $48,780 (2023), well below PT/OT clinical wages. Holders typically land in hospital HIM departments or payer coding roles rather than EHR vendor or digital-health product roles, so industry placement for clinicians pivoting to tech is limited. It is rarely listed as a preferred credential at Epic, Oracle Health, or digital-health startups, where RHIA, CPHIMS, or clinical informatics experience dominate.",
    "pathScores": {
      "healthTech": {
        "industryPlacement": 35,
        "vendorDemand": 25,
        "salaryPremium": 15,
        "technicalSkillDepth": 35,
        "transitionFit": 30,
        "efficiency": 45
      }
    },
    "legacyRoiSignals": null
  },
  {
    "name": "AHIMA CHDA (Certified Health Data Analyst)",
    "type": "Certification",
    "discipline": "HIM/Informatics",
    "disciplines": [
      "HIM",
      "Informatics",
      "QA"
    ],
    "evidence": "CHDA holders work predominantly in healthcare data analyst roles with BLS reporting median wages around $104,830 for medical and health services managers and $87,000+ for health data analysts (2024). AHIMA's 2023 workforce survey indicates CHDA-credentialed analysts earn a 10-18% premium over RHIA-only peers, with placement concentrated at payers, hospital systems, and HIM vendors. However, the prerequisite stack (RHIA/RHIT + bachelor's) creates a high barrier for clinicians without HIM background, limiting direct PT/OT transition utility.",
    "pathScores": {
      "healthTech": {
        "industryPlacement": 60,
        "vendorDemand": 45,
        "salaryPremium": 55,
        "technicalSkillDepth": 55,
        "transitionFit": 30,
        "efficiency": 35
      }
    },
    "legacyRoiSignals": null
  },
  {
    "name": "HIMSS CPHIMS (Certified Professional in Healthcare Information & Management Systems)",
    "type": "Certification",
    "discipline": "Informatics/IT/HIM",
    "disciplines": [
      "Informatics",
      "IT",
      "HIM",
      "PM"
    ],
    "evidence": "CPHIMS holders report a median compensation of approximately $115,000-$130,000 per HIMSS compensation surveys, roughly 15-25% above non-certified peers in equivalent health IT roles. The credential appears in roughly 5-10% of senior health IT consultant, implementation manager, and clinical systems analyst postings, with stronger recognition at HIMSS-member integrators (Deloitte, Huron, Chartis) than at Epic/Oracle Health (which prefer their own build certs). Eligibility requires a bachelor's plus 5 years health IT experience (or graduate degree plus 3), which gates clinicians without prior IT exposure.",
    "pathScores": {
      "healthTech": {
        "industryPlacement": 62,
        "vendorDemand": 55,
        "salaryPremium": 60,
        "technicalSkillDepth": 50,
        "transitionFit": 45,
        "efficiency": 55
      }
    },
    "legacyRoiSignals": null
  },
  {
    "name": "HL7 FHIR Proficiency",
    "type": "Certification",
    "discipline": "Informatics/IT/HIM",
    "disciplines": [
      "PT",
      "OT",
      "Informatics",
      "IT",
      "HIM"
    ],
    "evidence": "HL7 FHIR Proficiency is a low-cost (~$200) self-study credential aligned with ONC Cures Act mandates requiring FHIR R4 APIs in all certified EHRs, driving demand at Epic, Oracle Health, and payers. HIMSS 2023 workforce data lists interoperability among the fastest-growing informatics niches, with FHIR-skilled integration analysts earning $85k-$130k versus typical staff PT salaries of $75k-$95k. The credential alone rarely closes a hire; clinicians typically pair it with SQL/API project work to land roles.",
    "pathScores": {
      "healthTech": {
        "industryPlacement": 55,
        "vendorDemand": 78,
        "salaryPremium": 60,
        "technicalSkillDepth": 55,
        "transitionFit": 65,
        "efficiency": 88
      }
    },
    "legacyRoiSignals": null
  },
  {
    "name": "Lean Six Sigma in Healthcare (Green/Black Belt)",
    "type": "Certification",
    "discipline": "PT/OT/QA/Operations",
    "disciplines": [
      "PT",
      "OT",
      "QA",
      "Informatics",
      "PM"
    ],
    "evidence": "Lean Six Sigma (LSS) Green Belt and Black Belt holders in healthcare command roles such as performance improvement consultant, clinical operations manager, and payer operations lead, with BLS medical/health services manager median wages of $110,680 (2024) and LSS-tagged postings showing a 10-20% premium over non-certified peers. Hospital ops and payer postings on Indeed/LinkedIn list LSS as preferred or required in roughly a third of clinical operations and quality leadership roles, providing PTs/OTs a recognized bridge from bedside to process improvement, though the credential itself is generalist rather than clinical-tech specific.",
    "pathScores": {
      "healthTech": {
        "industryPlacement": 60,
        "vendorDemand": 55,
        "salaryPremium": 55,
        "technicalSkillDepth": 45,
        "transitionFit": 65,
        "efficiency": 70
      }
    },
    "legacyRoiSignals": null
  },
  {
    "name": "NAHQ CPHQ (Certified Professional in Healthcare Quality)",
    "type": "Certification",
    "discipline": "QA/Informatics/PT/OT",
    "disciplines": [
      "QA",
      "Informatics",
      "PT",
      "OT",
      "RN",
      "HIM"
    ],
    "evidence": "NAHQ's 2024 Healthcare Quality Workforce Report documents CPHQ holders earning a median of $97,000-$115,000, roughly 15-25% above non-certified peers in equivalent quality/safety roles, with 87% of healthcare quality leaders endorsing CPHQ as the field's standard credential. Hospital/health-system quality and patient-safety departments are the dominant employers, with smaller but growing demand from payers (HEDIS/Stars), ACOs, and accreditation/consulting firms (Joint Commission, Press Ganey, Vizient); EHR-vendor and pure digital-health postings rarely list CPHQ as preferred. Exam cost is ~$499 (member) with no formal prerequisite, making it efficient relative to PMP or informatics master's pathways, though clinicians without prior PI exposure typically need 3-6 months of self-study.",
    "pathScores": {
      "healthTech": {
        "industryPlacement": 45,
        "vendorDemand": 38,
        "salaryPremium": 50,
        "technicalSkillDepth": 55,
        "transitionFit": 62,
        "efficiency": 78
      }
    },
    "legacyRoiSignals": null
  },
  {
    "name": "PMP (Project Management Professional)",
    "type": "Certification",
    "discipline": "PT/OT/SLP/Informatics",
    "disciplines": [
      "PT",
      "OT",
      "SLP",
      "Informatics",
      "IT",
      "PM"
    ],
    "evidence": "PMP holders earn a median 33% salary premium globally and 16% in the US versus non-certified peers per PMI's Earning Power Survey (2023), with US median salaries around $123,000. In healthcare IT and digital health, PMP is named in 25-40% of senior PM and consulting job postings (HIMSS workforce data), and Epic/Oracle Health implementation consulting firms (Nordic, Impact Advisors) routinely list PMP as preferred. For clinicians, PMP signals process discipline but does not by itself open clinical-domain doors; it is a force multiplier paired with clinical credentials.",
    "pathScores": {
      "healthTech": {
        "industryPlacement": 70,
        "vendorDemand": 72,
        "salaryPremium": 75,
        "technicalSkillDepth": 45,
        "transitionFit": 65,
        "efficiency": 55
      }
    },
    "legacyRoiSignals": null
  },
  {
    "name": "ISO 13485 / Medical Device QMS Training",
    "type": "Certification",
    "discipline": "QA/Informatics",
    "disciplines": [
      "QA",
      "PT",
      "OT",
      "Informatics"
    ],
    "evidence": "ISO 13485 Lead Auditor and Internal Auditor certificates (BSI, SGS, ASQ, Exemplar Global) are commonly listed as required/preferred in MedTech QA/RA postings at Stryker, Medtronic, J&J MedTech, and Boston Scientific, where QA Engineer I/II salaries range $75K–$110K and Senior QA/RA Specialist roles reach $110K–$150K per BLS OES data for QA roles in medical-device manufacturing (NAICS 3391). Short courses run $1,500–$3,000 and 2–5 days, but PTs/OTs rarely list 13485 alone; it is most effective when paired with prior MedTech exposure (clinical specialist, field rep) since the standard is process/audit-focused rather than clinical.",
    "pathScores": {
      "healthTech": {
        "industryPlacement": 55,
        "vendorDemand": 60,
        "salaryPremium": 50,
        "technicalSkillDepth": 55,
        "transitionFit": 35,
        "efficiency": 80
      }
    },
    "legacyRoiSignals": null
  },
  {
    "name": "Lower Limb Amputee Rehabilitation (Physiopedia/ICRC Certificate)",
    "type": "Training",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "No US board certification exists for amputee rehabilitation; the most established openly available credential is the ~24-contact-hour Lower Limb Amputee Rehabilitation Programme from Physiopedia Plus in partnership with the ICRC, covering post-op/pre-prosthetic management, prosthetic gait training, and outcome measures. Underlying care evidence is moderate-strong: meta-analyses show exercise and gait training improve prosthetic gait and balance, and acute post-op rehab is associated with 1-year survival and prosthetic procurement; though only ~7% of guideline recommendations derive from RCTs/SRs. Although acute/inpatient pre-prosthetic care is the entry point, the bulk of prosthetic gait, balance, and return-to-activity training occurs across outpatient, home-health, and community settings, where PT–prosthetist collaboration is ongoing; so applicability is not confined to IRF/VA/acute.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 70,
        "caseloadApplicability": 42,
        "reimbursement": 40,
        "efficiency": 75,
        "marketDemand": 38,
        "patientSatisfaction": 72
      },
      "business": {
        "cashPayViability": 35,
        "pricingLeverage": 30,
        "marketDifferentiation": 55,
        "ownerLeverage": 45,
        "marketDemand": 32,
        "efficiency": 70
      },
      "academicClinical": {
        "facultyRecognition": 45,
        "scholarship": 60,
        "teachingValue": 70,
        "evidenceDepth": 55,
        "facultyDemand": 42,
        "efficiency": 70
      }
    }
  },
  {
    "name": "Aquatic Therapeutic Exercise Certification (ATRIC)",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT",
      "AT",
      "EP"
    ],
    "evidence": "Granted by the Aquatic Therapy & Rehab Institute: 15 hours of aquatic education plus a 75-question proctored exam ($255-675 all-in), open to PTs, OTs, ATs, EPs, and other rehab professionals. The underlying intervention is well evidenced; Cochrane reviews support aquatic exercise for knee/hip OA, fibromyalgia, and post-stroke ADLs; meta-analyses support benefits in Parkinson's, MS, low back pain (including a 2022 JAMA Network Open RCT), and pediatric CP. Effects are generally comparable to land-based exercise; the key practical constraint is therapy-pool access.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 62,
        "caseloadApplicability": 35,
        "reimbursement": 55,
        "efficiency": 42,
        "marketDemand": 45,
        "patientSatisfaction": 75
      },
      "business": {
        "cashPayViability": 55,
        "pricingLeverage": 45,
        "marketDifferentiation": 62,
        "ownerLeverage": 28,
        "marketDemand": 45,
        "efficiency": 48
      },
      "academicClinical": {
        "facultyRecognition": 35,
        "scholarship": 45,
        "teachingValue": 50,
        "evidenceDepth": 65,
        "facultyDemand": 30,
        "efficiency": 60
      }
    }
  },
  {
    "name": "ImPACT Trained Physical Therapist (ITPT)",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "$349, ~7.25 contact-hour online credential from ImPACT Applications Inc. covering concussion clinical trajectories, vestibular therapy, cervical spine rehab, vision therapy, and return-to-activity; graduates are listed in ImPACT's provider directory. Evidence is split: concussion rehabilitation itself has strong support (cervicovestibular rehab RCT, two Buffalo-protocol aerobic exercise RCTs, Amsterdam 2022 consensus), while ImPACT-the-test's psychometrics are contested in independent reliability studies. Concussion-rehabilitation evidence extends to non-athlete adults (Langevin 2022, J Neurotrauma RCT in persistent mTBI), so the credential’s clinical value is not limited to sports return-to-play despite ImPACT-the-test’s sports-baseline orientation.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 68,
        "caseloadApplicability": 60,
        "reimbursement": 40,
        "efficiency": 85,
        "marketDemand": 66,
        "patientSatisfaction": 70
      },
      "business": {
        "cashPayViability": 72,
        "pricingLeverage": 58,
        "marketDifferentiation": 65,
        "ownerLeverage": 68,
        "marketDemand": 62,
        "efficiency": 88
      },
      "academicClinical": {
        "facultyRecognition": 30,
        "scholarship": 38,
        "teachingValue": 50,
        "evidenceDepth": 55,
        "facultyDemand": 30,
        "efficiency": 70
      }
    }
  },
  {
    "name": "Musculoskeletal Ultrasound (RMSK)",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT",
      "AT"
    ],
    "evidence": "RMSK (Registered in Musculoskeletal sonography, APCA/Inteleos) is the established credential for PTs, backed by a formal APTA-AIUM-Inteleos education pathway; eligibility requires a valid PT license plus 150 MSK ultrasound studies in 36 months and a 4-hour exam ($600). Diagnostic accuracy of MSK ultrasound rivals MRI for common pathologies, and PT-performed scanning shows moderate-to-substantial agreement with radiologists; but Medicare considers diagnostic ultrasound codes non-covered when performed by PTs, confining billing to cash-pay and select private payers.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 58,
        "caseloadApplicability": 76,
        "reimbursement": 20,
        "efficiency": 42,
        "marketDemand": 55,
        "patientSatisfaction": 70
      },
      "business": {
        "cashPayViability": 75,
        "pricingLeverage": 68,
        "marketDifferentiation": 85,
        "ownerLeverage": 58,
        "marketDemand": 52,
        "efficiency": 42
      },
      "academicClinical": {
        "facultyRecognition": 72,
        "scholarship": 70,
        "teachingValue": 75,
        "evidenceDepth": 62,
        "facultyDemand": 62,
        "efficiency": 52
      },
      "research": {
        "methodologyDepth": 75,
        "publicationTrack": 70,
        "grantReadiness": 52,
        "pathwayToIndependence": 58,
        "interdisciplinaryFit": 80,
        "efficiency": 48
      }
    }
  },
  {
    "name": "Postural Restoration Certified (PRC)",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT",
      "AT"
    ],
    "evidence": "Postural Restoration Institute credential (est. 2004) requiring four primary courses (~75 contact hours), case-study application, and an annual in-person exam; only ~267 clinicians have ever earned it. Evidence base is thin; small RCTs show parity with conventional exercise, supported indirectly by stronger basic-science work on diaphragm postural-respiratory function.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 35,
        "caseloadApplicability": 55,
        "reimbursement": 52,
        "efficiency": 45,
        "marketDemand": 50,
        "patientSatisfaction": 70
      },
      "business": {
        "cashPayViability": 76,
        "pricingLeverage": 72,
        "marketDifferentiation": 82,
        "ownerLeverage": 60,
        "marketDemand": 55,
        "efficiency": 45
      },
      "academicClinical": {
        "facultyRecognition": 30,
        "scholarship": 24,
        "teachingValue": 44,
        "evidenceDepth": 22,
        "facultyDemand": 26,
        "efficiency": 40
      }
    }
  },
  {
    "name": "PWR!Moves Certified Therapist (Parkinson Wellness Recovery)",
    "type": "Certification",
    "discipline": "PT/OT",
    "disciplines": [
      "PT",
      "OT"
    ],
    "evidence": "15-17.5 contact-hour workshop from Parkinson Wellness Recovery (founded 2010 by Dr. Becky Farley, co-author of the original amplitude-based training research that also underpins LSVT BIG). Trains PD-specific functional and group exercise; valid 3 years. Shares the amplitude/neuroplasticity lineage with LSVT BIG but uses a flexible, multi-stage, group- and community-oriented model. PWR!-specific trial evidence is sparse; the credible base is the broader PD-exercise literature (SPARX, Corcos, Petzinger).",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 67,
        "caseloadApplicability": 72,
        "reimbursement": 58,
        "efficiency": 71,
        "marketDemand": 71,
        "patientSatisfaction": 78
      },
      "business": {
        "cashPayViability": 76,
        "pricingLeverage": 62,
        "marketDifferentiation": 65,
        "ownerLeverage": 73,
        "marketDemand": 71,
        "efficiency": 73
      },
      "academicClinical": {
        "facultyRecognition": 57,
        "scholarship": 54,
        "teachingValue": 66,
        "evidenceDepth": 60,
        "facultyDemand": 52,
        "efficiency": 60
      }
    }
  },
  {
    "name": "Selective Functional Movement Assessment (SFMA)",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT",
      "AT"
    ],
    "evidence": "Clinician-facing sibling of the FMS for patients WITH pain, reserved for licensed providers. Level 1 (~$799, diagnostic algorithm) and Level 2 (treatment model) with exam. Inter-rater reliability among certified raters is fair-to-moderate (ICC 0.61-0.72); predictive validity of the parent FMS framework is contested-to-negative in multiple meta-analyses, and no RCT shows SFMA-guided care outperforms standard examination.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 45,
        "caseloadApplicability": 72,
        "reimbursement": 32,
        "efficiency": 58,
        "marketDemand": 58,
        "patientSatisfaction": 56
      },
      "business": {
        "cashPayViability": 66,
        "pricingLeverage": 48,
        "marketDifferentiation": 52,
        "ownerLeverage": 55,
        "marketDemand": 56,
        "efficiency": 64
      },
      "academicClinical": {
        "facultyRecognition": 40,
        "scholarship": 46,
        "teachingValue": 56,
        "evidenceDepth": 38,
        "facultyDemand": 32,
        "efficiency": 60
      }
    }
  },
  {
    "name": "Acute Care POCUS: Lung & Diaphragm Ultrasound",
    "type": "Certification",
    "discipline": "PT/RT",
    "disciplines": [
      "PT",
      "RT"
    ],
    "evidence": "Lung and diaphragm point-of-care ultrasound is an established, evidence-supported bedside assessment for ICU/acute-care physiotherapists and respiratory therapists, with substantial interrater reliability and demonstrated influence on respiratory-physiotherapy decisions (atelectasis vs effusion vs consolidation, airway-clearance targeting, mobilization safety, ventilator weaning readiness). The accurate credential path is a focused POCUS Certificate/Certification track (e.g., Inteleos POCUS Certification Academy Lung and Critical Care offerings) layered on POCUS Fundamentals; distinct from the outpatient RMSK pathway.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 68,
        "caseloadApplicability": 72,
        "reimbursement": 22,
        "efficiency": 74,
        "marketDemand": 55,
        "patientSatisfaction": 48
      },
      "business": {
        "cashPayViability": 14,
        "pricingLeverage": 30,
        "marketDifferentiation": 66,
        "ownerLeverage": 24,
        "marketDemand": 52,
        "efficiency": 70
      },
      "academicClinical": {
        "facultyRecognition": 60,
        "scholarship": 72,
        "teachingValue": 70,
        "evidenceDepth": 74,
        "facultyDemand": 50,
        "efficiency": 64
      },
      "research": {
        "methodologyDepth": 76,
        "publicationTrack": 80,
        "grantReadiness": 60,
        "pathwayToIndependence": 58,
        "interdisciplinaryFit": 84,
        "efficiency": 66
      }
    }
  },
  {
    "name": "CAPP-OB (Certificate of Advanced Practice in Physical Therapy in Obstetric Health)",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "The CAPP-OB (Certificate of Advanced Practice in Physical Therapy in Obstetric Health) is the APTA Academy of Pelvic Health Physical Therapy's advanced obstetric credential, requiring licensed PTs/PTAs to complete all levels of the Pregnancy & Postpartum track (restructured in 2025 into three webinars; Fundamental, Intrapartum, and Advanced topics, ~48 contact hours), pass each Post-Course Exam at 80% or higher with scenario testing, and submit a reviewed PT case reflection, all within a 5-year window. It is a respected, focused academy certificate for obstetric/peripartum PT rather than an ABPTS board certification.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 76,
        "efficiency": 72,
        "caseloadApplicability": 74,
        "reimbursement": 68,
        "marketDemand": 86,
        "patientSatisfaction": 84
      },
      "business": {
        "cashPayViability": 92,
        "pricingLeverage": 88,
        "marketDifferentiation": 80,
        "ownerLeverage": 74,
        "marketDemand": 90,
        "efficiency": 78
      },
      "academicClinical": {
        "facultyRecognition": 72,
        "scholarship": 62,
        "teachingValue": 80,
        "evidenceDepth": 84,
        "facultyDemand": 70,
        "efficiency": 72
      }
    }
  },
  {
    "name": "CAPP-Pelvic (Certificate of Advanced Practice in Physical Therapy in Pelvic Health)",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "The CAPP-Pelvic (formerly 'Certificate of Achievement,' now 'Certificate of Advanced Practice in Physical Therapy in Pelvic Health') is awarded by the APTA Academy of Pelvic Health Physical Therapy to licensed PTs/PTAs who complete all three levels of its Pelvic Health track (~87 contact hours covering pelvic floor evaluation, bowel dysfunction, pelvic pain, and a specialty option), pass course testing at 80% or higher, and submit a reviewed PT case reflection. Coursework must be completed within 5 years with at least 6 months post-licensure experience. It is a respected, structured academy certificate rather than an ABPTS board certification (the board credential being the ABPTS Women's Health Clinical Specialist, WCS).",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 78,
        "efficiency": 70,
        "caseloadApplicability": 80,
        "reimbursement": 70,
        "marketDemand": 88,
        "patientSatisfaction": 82
      },
      "business": {
        "cashPayViability": 95,
        "pricingLeverage": 90,
        "marketDifferentiation": 82,
        "ownerLeverage": 76,
        "marketDemand": 90,
        "efficiency": 78
      },
      "academicClinical": {
        "facultyRecognition": 74,
        "scholarship": 62,
        "teachingValue": 82,
        "evidenceDepth": 85,
        "facultyDemand": 72,
        "efficiency": 70
      }
    }
  },
  {
    "name": "EIM Pelvic Health Specialist Certification",
    "type": "Certification",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "Evidence In Motion's Pelvic Health Specialist Certification is a hybrid (online didactic plus in-person/virtual lab) post-professional program of roughly 7-9 months, comprising 7 required courses plus 2 electives, including in-depth internal (intravaginal/intrarectal) and external evaluation and treatment, therapeutic neuroscience education, and capstone examinations. Base tuition is approximately $4,950 (with an optional post-professional DPT add-on of ~$6,300), and it is open to PT, PTA, OT, and OTA. It is a rigorous certificate of competency rather than an ABPTRFE-accredited fellowship or ABPTS board certification; the strongest accredited pathways remain ABPTRFE pelvic/women's-health residencies and the ABPTS Women's Health (WCS) board certification.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 78,
        "efficiency": 62,
        "caseloadApplicability": 80,
        "reimbursement": 70,
        "marketDemand": 90,
        "patientSatisfaction": 82
      },
      "business": {
        "cashPayViability": 95,
        "pricingLeverage": 92,
        "marketDifferentiation": 80,
        "ownerLeverage": 78,
        "marketDemand": 92,
        "efficiency": 72
      },
      "academicClinical": {
        "facultyRecognition": 68,
        "scholarship": 60,
        "teachingValue": 80,
        "evidenceDepth": 85,
        "facultyDemand": 70,
        "efficiency": 65
      }
    }
  },
  {
    "name": "AACVPR Certified Cardiac Rehabilitation Professional (CCRP)",
    "type": "Certification",
    "discipline": "PT/RN/RT",
    "disciplines": [
      "PT",
      "RN",
      "RT",
      "EP"
    ],
    "evidence": "The CCRP is the individual professional credential aligned with the AACVPR/AHA core competencies for cardiac rehabilitation and secondary prevention; distinct from AACVPR program/facility certification. Open to the interdisciplinary CR team (PT, RN, RT, exercise physiologist), it requires ~1,200 documented clinical hours and a 140-item proctored exam (3-year recert). The clinical domain has tier-1 mortality and rehospitalization evidence (Cochrane cardiac rehab, HF-ACTION, Medicare registry studies); credential-specific outcome studies are essentially absent.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 80,
        "caseloadApplicability": 55,
        "reimbursement": 58,
        "efficiency": 50,
        "marketDemand": 68,
        "patientSatisfaction": 72
      },
      "business": {
        "cashPayViability": 12,
        "pricingLeverage": 15,
        "marketDifferentiation": 50,
        "ownerLeverage": 18,
        "marketDemand": 22,
        "efficiency": 32
      },
      "academicClinical": {
        "facultyRecognition": 60,
        "scholarship": 66,
        "teachingValue": 60,
        "evidenceDepth": 84,
        "facultyDemand": 55,
        "efficiency": 50
      }
    }
  },
  {
    "name": "Advanced Cardiovascular Life Support (ACLS)",
    "type": "Certification",
    "discipline": "PT/RN/RT",
    "disciplines": [
      "PT",
      "RN",
      "RT"
    ],
    "evidence": "ACLS is the American Heart Association's provider credential in advanced management of cardiac arrest, peri-arrest arrhythmias, and acute cardiopulmonary emergencies (valid 2 years). Not universally required of PTs, but commonly an employer competency requirement for therapists in ICU, acute cardiac care, and cardiac-rehab settings where they monitor telemetry and risk-stratified exercise. It is a low-cost, broad safety/competency credential rather than a scope-expanding specialty.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 55,
        "caseloadApplicability": 42,
        "reimbursement": 15,
        "efficiency": 85,
        "marketDemand": 62,
        "patientSatisfaction": 45
      },
      "business": {
        "cashPayViability": 5,
        "pricingLeverage": 8,
        "marketDifferentiation": 22,
        "ownerLeverage": 10,
        "marketDemand": 15,
        "efficiency": 82
      },
      "academicClinical": {
        "facultyRecognition": 28,
        "scholarship": 42,
        "teachingValue": 38,
        "evidenceDepth": 70,
        "facultyDemand": 28,
        "efficiency": 80
      }
    }
  },
  {
    "name": "Cardiovascular & Pulmonary PT Residency (ABPTRFE)",
    "type": "Residency",
    "discipline": "PT",
    "disciplines": [
      "PT"
    ],
    "evidence": "A ~12-month post-professional clinical residency accredited by ABPTRFE, with 150+ hours of 1:1 mentoring by a board-certified Cardiovascular & Pulmonary Clinical Specialist and structured didactics across acute care, ICU, and outpatient cardiac/pulmonary rehab. Distinct from the CCS board certification but a recognized high-signal pathway that prepares residents to sit for the CCS exam. Programs run at academic medical centers and VA systems. The underlying clinical domain (cardiac rehab, COPD pulmonary rehab, ICU early mobilization) has tier-1 evidence; credential-specific outcome data are sparse.",
    "pathScores": {
      "clinical": {
        "clinicalOutcomes": 80,
        "caseloadApplicability": 60,
        "reimbursement": 50,
        "efficiency": 35,
        "marketDemand": 64,
        "patientSatisfaction": 75
      },
      "business": {
        "cashPayViability": 10,
        "pricingLeverage": 15,
        "marketDifferentiation": 55,
        "ownerLeverage": 12,
        "marketDemand": 22,
        "efficiency": 28
      },
      "academicClinical": {
        "facultyRecognition": 88,
        "scholarship": 80,
        "teachingValue": 85,
        "evidenceDepth": 82,
        "facultyDemand": 80,
        "efficiency": 40
      }
    }
  }
];
