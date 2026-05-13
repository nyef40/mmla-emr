// OASIS E2 – Nurse Recertification form data types
// Based on CMS OASIS-E2 instrument (effective 4/1/2026)

export type OasisHeader = {
  billingCode: string;        // SNRC-SN Recert Visit
  timeIn: string;
  timeOut: string;
  episodeNumber: string;
  certPeriodFrom: string;     // Certification period from (M0030 implied)
  certPeriodTo: string;
  assessmentReasonCode: string; // M0100: 04 = recert follow-up
};

export type OasisPatientTracking = {
  // M0010 CMS Certification Number
  cmsCertNumber: string;
  // M0014 Branch State
  branchState: string;
  // M0018 NPI of attending physician
  physicianNpi: string;
  // M0020 Patient ID
  patientIdNumber: string;
  // M0030 Start of Care Date (pre-filled)
  socDate: string;
  // M0032 Resumption of Care Date
  resumptionDate: string;
  resumptionNA: boolean;
  // M0040 Patient Name (pre-filled)
  // M0050 Patient State of Residence
  patientState: string;
  // M0060 Patient ZIP Code
  patientZip: string;
  // M0063 Medicare Number
  medicareNumber: string;
  medicareNA: boolean;
  // M0065 Medicaid Number
  medicaidNumber: string;
  medicaidNA: boolean;
  // M0066 Birth Date (pre-filled)
  // A0810 Sex
  sex: "male" | "female" | "";
  // M0150 Payment Sources
  paymentMedicare: boolean;
  paymentMedicareAdv: boolean;
  paymentMedicaid: boolean;
  paymentMedicaidHMO: boolean;
  paymentWorkersComp: boolean;
  paymentTitle: boolean;
  paymentOtherGov: boolean;
  paymentPrivate: boolean;
  paymentPrivateHMO: boolean;
  paymentSelfPay: boolean;
  paymentOther: string;
};

export type OasisClinicalRecord = {
  // M0080 Discipline
  discipline: "RN" | "PT" | "SLP" | "OT" | "";
  // M0090 Date Assessment Completed
  assessmentDate: string;
  // M0100 Reason for Assessment
  reasonCode: "04" | "05" | "";  // 04=recert follow-up, 05=other follow-up
};

export type OasisDiagnosis = {
  description: string;
  icdCode: string;
  symptomControl: "0" | "1" | "2" | "3" | "4" | "";
  diagDate: string;
  type: "E" | "O" | "";  // E=Exacerbation, O=Ongoing
};

export type OasisDiagnoses = {
  primary: OasisDiagnosis;
  others: OasisDiagnosis[];
  pertinentHistory: string;
  lastHospitalization: string;
  lastPhysicianContact: string;
  advanceDirectives: string;
};

export type OasisImmunization = {
  pneumococcal: "unknown" | "no" | "yes";
  pneumococcalDate: string;
  pneumococcalDetail: string;
  influenza: "unknown" | "no" | "yes";
  influenzaDate: string;
  influenzaDetail: string;
  shingles: "unknown" | "no" | "yes";
  shinglesDate: string;
  covid: "unknown" | "no" | "yes";
  covidDate: string;
  covidDetail: string;
};

export type OasisSafety = {
  // Environmental hazards (select all)
  stairsInOut: boolean;
  inadequateHeating: boolean;
  inadequateLighting: boolean;
  inadequateSanitation: boolean;
  oxygenInUse: boolean;
  cluttered: boolean;
  floorCoverings: boolean;
  noneIdentified: boolean;
  // Emergency planning
  fireExtinguisher: boolean;
  smokeDetectorAll: boolean;
  smokeDetectorMaintained: boolean;
  moreThanOneExit: boolean;
  planForExit: boolean;
  planForPowerFailure: boolean;
  planForNaturalDisaster: boolean;
  // Equipment
  walker: boolean;
  cane: boolean;
  wheelchair: boolean;
  safetyMeasuresNotes: string;
};

export type OasisVitalSigns = {
  temp: string;
  tempMethod: string;
  heartRate: string;
  heartRhythm: "regular" | "irregular" | "";
  bpSystolic: string;
  bpDiastolic: string;
  bpPosition: string;
  bpArm: "L" | "R" | "";
  respiratoryRate: string;
  respiratoryRhythm: "regular" | "irregular" | "";
  pulseOx: string;
  height: string;
  weight: string;
  weightReported: boolean;
};

export type OasisNeuroCognitive = {
  // Pupillary
  pupillaryRReactive: boolean;
  pupillaryLReactive: boolean;
  // Neuro findings
  lossOfBalance: boolean;
  seizuresTremors: boolean;
  weaknessParalysis: boolean;
  weaknessR: boolean;
  weaknessL: boolean;
  // Orientation
  orientedPerson: boolean;
  orientedPlace: boolean;
  orientedTime: boolean;
  orientedSituation: boolean;
  alert: boolean;
  confused: boolean;
  agitated: boolean;
  depressed: boolean;
  // Risk factors
  smokingObesity: boolean;
  noneRiskFactors: boolean;
  // Abuse/neglect
  noneObserved: boolean;
  cognitiveNotes: string;
};

export type OasisRespiratory = {
  lungsAllClear: boolean;
  respirationsEasy: boolean;
  dyspneaWithExertion: boolean;
  dyspneaAtRest: boolean;
  cough: boolean;
  coughProductive: boolean;
  oxygenUse: boolean;
  o2Lpm: string;
  o2Delivery: string;
  additionalNotes: string;
};

export type OasisCardiovascular = {
  normalHeartSounds: boolean;
  atrialFib: boolean;
  pacemaker: boolean;
  capillaryRefillLess3: boolean;
  edemaPedal: boolean;
  edemaR: boolean;
  edemaL: boolean;
  edemaDependent: boolean;
  nonPitting: boolean;
  pittingGrade: string;
  additionalNotes: string;
};

export type OasisUrinary = {
  // History
  noHistory: boolean;
  frequentUTI: boolean;
  kidneyStones: boolean;
  // Current symptoms
  urgency: boolean;
  incontinence: boolean;
  frequency: boolean;
  // Catheter
  catheterFoley: boolean;
  catheterSuprapubic: boolean;
  catheterCondom: boolean;
  urineColor: string;
  additionalNotes: string;
};

export type OasisGastrointestinal = {
  heartBurn: boolean;
  nausea: boolean;
  constipation: boolean;
  diarrhea: boolean;
  incontinence: boolean;
  lastBM: string;
  bowelSoundsNormal: boolean;
  additionalNotes: string;
};

export type OasisNutritional = {
  appetiteGood: boolean;
  appetiteFair: boolean;
  appetitePoor: boolean;
  difficultySwallowing: boolean;
  thyroidDisease: boolean;
  hypo: boolean;
  hyper: boolean;
  hypoOnTreatment: boolean;
  nutritionalScore: string;
  dietNotes: string;
};

export type OasisInfusion = {
  purposeIVIG: boolean;
  purposeAntibiotics: boolean;
  purposePainControl: boolean;
  purposeOther: string;
  accessPeripheral: boolean;
  accessMidline: boolean;
  accessCentral: boolean;
  brandType: string;
  gauge: string;
  snToAdminister: boolean;
  infusionTherapyNotes: string;
  therapyGoals: string;
  snOrders: string;
};

// OASIS Functional Status (M-codes)
export type OasisFunctionalStatus = {
  // M1800 Grooming
  m1800: "0" | "1" | "2" | "3" | "";
  // M1810 Dress Upper Body
  m1810: "0" | "1" | "2" | "3" | "";
  // M1820 Dress Lower Body
  m1820: "0" | "1" | "2" | "3" | "";
  // M1830 Bathing
  m1830: "0" | "1" | "2" | "3" | "4" | "5" | "6" | "";
  // M1840 Toilet Transferring
  m1840: "0" | "1" | "2" | "3" | "4" | "";
  // M1850 Transferring
  m1850: "0" | "1" | "2" | "3" | "4" | "5" | "";
  // M1860 Ambulation/Locomotion
  m1860: "0" | "1" | "2" | "3" | "4" | "5" | "6" | "";
  ambulation_notes: string;
  weightBearingLimitations: string;
  assistiveDevices: string;
  activitiesPermitted: string;
  functionalLimitations: string;
};

// GG Functional Abilities (OASIS E2 GG0130, GG0170)
export type OasisFunctionalAbilities = {
  // GG0130 Self-Care (Follow-Up performance codes 01-06, 07,09,10,88)
  gg0130_eating: string;
  gg0130_oralHygiene: string;
  gg0130_toiletHygiene: string;
  // GG0170 Mobility
  gg0170_rollLeftRight: string;
  gg0170_sitToLying: string;
  gg0170_lyingToSitting: string;
  gg0170_sitToStand: string;
  gg0170_chairTransfer: string;
  gg0170_toiletTransfer: string;
  gg0170_walk10Feet: string;
  gg0170_walk50Feet: string;
  gg0170_walkUneven: string;
  gg0170_oneStepCurb: string;
  gg0170_fourSteps: string;
  gg0170_wheelchair: string;
};

export type OasisFallRisk = {
  mostRecentFall: "less3mo" | "3to6mo" | "7to12mo" | "overYear" | "noFalls" | "";
  fallDescription: string;
  // MAHC-10 Fall Risk Assessment checkboxes
  age65plus: boolean;
  diagnosisMultiple: boolean;
  priorFall3mo: boolean;
  incontinence: boolean;
  visualImpairment: boolean;
  impairedFunctional: boolean;
  environmentalHazards: boolean;
  polyPharmacy: boolean;
  painAffectingFunction: boolean;
  cognitiveImpairment: boolean;
  mahc10Total: string;
};

export type OasisSkinIntegumentary = {
  // Pressure ulcer risk
  purposeRisk: "no_ulcer_at_risk" | "ulcer_stage2plus" | "";
  colorNormal: boolean;
  colorPale: boolean;
  skinTurgorGood: boolean;
  skinTurgorFair: boolean;
  tempDry: boolean;
  tempWarm: boolean;
  woundsIdentified: boolean;
  // M1306
  m1306UnhealedUlcer: "0" | "1" | "";
  integumentaryNotes: string;
};

export type OasisMedications = {
  additionalNotes: string;
  medChangedSinceLastVisit: boolean;
};

export type OasisCareManagement = {
  primaryCaregiverChanges: string;
  rehospitalizationRisk: string;
  // M1033 Risk for hospitalization (check all that apply)
  m1033HistoryFalls: boolean;
  m1033WeightLoss: boolean;
  m1033TakingManyMeds: boolean;
  m1033CurrentlyExhaustion: boolean;
  m1033OtherRisk: boolean;
  m1033None: boolean;
};

export type OasisAssessmentSummary = {
  summaryText: string;
  suppliesUsed: string;
  interventionsProvided: string;
  responseToInterventions: string;
};

export type OasisPlanOfCare = {
  homeboundStatus: string;
  recertificationEligibility: string;
  faceToFace: string;
  prognosis: string;
  rehabPotential: string;
  dme: string;
  otherInterventions: string;
  otherGoals: string;
  dischargePlan: string;
  plansForNextVisit: string;
};

export type OasisSignatures = {
  patientSignedAt: string | null;
  rnPrintName: string;
  rnSignedAt: string | null;
  rnCredential: string;
  verbalOrderFrom: string;
  verbalOrderDate: string;
  verbalOrderTime: string;
  supervisoryVisit: boolean;
  supervisorName: string;
};

export type OasisRecertFormData = {
  header: OasisHeader;
  patientTracking: OasisPatientTracking;
  clinicalRecord: OasisClinicalRecord;
  diagnoses: OasisDiagnoses;
  immunization: OasisImmunization;
  safety: OasisSafety;
  vitalSigns: OasisVitalSigns;
  neuroCognitive: OasisNeuroCognitive;
  respiratory: OasisRespiratory;
  cardiovascular: OasisCardiovascular;
  urinary: OasisUrinary;
  gastrointestinal: OasisGastrointestinal;
  nutritional: OasisNutritional;
  infusion: OasisInfusion;
  functionalStatus: OasisFunctionalStatus;
  functionalAbilities: OasisFunctionalAbilities;
  fallRisk: OasisFallRisk;
  skinIntegumentary: OasisSkinIntegumentary;
  medications: OasisMedications;
  careManagement: OasisCareManagement;
  assessmentSummary: OasisAssessmentSummary;
  planOfCare: OasisPlanOfCare;
  signatures: OasisSignatures;
};

export function createDefaultOasisData(
  rnName = "",
  patientData?: {
    socDate?: string; medicareNumber?: string; state?: string; zip?: string; sex?: string;
    npi?: string; patientId?: string;
  }
): OasisRecertFormData {
  return {
    header: {
      billingCode: "SNRC-SN Recert Visit",
      timeIn: "", timeOut: "",
      episodeNumber: "",
      certPeriodFrom: "", certPeriodTo: "",
      assessmentReasonCode: "04",
    },
    patientTracking: {
      cmsCertNumber: "", branchState: "CA",
      physicianNpi: patientData?.npi ?? "",
      patientIdNumber: patientData?.patientId ?? "",
      socDate: patientData?.socDate ?? "",
      resumptionDate: "", resumptionNA: true,
      patientState: patientData?.state ?? "CA",
      patientZip: patientData?.zip ?? "",
      medicareNumber: patientData?.medicareNumber ?? "",
      medicareNA: false,
      medicaidNumber: "", medicaidNA: false,
      sex: (patientData?.sex === "female" ? "female" : patientData?.sex === "male" ? "male" : ""),
      paymentMedicare: true, paymentMedicareAdv: false, paymentMedicaid: false,
      paymentMedicaidHMO: false, paymentWorkersComp: false, paymentTitle: false,
      paymentOtherGov: false, paymentPrivate: false, paymentPrivateHMO: false,
      paymentSelfPay: false, paymentOther: "",
    },
    clinicalRecord: { discipline: "RN", assessmentDate: "", reasonCode: "04" },
    diagnoses: {
      primary: { description: "", icdCode: "", symptomControl: "", diagDate: "", type: "" },
      others: [],
      pertinentHistory: "", lastHospitalization: "", lastPhysicianContact: "", advanceDirectives: "",
    },
    immunization: {
      pneumococcal: "unknown", pneumococcalDate: "", pneumococcalDetail: "",
      influenza: "unknown", influenzaDate: "",
      shingles: "unknown", shinglesDate: "",
      covid: "unknown", covidDate: "", covidDetail: "",
    },
    safety: {
      stairsInOut: false, inadequateHeating: false, inadequateLighting: false,
      inadequateSanitation: false, oxygenInUse: false, cluttered: false,
      floorCoverings: false, noneIdentified: false,
      fireExtinguisher: false, smokeDetectorAll: false, smokeDetectorMaintained: false,
      moreThanOneExit: false, planForExit: false, planForPowerFailure: false, planForNaturalDisaster: false,
      walker: false, cane: false, wheelchair: false,
      safetyMeasuresNotes: "",
    },
    vitalSigns: {
      temp: "", tempMethod: "Non-Contact Temporal",
      heartRate: "", heartRhythm: "",
      bpSystolic: "", bpDiastolic: "", bpPosition: "Sitting", bpArm: "",
      respiratoryRate: "", respiratoryRhythm: "",
      pulseOx: "", height: "", weight: "", weightReported: false,
    },
    neuroCognitive: {
      pupillaryRReactive: false, pupillaryLReactive: false,
      lossOfBalance: false, seizuresTremors: false, weaknessParalysis: false,
      weaknessR: false, weaknessL: false,
      orientedPerson: false, orientedPlace: false, orientedTime: false, orientedSituation: false,
      alert: false, confused: false, agitated: false, depressed: false,
      smokingObesity: false, noneRiskFactors: false, noneObserved: false,
      cognitiveNotes: "",
    },
    respiratory: {
      lungsAllClear: false, respirationsEasy: false,
      dyspneaWithExertion: false, dyspneaAtRest: false,
      cough: false, coughProductive: false,
      oxygenUse: false, o2Lpm: "", o2Delivery: "",
      additionalNotes: "",
    },
    cardiovascular: {
      normalHeartSounds: false, atrialFib: false, pacemaker: false,
      capillaryRefillLess3: false,
      edemaPedal: false, edemaR: false, edemaL: false, edemaDependent: false,
      nonPitting: false, pittingGrade: "",
      additionalNotes: "",
    },
    urinary: {
      noHistory: false, frequentUTI: false, kidneyStones: false,
      urgency: false, incontinence: false, frequency: false,
      catheterFoley: false, catheterSuprapubic: false, catheterCondom: false,
      urineColor: "", additionalNotes: "",
    },
    gastrointestinal: {
      heartBurn: false, nausea: false, constipation: false, diarrhea: false,
      incontinence: false, lastBM: "", bowelSoundsNormal: false, additionalNotes: "",
    },
    nutritional: {
      appetiteGood: false, appetiteFair: false, appetitePoor: false,
      difficultySwallowing: false,
      thyroidDisease: false, hypo: false, hyper: false, hypoOnTreatment: false,
      nutritionalScore: "", dietNotes: "",
    },
    infusion: {
      purposeIVIG: false, purposeAntibiotics: false, purposePainControl: false, purposeOther: "",
      accessPeripheral: false, accessMidline: false, accessCentral: false,
      brandType: "Introcan 24G 3/4\"",
      gauge: "24G",
      snToAdminister: true,
      infusionTherapyNotes: "",
      therapyGoals: "",
      snOrders: "",
    },
    functionalStatus: {
      m1800: "", m1810: "", m1820: "", m1830: "", m1840: "", m1850: "", m1860: "",
      ambulation_notes: "", weightBearingLimitations: "",
      assistiveDevices: "", activitiesPermitted: "", functionalLimitations: "",
    },
    functionalAbilities: {
      gg0130_eating: "", gg0130_oralHygiene: "", gg0130_toiletHygiene: "",
      gg0170_rollLeftRight: "", gg0170_sitToLying: "", gg0170_lyingToSitting: "",
      gg0170_sitToStand: "", gg0170_chairTransfer: "", gg0170_toiletTransfer: "",
      gg0170_walk10Feet: "", gg0170_walk50Feet: "", gg0170_walkUneven: "",
      gg0170_oneStepCurb: "", gg0170_fourSteps: "", gg0170_wheelchair: "",
    },
    fallRisk: {
      mostRecentFall: "",
      fallDescription: "",
      age65plus: false, diagnosisMultiple: false, priorFall3mo: false,
      incontinence: false, visualImpairment: false, impairedFunctional: false,
      environmentalHazards: false, polyPharmacy: false, painAffectingFunction: false,
      cognitiveImpairment: false,
      mahc10Total: "",
    },
    skinIntegumentary: {
      purposeRisk: "", colorNormal: false, colorPale: false,
      skinTurgorGood: false, skinTurgorFair: false, tempDry: false, tempWarm: false,
      woundsIdentified: false, m1306UnhealedUlcer: "", integumentaryNotes: "",
    },
    medications: { additionalNotes: "", medChangedSinceLastVisit: false },
    careManagement: {
      primaryCaregiverChanges: "",
      rehospitalizationRisk: "",
      m1033HistoryFalls: false, m1033WeightLoss: false, m1033TakingManyMeds: false,
      m1033CurrentlyExhaustion: false, m1033OtherRisk: false, m1033None: false,
    },
    assessmentSummary: {
      summaryText: "", suppliesUsed: "", interventionsProvided: "", responseToInterventions: "",
    },
    planOfCare: {
      homeboundStatus: "", recertificationEligibility: "", faceToFace: "",
      prognosis: "", rehabPotential: "", dme: "",
      otherInterventions: "", otherGoals: "", dischargePlan: "", plansForNextVisit: "",
    },
    signatures: {
      patientSignedAt: null,
      rnPrintName: rnName, rnSignedAt: null, rnCredential: "RN",
      verbalOrderFrom: "", verbalOrderDate: "", verbalOrderTime: "",
      supervisoryVisit: false, supervisorName: "",
    },
  } as unknown as OasisRecertFormData;
}
