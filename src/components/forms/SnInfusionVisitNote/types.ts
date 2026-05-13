export type HeaderData = {
  mileage: string;
  billingCode: string;
  timeIn: string;
  timeOut: string;
  weight: string;
  weightReported: boolean;
  pharmacyChangeReport: boolean;
  nextInfusionDate: string;
  medsListReviewed: boolean;
  ordersReviewed: boolean;
  allergies: string;
  diagnosisText: string;
  prescriber: string;
  prescriberPhone: string;
};

export type SafetyMeasuresData = {
  standard: boolean; droplet: boolean; contact: boolean; airborn: boolean;
  fall: boolean; bleeding: boolean; handwashing: boolean; oxygen: boolean;
  medicationSafety: boolean; sharpDisposal: boolean; covid: boolean;
};

export type SocialCognitiveData = {
  noNegative: boolean;
  alert: boolean; oriented: boolean; forgetful: boolean; anxious: boolean;
  disoriented: boolean; depressed: boolean; agitated: boolean; confused: boolean;
  legallyBlind: boolean; hoh: boolean;
  supportAdequate: boolean; supportInadequate: boolean;
  ssAbuseNeglect: boolean; reported: boolean; difficultyCoping: boolean;
};

export type NeurologicalData = {
  noNegative: boolean;
  haMigraine: boolean; numbness: boolean; tingling: boolean; dizziness: boolean;
  slurredSpeech: boolean; blurredVision: boolean; muscleWeakness: boolean; seizures: boolean;
  handGripWeak: boolean;
  sensoryLossRUE: boolean; sensoryLossRLE: boolean; sensoryLossLUE: boolean; sensoryLossLLE: boolean;
  pupillaryR: boolean; pupillaryL: boolean;
};

export type RespiratoryData = {
  noNegative: boolean;
  lungsClear: boolean; ralesRhonchi: boolean; diminished: boolean; right: boolean; left: boolean;
  coughProductive: boolean; coughNonProductive: boolean; sob: boolean; nebulizer: boolean; wheezing: boolean;
  dyspneaModExcretion: boolean; dyspneaMinExcretion: boolean;
  oxygenLpm: string;
};

export type CardiovascularData = {
  noNegative: boolean;
  pacemaker: boolean; chestPain: boolean; weakPeripheralPulse: boolean; irregularPulse: boolean;
  hemodialysisShunt: boolean; hemodialysisType: string; hemodialysisLocation: string;
  jvdRUE: boolean; jvdLUE: boolean; jvdRLLE: boolean; jvdLLE: boolean;
  edemaTrace: boolean; edemaPlusOne: boolean; edemaPlusTwo: boolean; edemaPlusThree: boolean; edemaPlusFour: boolean;
  pitting: boolean; nonPitting: boolean;
};

export type MusculoskeletalData = {
  noNegative: boolean;
  unsteadyGait: boolean; limitedROM: boolean; stiffness: boolean; contracture: boolean; paralysis: boolean;
  weaknessRUE: boolean; weaknessLUE: boolean; weaknessRLLE: boolean; weaknessLLE: boolean;
  walker: boolean; wheelchair: boolean; cane: boolean;
  poorCoordination: boolean; handMuscleTremors: boolean; grossTremors: boolean; fineTremors: boolean;
  arthritisSevere: boolean; arthritisModerate: boolean; arthritisMild: boolean; arthritisDeformity: boolean;
};

export type PainData = {
  denies: boolean; hasYes: boolean; location: string;
  intensity: string;
  sharp: boolean; dull: boolean; burning: boolean; radiating: boolean;
  freqDaily: boolean; freqLessOften: boolean; freqConstantly: boolean; interferesWithSleep: boolean;
  breakthroughNever: boolean; breakthroughDaily: boolean; breakthroughTwoThreeDay: boolean; breakthroughOther: string;
  painControlAdequate: string;
};

export type EndocrineData = {
  noNegative: boolean;
  hypo: boolean; hyperglycemic: boolean; hypothyroidism: boolean; hyperthyroidism: boolean;
  dmi: boolean; idmii: boolean; nidmii: boolean; bloodGlucoseRange: string;
  patientMonitorsBS: boolean; bsUnderControl: string;
};

export type GastrointestinalData = {
  noNegative: boolean;
  diarrhea: boolean; constipation: boolean; nausea: boolean; vomiting: boolean; anorexia: boolean;
  lastBM: string;
  hypoactive: boolean; hyperactive: boolean; normoactive: boolean;
  colostomy: boolean; ileostomy: boolean; incontinent: boolean;
};

export type NutritionData = {
  noNegative: boolean;
  appetiteGood: boolean; appetiteFair: boolean; appetitePoor: boolean;
  fluidRestriction: boolean; dysphasia: boolean; diet: string;
  ngt: boolean; gt: boolean; jt: boolean;
  feedingBolusRate: string; feedingPumpRate: string;
};

export type GenitourinaryData = {
  noNegative: boolean;
  incontinent: boolean; burning: boolean; urgency: boolean; frequency: boolean; hematuria: boolean;
  frequencyDetail: string;
  catheterCondom: boolean; catheterIFC: boolean; catheterSuprapubic: boolean;
  catheterSizeFr: string; ccBalloon: string; urineColor: string;
};

export type IntegumentaryData = {
  intact: boolean; woundLesion: boolean; tubes: boolean; shunt: boolean;
  jaundiced: boolean; rash: boolean; ecchymosis: boolean; dry: boolean; moist: boolean;
  skinTurgorGood: boolean; skinTurgorFair: boolean; skinTurgorPoor: boolean;
  surgicalWoundSutures: boolean; surgicalWoundStaples: boolean; surgicalWoundOther: string;
  pressureUlcer: boolean; pressureUlcerStageN: boolean; unstaged: boolean; multipleSites: boolean;
  woundSite1Size: string; woundSite2Size: string;
  newChangedWound: boolean; mdContactedWound: string; orderContainedWoundCare: string;
};

export type FunctionalStatusData = {
  ambulatory: boolean; wheelchairBound: boolean; bedbound: boolean;
  requiresADLAssist: boolean; requiresDeviceToAmbulate: boolean;
  adlIndependent: boolean; adlMinAssist: boolean; adlModAssist: boolean; adlMaxAssist: boolean;
  caregiverAvailable: string;
  ssAbuseNeglectReported: boolean;
};

export type NursingDiagnosisData = {
  diseaseProcess: boolean; poc: boolean; adverseIVReactions: boolean; alterationComfort: boolean;
  potentialInfection: boolean; impairedMobility: boolean; ineffectiveCoping: boolean;
  educationProvided: string;
  medsChangedSinceLastVisit: string; mdContacted: string;
  supervisoryVisit: string; supervisoryHHA: boolean; supervisoryLVN: boolean; supervisoryPTA: boolean;
  supervisoryPresent: string; demonstrateCompetency: string;
  pocChanged: string; pocChanges: string;
};

export type BodySystemsData = {
  safetyMeasures: SafetyMeasuresData;
  socialCognitive: SocialCognitiveData;
  neurological: NeurologicalData;
  respiratory: RespiratoryData;
  cardiovascular: CardiovascularData;
  musculoskeletal: MusculoskeletalData;
  pain: PainData;
  endocrine: EndocrineData;
  gastrointestinal: GastrointestinalData;
  nutrition: NutritionData;
  genitourinary: GenitourinaryData;
  integumentary: IntegumentaryData;
  functionalStatus: FunctionalStatusData;
  nursingDiagnosis: NursingDiagnosisData;
};

export type TolerationsData = {
  statusChangedSinceLastVisit: string;
  statusChangeDescription: string;
  fevers: string;
  erVisits: boolean;
  pharmacyNotified: boolean;
  pharmacyCallDateTime: string;
  pharmacyCallPerson: string;
  diseasePoorlyControlled: string;
  poorlyControlledDescription: string;
  returnToFacility: string;
  returnToFacilityRationale: string;
};

export type AccessData = {
  typePort: boolean; typePeripheralIV: boolean; typePICC: boolean;
  piccArmCirc: string; piccLength: string; piccLumens: string; vadFlush: string;
  nsPreInfusion: boolean; postLabDraw: boolean; postInfusion: boolean;
  postInfusionMl: string; postInfusionPercent: string; heparinPostVAD: string;
  locationL: boolean; locationR: boolean; locationH: boolean; locationW: boolean;
  locationFA: boolean; locationAC: boolean; locationUA: boolean;
  locationChest: boolean; locationABD: boolean; locationThigh: boolean; locationBack: boolean;
  dateAccessed: string; dateDeaccessed: string;
  dressingTransparent: boolean; dressingGauze: boolean; dressingMedImpregnated: boolean;
  needleTypeAngiocath: boolean; needleTypeSubcutaneous: boolean; needleTypeHuber: boolean;
  sterileAccess: string;
  needleLength4mm: boolean; needleLength6mm: boolean; needleLength9mm: boolean;
  needleLength12mm: boolean; needleLength14mm: boolean;
  needleLengthThreeQuarter: boolean; needleLengthOneInch: boolean;
  gauge27: boolean; gauge25: boolean; gauge24: boolean; gauge23: boolean; gauge22: boolean; gauge20: boolean;
  attempts: string; attemptDateTime: string;
  pharmStaffName: string;
  stablingStatlock: boolean; stablingCoban: boolean; stablingGauzeNetting: boolean;
  stablingSterilePatch: boolean; stablingOther: boolean;
  subcutaneousSites: string; subcutaneousEducation: string;
};

export type LabsData = {
  na: boolean; cbc: boolean; bmp: boolean; cmp: boolean; bun: boolean; creat: boolean;
  igLevels: boolean; serumViscosity: boolean; igSubclasses: boolean; other: string;
  fedexPickup: boolean; droppedOff: boolean; collectionDateTime: string;
  drawnAtLab: boolean; drawnFromIV: boolean; separatePeripheralStick: boolean;
};

export type MedicationData = {
  brand: string; todayDose: string; volume: string; frequency: string;
  lot: string; expiration: string; lot2: string; expiration2: string;
  hydration: string; hydrationType: string; hangTime: string;
  hydrationAmount: string; hydrationTiming: string;
  equipmentPump: boolean; equipmentGravity: boolean; equipmentRollerClamp: boolean; equipmentOther: string;
  pumpName: string;
  pumpRamp: boolean; pumpTaper: boolean; pumpBolus: boolean; pumpContinuous: boolean;
  titrationRamps: string; maxRate: string; labelRateFollowed: string;
  pharmacyNotified: boolean; pharmacyNotifiedName: string;
  anaphylaxisKit: string; anaphylaxisExpiration: string;
  premedNA: boolean;
  premedAcetaminophen: boolean; premedAcetaminophenDose: string;
  premedDiphenhydramine: boolean; premedDiphenhydramineDose: string;
  premedIbuprofen: boolean; premedIbuprofenDose: string;
  premedAspirin: boolean; premedAspirinDose: string;
  lidocaineCream: boolean; lidocaineTimeApplied: string;
  antiemeticDose: string; antiemeticRoute: string; antiemeticStart: string; antiemeticStop: string;
  steroidsDose: string; steroidsRoute: string; steroidsStart: string; steroidsStop: string;
  ivDilutionAmount: string;
};

export type InfusionRow = {
  id: string;
  time: string; temp: string; hr: string; rr: string; bp: string;
  rate: string; stop: string; resume: string; notes: string;
};

export type PostInfusionData = {
  voidPostInfusion: boolean; vadDiscontinued: boolean; interventionNA: boolean;
  vadSecured: boolean; capChange: boolean; dressingChange: boolean;
  noPhlebitis: boolean; pain: boolean; redness: boolean; warmth: boolean; edema: boolean; drainage: boolean;
  mdPharmacyNotified: boolean; mdPharmacyNotifiedName: string; mdPharmacyNotifiedDate: string;
};

export type SignaturesData = {
  patientPrintName: string;
  patientSignedAt: string | null;
  rnPrintName: string;
  rnSignedAt: string | null;
};

export type SnInfusionFormData = {
  header: HeaderData;
  bodySystemsAssessment: BodySystemsData;
  tolerationOfInfusion: TolerationsData;
  access: AccessData;
  labs: LabsData;
  medication: MedicationData;
  infusionRecord: InfusionRow[];
  postInfusion: PostInfusionData;
  signatures: SignaturesData;
};

export function createDefaultFormData(patientFullName = "", rnName = ""): SnInfusionFormData {
  return {
    header: {
      mileage: "", billingCode: "99602", timeIn: "", timeOut: "",
      weight: "", weightReported: false, pharmacyChangeReport: false, nextInfusionDate: "",
      medsListReviewed: false, ordersReviewed: false, allergies: "",
      diagnosisText: "", prescriber: "", prescriberPhone: "",
    },
    bodySystemsAssessment: {
      safetyMeasures: {
        standard: false, droplet: false, contact: false, airborn: false,
        fall: false, bleeding: false, handwashing: false, oxygen: false,
        medicationSafety: false, sharpDisposal: false, covid: false,
      },
      socialCognitive: {
        noNegative: false, alert: false, oriented: false, forgetful: false, anxious: false,
        disoriented: false, depressed: false, agitated: false, confused: false,
        legallyBlind: false, hoh: false,
        supportAdequate: false, supportInadequate: false,
        ssAbuseNeglect: false, reported: false, difficultyCoping: false,
      },
      neurological: {
        noNegative: false, haMigraine: false, numbness: false, tingling: false, dizziness: false,
        slurredSpeech: false, blurredVision: false, muscleWeakness: false, seizures: false,
        handGripWeak: false,
        sensoryLossRUE: false, sensoryLossRLE: false, sensoryLossLUE: false, sensoryLossLLE: false,
        pupillaryR: false, pupillaryL: false,
      },
      respiratory: {
        noNegative: false, lungsClear: false, ralesRhonchi: false, diminished: false,
        right: false, left: false, coughProductive: false, coughNonProductive: false,
        sob: false, nebulizer: false, wheezing: false,
        dyspneaModExcretion: false, dyspneaMinExcretion: false, oxygenLpm: "",
      },
      cardiovascular: {
        noNegative: false, pacemaker: false, chestPain: false, weakPeripheralPulse: false,
        irregularPulse: false, hemodialysisShunt: false, hemodialysisType: "", hemodialysisLocation: "",
        jvdRUE: false, jvdLUE: false, jvdRLLE: false, jvdLLE: false,
        edemaTrace: false, edemaPlusOne: false, edemaPlusTwo: false, edemaPlusThree: false, edemaPlusFour: false,
        pitting: false, nonPitting: false,
      },
      musculoskeletal: {
        noNegative: false, unsteadyGait: false, limitedROM: false, stiffness: false,
        contracture: false, paralysis: false,
        weaknessRUE: false, weaknessLUE: false, weaknessRLLE: false, weaknessLLE: false,
        walker: false, wheelchair: false, cane: false,
        poorCoordination: false, handMuscleTremors: false, grossTremors: false, fineTremors: false,
        arthritisSevere: false, arthritisModerate: false, arthritisMild: false, arthritisDeformity: false,
      },
      pain: {
        denies: false, hasYes: false, location: "", intensity: "",
        sharp: false, dull: false, burning: false, radiating: false,
        freqDaily: false, freqLessOften: false, freqConstantly: false, interferesWithSleep: false,
        breakthroughNever: false, breakthroughDaily: false, breakthroughTwoThreeDay: false, breakthroughOther: "",
        painControlAdequate: "",
      },
      endocrine: {
        noNegative: false, hypo: false, hyperglycemic: false, hypothyroidism: false, hyperthyroidism: false,
        dmi: false, idmii: false, nidmii: false, bloodGlucoseRange: "",
        patientMonitorsBS: false, bsUnderControl: "",
      },
      gastrointestinal: {
        noNegative: false, diarrhea: false, constipation: false, nausea: false, vomiting: false, anorexia: false,
        lastBM: "", hypoactive: false, hyperactive: false, normoactive: false,
        colostomy: false, ileostomy: false, incontinent: false,
      },
      nutrition: {
        noNegative: false, appetiteGood: false, appetiteFair: false, appetitePoor: false,
        fluidRestriction: false, dysphasia: false, diet: "",
        ngt: false, gt: false, jt: false, feedingBolusRate: "", feedingPumpRate: "",
      },
      genitourinary: {
        noNegative: false, incontinent: false, burning: false, urgency: false,
        frequency: false, hematuria: false, frequencyDetail: "",
        catheterCondom: false, catheterIFC: false, catheterSuprapubic: false,
        catheterSizeFr: "", ccBalloon: "", urineColor: "",
      },
      integumentary: {
        intact: false, woundLesion: false, tubes: false, shunt: false,
        jaundiced: false, rash: false, ecchymosis: false, dry: false, moist: false,
        skinTurgorGood: false, skinTurgorFair: false, skinTurgorPoor: false,
        surgicalWoundSutures: false, surgicalWoundStaples: false, surgicalWoundOther: "",
        pressureUlcer: false, pressureUlcerStageN: false, unstaged: false, multipleSites: false,
        woundSite1Size: "", woundSite2Size: "",
        newChangedWound: false, mdContactedWound: "", orderContainedWoundCare: "",
      },
      functionalStatus: {
        ambulatory: false, wheelchairBound: false, bedbound: false,
        requiresADLAssist: false, requiresDeviceToAmbulate: false,
        adlIndependent: false, adlMinAssist: false, adlModAssist: false, adlMaxAssist: false,
        caregiverAvailable: "", ssAbuseNeglectReported: false,
      },
      nursingDiagnosis: {
        diseaseProcess: false, poc: false, adverseIVReactions: false, alterationComfort: false,
        potentialInfection: false, impairedMobility: false, ineffectiveCoping: false,
        educationProvided: "",
        medsChangedSinceLastVisit: "", mdContacted: "",
        supervisoryVisit: "", supervisoryHHA: false, supervisoryLVN: false, supervisoryPTA: false,
        supervisoryPresent: "", demonstrateCompetency: "",
        pocChanged: "", pocChanges: "",
      },
    },
    tolerationOfInfusion: {
      statusChangedSinceLastVisit: "", statusChangeDescription: "", fevers: "",
      erVisits: false, pharmacyNotified: false, pharmacyCallDateTime: "", pharmacyCallPerson: "",
      diseasePoorlyControlled: "", poorlyControlledDescription: "",
      returnToFacility: "", returnToFacilityRationale: "",
    },
    access: {
      typePort: false, typePeripheralIV: false, typePICC: false,
      piccArmCirc: "", piccLength: "", piccLumens: "", vadFlush: "",
      nsPreInfusion: false, postLabDraw: false, postInfusion: false,
      postInfusionMl: "", postInfusionPercent: "", heparinPostVAD: "",
      locationL: false, locationR: false, locationH: false, locationW: false,
      locationFA: false, locationAC: false, locationUA: false,
      locationChest: false, locationABD: false, locationThigh: false, locationBack: false,
      dateAccessed: "", dateDeaccessed: "",
      dressingTransparent: false, dressingGauze: false, dressingMedImpregnated: false,
      needleTypeAngiocath: false, needleTypeSubcutaneous: false, needleTypeHuber: false,
      sterileAccess: "",
      needleLength4mm: false, needleLength6mm: false, needleLength9mm: false,
      needleLength12mm: false, needleLength14mm: false,
      needleLengthThreeQuarter: false, needleLengthOneInch: false,
      gauge27: false, gauge25: false, gauge24: false, gauge23: false, gauge22: false, gauge20: false,
      attempts: "", attemptDateTime: "", pharmStaffName: "",
      stablingStatlock: false, stablingCoban: false, stablingGauzeNetting: false,
      stablingSterilePatch: false, stablingOther: false,
      subcutaneousSites: "", subcutaneousEducation: "",
    },
    labs: {
      na: false, cbc: false, bmp: false, cmp: false, bun: false, creat: false,
      igLevels: false, serumViscosity: false, igSubclasses: false, other: "",
      fedexPickup: false, droppedOff: false, collectionDateTime: "",
      drawnAtLab: false, drawnFromIV: false, separatePeripheralStick: false,
    },
    medication: {
      brand: "", todayDose: "", volume: "", frequency: "",
      lot: "", expiration: "", lot2: "", expiration2: "",
      hydration: "", hydrationType: "", hangTime: "", hydrationAmount: "", hydrationTiming: "",
      equipmentPump: false, equipmentGravity: false, equipmentRollerClamp: false, equipmentOther: "",
      pumpName: "", pumpRamp: false, pumpTaper: false, pumpBolus: false, pumpContinuous: false,
      titrationRamps: "", maxRate: "", labelRateFollowed: "",
      pharmacyNotified: false, pharmacyNotifiedName: "",
      anaphylaxisKit: "", anaphylaxisExpiration: "",
      premedNA: false, premedAcetaminophen: false, premedAcetaminophenDose: "",
      premedDiphenhydramine: false, premedDiphenhydramineDose: "",
      premedIbuprofen: false, premedIbuprofenDose: "",
      premedAspirin: false, premedAspirinDose: "",
      lidocaineCream: false, lidocaineTimeApplied: "",
      antiemeticDose: "", antiemeticRoute: "", antiemeticStart: "", antiemeticStop: "",
      steroidsDose: "", steroidsRoute: "", steroidsStart: "", steroidsStop: "",
      ivDilutionAmount: "",
    },
    infusionRecord: [],
    postInfusion: {
      voidPostInfusion: false, vadDiscontinued: false, interventionNA: false,
      vadSecured: false, capChange: false, dressingChange: false,
      noPhlebitis: false, pain: false, redness: false, warmth: false, edema: false, drainage: false,
      mdPharmacyNotified: false, mdPharmacyNotifiedName: "", mdPharmacyNotifiedDate: "",
    },
    signatures: {
      patientPrintName: patientFullName,
      patientSignedAt: null,
      rnPrintName: rnName,
      rnSignedAt: null,
    },
  };
}
