"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BodySystemsData } from "../types";

type Props = { data: BodySystemsData; onChange: (u: Partial<BodySystemsData>) => void };

function CB({ checked, onChange, label, bold }: { checked: boolean; onChange: (v: boolean) => void; label: string; bold?: boolean }) {
  return (
    <label className={`flex items-center gap-1.5 text-sm cursor-pointer ${bold ? "font-semibold" : ""}`}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded border-gray-300 h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </label>
  );
}

function RG({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map(o => (
        <label key={o} className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="radio" checked={value === o} onChange={() => onChange(o)} className="h-3.5 w-3.5" />
          <span>{o}</span>
        </label>
      ))}
    </div>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded p-3 space-y-2">
      <h4 className="font-bold text-xs uppercase tracking-wide text-gray-700">{title}</h4>
      {children}
    </div>
  );
}

export function BodySystemsSection({ data, onChange }: Props) {
  const bs = data;
  const upd = <K extends keyof BodySystemsData>(key: K) =>
    (patch: Partial<BodySystemsData[K]>) =>
      onChange({ [key]: { ...bs[key], ...patch } } as Partial<BodySystemsData>);

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-sm uppercase tracking-wide border-b pb-1">All Body Systems Assessment</h3>

      {/* Safety Measures */}
      <Sub title="Safety Measures / Infection Control">
        <div>
          <span className="text-xs font-semibold text-gray-600">Precautions:</span>
          <div className="flex flex-wrap gap-3 mt-1">
            {(["standard","droplet","contact","airborn","fall","bleeding","handwashing","oxygen"] as const).map(k => (
              <CB key={k} checked={bs.safetyMeasures[k]} onChange={v => upd("safetyMeasures")({ [k]: v })} label={k.charAt(0).toUpperCase()+k.slice(1)} />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <CB checked={bs.safetyMeasures.medicationSafety} onChange={v => upd("safetyMeasures")({ medicationSafety: v })} label="Medication Safety" />
          <CB checked={bs.safetyMeasures.sharpDisposal} onChange={v => upd("safetyMeasures")({ sharpDisposal: v })} label="Proper Medical Waste/Sharp Disposal" />
          <CB checked={bs.safetyMeasures.covid} onChange={v => upd("safetyMeasures")({ covid: v })} label="COVID-19 screening" />
        </div>
      </Sub>

      {/* Social/Cognitive */}
      <Sub title="Social / Emotional / Cognitive">
        <CB checked={bs.socialCognitive.noNegative} onChange={v => upd("socialCognitive")({ noNegative: v })} label="No Negative finding" bold />
        <div className="flex flex-wrap gap-3">
          {(["alert","oriented","forgetful","anxious","disoriented","depressed","agitated","confused","legallyBlind","hoh"] as const).map(k => (
            <CB key={k} checked={bs.socialCognitive[k]} onChange={v => upd("socialCognitive")({ [k]: v })} label={k==="legallyBlind"?"Legally Blind":k==="hoh"?"HOH":k.charAt(0).toUpperCase()+k.slice(1)} />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-semibold text-gray-600">Support system:</span>
          <CB checked={bs.socialCognitive.supportAdequate} onChange={v => upd("socialCognitive")({ supportAdequate: v })} label="Adequate" />
          <CB checked={bs.socialCognitive.supportInadequate} onChange={v => upd("socialCognitive")({ supportInadequate: v })} label="Inadequate" />
          <CB checked={bs.socialCognitive.ssAbuseNeglect} onChange={v => upd("socialCognitive")({ ssAbuseNeglect: v })} label="S/S Abuse/Neglect" />
          <CB checked={bs.socialCognitive.reported} onChange={v => upd("socialCognitive")({ reported: v })} label="Reported" />
          <CB checked={bs.socialCognitive.difficultyCoping} onChange={v => upd("socialCognitive")({ difficultyCoping: v })} label="Difficulty coping" />
        </div>
      </Sub>

      {/* Neurological */}
      <Sub title="Neurological">
        <CB checked={bs.neurological.noNegative} onChange={v => upd("neurological")({ noNegative: v })} label="No Negative finding" bold />
        <div className="flex flex-wrap gap-3">
          {(["haMigraine","numbness","tingling","dizziness","slurredSpeech","blurredVision","muscleWeakness","seizures"] as const).map(k => (
            <CB key={k} checked={bs.neurological[k]} onChange={v => upd("neurological")({ [k]: v })}
              label={k==="haMigraine"?"H/A Migraine":k==="slurredSpeech"?"Slurred speech":k==="blurredVision"?"Blurred/Double/Impaired Vision":k==="muscleWeakness"?"Muscle weakness":k.charAt(0).toUpperCase()+k.slice(1)} />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <CB checked={bs.neurological.handGripWeak} onChange={v => upd("neurological")({ handGripWeak: v })} label="Hand Grip Weak" />
          <span className="text-xs font-semibold text-gray-600">Sensory Loss:</span>
          {(["sensoryLossRUE","sensoryLossRLE","sensoryLossLUE","sensoryLossLLE"] as const).map(k => (
            <CB key={k} checked={bs.neurological[k]} onChange={v => upd("neurological")({ [k]: v })} label={k.replace("sensoryLoss","")} />
          ))}
          <span className="text-xs font-semibold text-gray-600">Pupillary Reaction:</span>
          <CB checked={bs.neurological.pupillaryR} onChange={v => upd("neurological")({ pupillaryR: v })} label="R" />
          <CB checked={bs.neurological.pupillaryL} onChange={v => upd("neurological")({ pupillaryL: v })} label="L" />
        </div>
      </Sub>

      {/* Respiratory */}
      <Sub title="Respiratory">
        <CB checked={bs.respiratory.noNegative} onChange={v => upd("respiratory")({ noNegative: v })} label="No Negative finding" bold />
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-semibold text-gray-600">Lung sounds:</span>
          <CB checked={bs.respiratory.lungsClear} onChange={v => upd("respiratory")({ lungsClear: v })} label="Clear" />
          <CB checked={bs.respiratory.ralesRhonchi} onChange={v => upd("respiratory")({ ralesRhonchi: v })} label="Rales/Rhonchi" />
          <CB checked={bs.respiratory.diminished} onChange={v => upd("respiratory")({ diminished: v })} label="Diminished" />
          <CB checked={bs.respiratory.right} onChange={v => upd("respiratory")({ right: v })} label="R" />
          <CB checked={bs.respiratory.left} onChange={v => upd("respiratory")({ left: v })} label="L" />
        </div>
        <div className="flex flex-wrap gap-3">
          <span className="text-xs font-semibold text-gray-600 self-center">Cough:</span>
          <CB checked={bs.respiratory.coughProductive} onChange={v => upd("respiratory")({ coughProductive: v })} label="Productive" />
          <CB checked={bs.respiratory.coughNonProductive} onChange={v => upd("respiratory")({ coughNonProductive: v })} label="Non-Productive" />
          <CB checked={bs.respiratory.sob} onChange={v => upd("respiratory")({ sob: v })} label="SOB" />
          <CB checked={bs.respiratory.nebulizer} onChange={v => upd("respiratory")({ nebulizer: v })} label="Nebulizer" />
          <CB checked={bs.respiratory.wheezing} onChange={v => upd("respiratory")({ wheezing: v })} label="Wheezing" />
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-semibold text-gray-600">Dyspnea:</span>
          <CB checked={bs.respiratory.dyspneaModExcretion} onChange={v => upd("respiratory")({ dyspneaModExcretion: v })} label="Mod excretion" />
          <CB checked={bs.respiratory.dyspneaMinExcretion} onChange={v => upd("respiratory")({ dyspneaMinExcretion: v })} label="Min excretion" />
          <div className="flex items-center gap-1"><span className="text-sm">Oxygen use:</span><Input className="w-16 h-7 text-sm" value={bs.respiratory.oxygenLpm} onChange={e => upd("respiratory")({ oxygenLpm: e.target.value })} placeholder="L/min" /></div>
        </div>
      </Sub>

      {/* Cardiovascular */}
      <Sub title="Cardiovascular">
        <CB checked={bs.cardiovascular.noNegative} onChange={v => upd("cardiovascular")({ noNegative: v })} label="No Negative finding" bold />
        <div className="flex flex-wrap gap-3">
          <CB checked={bs.cardiovascular.pacemaker} onChange={v => upd("cardiovascular")({ pacemaker: v })} label="Pacemaker" />
          <CB checked={bs.cardiovascular.chestPain} onChange={v => upd("cardiovascular")({ chestPain: v })} label="Chest Pain" />
          <CB checked={bs.cardiovascular.weakPeripheralPulse} onChange={v => upd("cardiovascular")({ weakPeripheralPulse: v })} label="Weak Peripheral Pulse" />
          <CB checked={bs.cardiovascular.irregularPulse} onChange={v => upd("cardiovascular")({ irregularPulse: v })} label="Irregular Pulse/Palpitations" />
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <CB checked={bs.cardiovascular.hemodialysisShunt} onChange={v => upd("cardiovascular")({ hemodialysisShunt: v })} label="Hemodialysis Shunt:" />
          {bs.cardiovascular.hemodialysisShunt && (
            <>
              <div className="flex items-center gap-1"><span className="text-sm">Type:</span><Input className="w-24 h-7" value={bs.cardiovascular.hemodialysisType} onChange={e => upd("cardiovascular")({ hemodialysisType: e.target.value })} /></div>
              <div className="flex items-center gap-1"><span className="text-sm">Location:</span><Input className="w-32 h-7" value={bs.cardiovascular.hemodialysisLocation} onChange={e => upd("cardiovascular")({ hemodialysisLocation: e.target.value })} /></div>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-semibold text-gray-600">JVD/Edema of:</span>
          {(["jvdRUE","jvdLUE","jvdRLLE","jvdLLE"] as const).map(k => (
            <CB key={k} checked={bs.cardiovascular[k]} onChange={v => upd("cardiovascular")({ [k]: v })} label={k.replace("jvd","")} />
          ))}
          <span className="text-xs font-semibold text-gray-600">Trace:</span>
          {(["edemaTrace","edemaPlusOne","edemaPlusTwo","edemaPlusThree","edemaPlusFour"] as const).map((k,i) => (
            <CB key={k} checked={bs.cardiovascular[k]} onChange={v => upd("cardiovascular")({ [k]: v })} label={["Trace","+1","+2","+3","+4"][i]} />
          ))}
          <CB checked={bs.cardiovascular.pitting} onChange={v => upd("cardiovascular")({ pitting: v })} label="Pitting" />
          <CB checked={bs.cardiovascular.nonPitting} onChange={v => upd("cardiovascular")({ nonPitting: v })} label="Non-pitting" />
        </div>
      </Sub>

      {/* Musculoskeletal */}
      <Sub title="Musculoskeletal">
        <CB checked={bs.musculoskeletal.noNegative} onChange={v => upd("musculoskeletal")({ noNegative: v })} label="No Negative finding" bold />
        <div className="flex flex-wrap gap-3">
          <CB checked={bs.musculoskeletal.unsteadyGait} onChange={v => upd("musculoskeletal")({ unsteadyGait: v })} label="Unsteady gait" />
          <CB checked={bs.musculoskeletal.limitedROM} onChange={v => upd("musculoskeletal")({ limitedROM: v })} label="Limited ROM" />
          <CB checked={bs.musculoskeletal.stiffness} onChange={v => upd("musculoskeletal")({ stiffness: v })} label="Stiffness" />
          <CB checked={bs.musculoskeletal.contracture} onChange={v => upd("musculoskeletal")({ contracture: v })} label="Contracture" />
          <CB checked={bs.musculoskeletal.paralysis} onChange={v => upd("musculoskeletal")({ paralysis: v })} label="Paralysis" />
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-semibold text-gray-600">Weakness:</span>
          {(["weaknessRUE","weaknessLUE","weaknessRLLE","weaknessLLE"] as const).map(k => (
            <CB key={k} checked={bs.musculoskeletal[k]} onChange={v => upd("musculoskeletal")({ [k]: v })} label={k.replace("weakness","")} />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-semibold text-gray-600">Assistive Device:</span>
          <CB checked={bs.musculoskeletal.walker} onChange={v => upd("musculoskeletal")({ walker: v })} label="Walker" />
          <CB checked={bs.musculoskeletal.wheelchair} onChange={v => upd("musculoskeletal")({ wheelchair: v })} label="Wheelchair" />
          <CB checked={bs.musculoskeletal.cane} onChange={v => upd("musculoskeletal")({ cane: v })} label="Cane" />
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-semibold text-gray-600">Hands:</span>
          <CB checked={bs.musculoskeletal.poorCoordination} onChange={v => upd("musculoskeletal")({ poorCoordination: v })} label="Poor coordination" />
          <CB checked={bs.musculoskeletal.handMuscleTremors} onChange={v => upd("musculoskeletal")({ handMuscleTremors: v })} label="Hand/Muscle Tremors" />
          <CB checked={bs.musculoskeletal.grossTremors} onChange={v => upd("musculoskeletal")({ grossTremors: v })} label="Gross Tremors" />
          <CB checked={bs.musculoskeletal.fineTremors} onChange={v => upd("musculoskeletal")({ fineTremors: v })} label="Fine Tremors" />
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-semibold text-gray-600">Arthritis:</span>
          <CB checked={bs.musculoskeletal.arthritisSevere} onChange={v => upd("musculoskeletal")({ arthritisSevere: v })} label="Severe" />
          <CB checked={bs.musculoskeletal.arthritisModerate} onChange={v => upd("musculoskeletal")({ arthritisModerate: v })} label="Moderate" />
          <CB checked={bs.musculoskeletal.arthritisMild} onChange={v => upd("musculoskeletal")({ arthritisMild: v })} label="Mild" />
          <CB checked={bs.musculoskeletal.arthritisDeformity} onChange={v => upd("musculoskeletal")({ arthritisDeformity: v })} label="Arthritis Deformity" />
        </div>
      </Sub>

      {/* Pain */}
      <Sub title="Pain">
        <div className="flex flex-wrap gap-3 items-center">
          <CB checked={bs.pain.denies} onChange={v => upd("pain")({ denies: v })} label="Denies" bold />
          <CB checked={bs.pain.hasYes} onChange={v => upd("pain")({ hasYes: v })} label="Yes" />
          <div className="flex items-center gap-1"><span className="text-sm">Location:</span><Input className="w-32 h-7" value={bs.pain.location} onChange={e => upd("pain")({ location: e.target.value })} /></div>
        </div>
        {bs.pain.hasYes && (
          <>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Intensity (1-10)</Label>
              <div className="flex gap-2">
                {["1","2","3","4","5","6","7","8","9","10"].map(n => (
                  <label key={n} className="flex items-center gap-0.5 text-sm cursor-pointer">
                    <input type="radio" checked={bs.pain.intensity === n} onChange={() => upd("pain")({ intensity: n })} className="h-3.5 w-3.5" />
                    {n}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <CB checked={bs.pain.sharp} onChange={v => upd("pain")({ sharp: v })} label="Sharp" />
              <CB checked={bs.pain.dull} onChange={v => upd("pain")({ dull: v })} label="Dull" />
              <CB checked={bs.pain.burning} onChange={v => upd("pain")({ burning: v })} label="Burning" />
              <CB checked={bs.pain.radiating} onChange={v => upd("pain")({ radiating: v })} label="Radiating" />
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-xs font-semibold text-gray-600">Frequency:</span>
              <CB checked={bs.pain.freqDaily} onChange={v => upd("pain")({ freqDaily: v })} label="Daily" />
              <CB checked={bs.pain.freqLessOften} onChange={v => upd("pain")({ freqLessOften: v })} label="Less often the Daily" />
              <CB checked={bs.pain.freqConstantly} onChange={v => upd("pain")({ freqConstantly: v })} label="Constantly" />
              <CB checked={bs.pain.interferesWithSleep} onChange={v => upd("pain")({ interferesWithSleep: v })} label="Interferes with Sleep/Appetite/Movement" />
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-xs font-semibold text-gray-600">Breakthrough Medications use:</span>
              <CB checked={bs.pain.breakthroughNever} onChange={v => upd("pain")({ breakthroughNever: v })} label="Never" />
              <CB checked={bs.pain.breakthroughDaily} onChange={v => upd("pain")({ breakthroughDaily: v })} label="Daily" />
              <CB checked={bs.pain.breakthroughTwoThreeDay} onChange={v => upd("pain")({ breakthroughTwoThreeDay: v })} label="2-3 times/day" />
              <div className="flex items-center gap-1"><span className="text-sm">Other:</span><Input className="w-32 h-7" value={bs.pain.breakthroughOther} onChange={e => upd("pain")({ breakthroughOther: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Current pain control adequate?</span>
              <RG value={bs.pain.painControlAdequate} onChange={v => upd("pain")({ painControlAdequate: v })} options={["Yes", "No"]} />
            </div>
          </>
        )}
      </Sub>

      {/* Endocrine */}
      <Sub title="Endocrine / Metabolic">
        <CB checked={bs.endocrine.noNegative} onChange={v => upd("endocrine")({ noNegative: v })} label="No Negative finding" bold />
        <div className="flex flex-wrap gap-3">
          <CB checked={bs.endocrine.hypo} onChange={v => upd("endocrine")({ hypo: v })} label="Hypo" />
          <CB checked={bs.endocrine.hyperglycemic} onChange={v => upd("endocrine")({ hyperglycemic: v })} label="Hyperglycemic Reaction" />
          <CB checked={bs.endocrine.hypothyroidism} onChange={v => upd("endocrine")({ hypothyroidism: v })} label="Hypothyroidism" />
          <CB checked={bs.endocrine.hyperthyroidism} onChange={v => upd("endocrine")({ hyperthyroidism: v })} label="Hyperthyroidism" />
          <CB checked={bs.endocrine.dmi} onChange={v => upd("endocrine")({ dmi: v })} label="DMI" />
          <CB checked={bs.endocrine.idmii} onChange={v => upd("endocrine")({ idmii: v })} label="IDMII" />
          <CB checked={bs.endocrine.nidmii} onChange={v => upd("endocrine")({ nidmii: v })} label="NIDMII" />
          <div className="flex items-center gap-1"><span className="text-sm">Blood glucose range:</span><Input className="w-24 h-7" value={bs.endocrine.bloodGlucoseRange} onChange={e => upd("endocrine")({ bloodGlucoseRange: e.target.value })} /></div>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <CB checked={bs.endocrine.patientMonitorsBS} onChange={v => upd("endocrine")({ patientMonitorsBS: v })} label="Patient/caregiver monitor BS" />
          <span className="text-sm">BS is under control with recent dosage of meds/insulin?</span>
          <RG value={bs.endocrine.bsUnderControl} onChange={v => upd("endocrine")({ bsUnderControl: v })} options={["Yes", "No"]} />
        </div>
      </Sub>

      {/* GI */}
      <Sub title="Gastrointestinal">
        <CB checked={bs.gastrointestinal.noNegative} onChange={v => upd("gastrointestinal")({ noNegative: v })} label="No Negative finding" bold />
        <div className="flex flex-wrap gap-3">
          {(["diarrhea","constipation","nausea","vomiting","anorexia"] as const).map(k => (
            <CB key={k} checked={bs.gastrointestinal[k]} onChange={v => upd("gastrointestinal")({ [k]: v })} label={k.charAt(0).toUpperCase()+k.slice(1)} />
          ))}
          <div className="flex items-center gap-1"><span className="text-sm">Last BM:</span><Input className="w-24 h-7" value={bs.gastrointestinal.lastBM} onChange={e => upd("gastrointestinal")({ lastBM: e.target.value })} placeholder="today / date" /></div>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-semibold text-gray-600">BS present:</span>
          <CB checked={bs.gastrointestinal.hypoactive} onChange={v => upd("gastrointestinal")({ hypoactive: v })} label="Hypoactive" />
          <CB checked={bs.gastrointestinal.hyperactive} onChange={v => upd("gastrointestinal")({ hyperactive: v })} label="Hyperactive" />
          <CB checked={bs.gastrointestinal.normoactive} onChange={v => upd("gastrointestinal")({ normoactive: v })} label="Normoactive" />
          <CB checked={bs.gastrointestinal.colostomy} onChange={v => upd("gastrointestinal")({ colostomy: v })} label="Colostomy" />
          <CB checked={bs.gastrointestinal.ileostomy} onChange={v => upd("gastrointestinal")({ ileostomy: v })} label="Ileostomy" />
          <CB checked={bs.gastrointestinal.incontinent} onChange={v => upd("gastrointestinal")({ incontinent: v })} label="Incontinent" />
        </div>
      </Sub>

      {/* Nutrition */}
      <Sub title="Nutrition / Hydration">
        <CB checked={bs.nutrition.noNegative} onChange={v => upd("nutrition")({ noNegative: v })} label="No Negative finding" bold />
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-semibold text-gray-600">Appetite:</span>
          <CB checked={bs.nutrition.appetiteGood} onChange={v => upd("nutrition")({ appetiteGood: v })} label="Good" />
          <CB checked={bs.nutrition.appetiteFair} onChange={v => upd("nutrition")({ appetiteFair: v })} label="Fair" />
          <CB checked={bs.nutrition.appetitePoor} onChange={v => upd("nutrition")({ appetitePoor: v })} label="Poor" />
          <CB checked={bs.nutrition.fluidRestriction} onChange={v => upd("nutrition")({ fluidRestriction: v })} label="Fluid restriction" />
          <CB checked={bs.nutrition.dysphasia} onChange={v => upd("nutrition")({ dysphasia: v })} label="Dysphasia" />
          <div className="flex items-center gap-1"><span className="text-sm">Diet:</span><Input className="w-28 h-7" value={bs.nutrition.diet} onChange={e => upd("nutrition")({ diet: e.target.value })} placeholder="regular" /></div>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <CB checked={bs.nutrition.ngt} onChange={v => upd("nutrition")({ ngt: v })} label="NGT" />
          <CB checked={bs.nutrition.gt} onChange={v => upd("nutrition")({ gt: v })} label="GT" />
          <CB checked={bs.nutrition.jt} onChange={v => upd("nutrition")({ jt: v })} label="JT" />
          <div className="flex items-center gap-1"><span className="text-sm">Feeding Bolus Rate/Amount:</span><Input className="w-32 h-7" value={bs.nutrition.feedingBolusRate} onChange={e => upd("nutrition")({ feedingBolusRate: e.target.value })} /></div>
          <div className="flex items-center gap-1"><span className="text-sm">Pump Rate/Amount:</span><Input className="w-32 h-7" value={bs.nutrition.feedingPumpRate} onChange={e => upd("nutrition")({ feedingPumpRate: e.target.value })} /></div>
        </div>
      </Sub>

      {/* GU */}
      <Sub title="Genitourinary">
        <CB checked={bs.genitourinary.noNegative} onChange={v => upd("genitourinary")({ noNegative: v })} label="No Negative finding" bold />
        <div className="flex flex-wrap gap-3">
          <CB checked={bs.genitourinary.incontinent} onChange={v => upd("genitourinary")({ incontinent: v })} label="Incontinent" />
          <CB checked={bs.genitourinary.burning} onChange={v => upd("genitourinary")({ burning: v })} label="Burning" />
          <CB checked={bs.genitourinary.urgency} onChange={v => upd("genitourinary")({ urgency: v })} label="Urgency" />
          <CB checked={bs.genitourinary.frequency} onChange={v => upd("genitourinary")({ frequency: v })} label="Frequency" />
          <CB checked={bs.genitourinary.hematuria} onChange={v => upd("genitourinary")({ hematuria: v })} label="Hematuria" />
          <div className="flex items-center gap-1"><span className="text-sm">Frequency:</span><Input className="w-32 h-7" value={bs.genitourinary.frequencyDetail} onChange={e => upd("genitourinary")({ frequencyDetail: e.target.value })} /></div>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-semibold text-gray-600">Catheter:</span>
          <CB checked={bs.genitourinary.catheterCondom} onChange={v => upd("genitourinary")({ catheterCondom: v })} label="Condom" />
          <CB checked={bs.genitourinary.catheterIFC} onChange={v => upd("genitourinary")({ catheterIFC: v })} label="IFC" />
          <CB checked={bs.genitourinary.catheterSuprapubic} onChange={v => upd("genitourinary")({ catheterSuprapubic: v })} label="Suprapubic" />
          <div className="flex items-center gap-1"><span className="text-sm">Size: Fr</span><Input className="w-12 h-7" value={bs.genitourinary.catheterSizeFr} onChange={e => upd("genitourinary")({ catheterSizeFr: e.target.value })} /></div>
          <div className="flex items-center gap-1"><span className="text-sm">cc balloon</span><Input className="w-12 h-7" value={bs.genitourinary.ccBalloon} onChange={e => upd("genitourinary")({ ccBalloon: e.target.value })} /></div>
          <div className="flex items-center gap-1"><span className="text-sm">Urine Color:</span><Input className="w-32 h-7" value={bs.genitourinary.urineColor} onChange={e => upd("genitourinary")({ urineColor: e.target.value })} /></div>
        </div>
      </Sub>

      {/* Integumentary */}
      <Sub title="Integumentary">
        <div className="flex flex-wrap gap-3">
          {(["intact","woundLesion","tubes","shunt","jaundiced","rash","ecchymosis","dry","moist"] as const).map(k => (
            <CB key={k} checked={bs.integumentary[k]} onChange={v => upd("integumentary")({ [k]: v })}
              label={k==="woundLesion"?"Wound/Lesion":k.charAt(0).toUpperCase()+k.slice(1)} />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-semibold text-gray-600">Skin turgor:</span>
          <CB checked={bs.integumentary.skinTurgorGood} onChange={v => upd("integumentary")({ skinTurgorGood: v })} label="Good" />
          <CB checked={bs.integumentary.skinTurgorFair} onChange={v => upd("integumentary")({ skinTurgorFair: v })} label="Fair" />
          <CB checked={bs.integumentary.skinTurgorPoor} onChange={v => upd("integumentary")({ skinTurgorPoor: v })} label="Poor" />
          <span className="text-xs font-semibold text-gray-600">Surgical Wound:</span>
          <CB checked={bs.integumentary.surgicalWoundSutures} onChange={v => upd("integumentary")({ surgicalWoundSutures: v })} label="Sutures" />
          <CB checked={bs.integumentary.surgicalWoundStaples} onChange={v => upd("integumentary")({ surgicalWoundStaples: v })} label="Staples" />
          <div className="flex items-center gap-1"><span className="text-sm">Other:</span><Input className="w-32 h-7" value={bs.integumentary.surgicalWoundOther} onChange={e => upd("integumentary")({ surgicalWoundOther: e.target.value })} /></div>
        </div>
        <div className="flex flex-wrap gap-3">
          <CB checked={bs.integumentary.pressureUlcer} onChange={v => upd("integumentary")({ pressureUlcer: v })} label="Pressure ulcer" />
          {bs.integumentary.pressureUlcer && (
            <>
              <CB checked={bs.integumentary.pressureUlcerStageN} onChange={v => upd("integumentary")({ pressureUlcerStageN: v })} label="Stage N" />
              <CB checked={bs.integumentary.unstaged} onChange={v => upd("integumentary")({ unstaged: v })} label="Unstaged" />
              <CB checked={bs.integumentary.multipleSites} onChange={v => upd("integumentary")({ multipleSites: v })} label="Multiple Sites" />
              <div className="flex items-center gap-1"><span className="text-sm">Site 1 Size:</span><Input className="w-24 h-7" value={bs.integumentary.woundSite1Size} onChange={e => upd("integumentary")({ woundSite1Size: e.target.value })} /></div>
              <div className="flex items-center gap-1"><span className="text-sm">Site 2 Size:</span><Input className="w-24 h-7" value={bs.integumentary.woundSite2Size} onChange={e => upd("integumentary")({ woundSite2Size: e.target.value })} /></div>
            </>
          )}
          <CB checked={bs.integumentary.newChangedWound} onChange={v => upd("integumentary")({ newChangedWound: v })} label="New/changed wound" />
          <div className="flex items-center gap-2"><span className="text-sm">MD Contacted?</span><RG value={bs.integumentary.mdContactedWound} onChange={v => upd("integumentary")({ mdContactedWound: v })} options={["Yes","No"]} /></div>
          <div className="flex items-center gap-2"><span className="text-sm">Order contained for wound care?</span><RG value={bs.integumentary.orderContainedWoundCare} onChange={v => upd("integumentary")({ orderContainedWoundCare: v })} options={["Yes","No"]} /></div>
        </div>
      </Sub>

      {/* Functional Status */}
      <Sub title="Functional Status">
        <div className="flex flex-wrap gap-3">
          <CB checked={bs.functionalStatus.ambulatory} onChange={v => upd("functionalStatus")({ ambulatory: v })} label="Ambulatory" />
          <CB checked={bs.functionalStatus.wheelchairBound} onChange={v => upd("functionalStatus")({ wheelchairBound: v })} label="Wheelchair bound" />
          <CB checked={bs.functionalStatus.bedbound} onChange={v => upd("functionalStatus")({ bedbound: v })} label="Bedbound" />
          <CB checked={bs.functionalStatus.requiresADLAssist} onChange={v => upd("functionalStatus")({ requiresADLAssist: v })} label="Requires assistance with ADL" />
          <CB checked={bs.functionalStatus.requiresDeviceToAmbulate} onChange={v => upd("functionalStatus")({ requiresDeviceToAmbulate: v })} label="Requires assistance/device to Ambulate" />
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-semibold text-gray-600">ADLs:</span>
          <CB checked={bs.functionalStatus.adlIndependent} onChange={v => upd("functionalStatus")({ adlIndependent: v })} label="Independent" />
          <CB checked={bs.functionalStatus.adlMinAssist} onChange={v => upd("functionalStatus")({ adlMinAssist: v })} label="Min assist" />
          <CB checked={bs.functionalStatus.adlModAssist} onChange={v => upd("functionalStatus")({ adlModAssist: v })} label="Mod assist" />
          <CB checked={bs.functionalStatus.adlMaxAssist} onChange={v => upd("functionalStatus")({ adlMaxAssist: v })} label="Max assist" />
          <div className="flex items-center gap-2"><span className="text-sm">Caregiver available?</span><RG value={bs.functionalStatus.caregiverAvailable} onChange={v => upd("functionalStatus")({ caregiverAvailable: v })} options={["Yes","No"]} /></div>
          <CB checked={bs.functionalStatus.ssAbuseNeglectReported} onChange={v => upd("functionalStatus")({ ssAbuseNeglectReported: v })} label="S/S of abuse/neglect Reported" />
        </div>
      </Sub>

      {/* Nursing Diagnosis */}
      <Sub title="Nursing Diagnosis">
        <div>
          <span className="text-xs font-semibold text-gray-600">Knowledge Deficit:</span>
          <div className="flex flex-wrap gap-3 mt-1">
            <CB checked={bs.nursingDiagnosis.diseaseProcess} onChange={v => upd("nursingDiagnosis")({ diseaseProcess: v })} label="Disease Process" />
            <CB checked={bs.nursingDiagnosis.poc} onChange={v => upd("nursingDiagnosis")({ poc: v })} label="POC" />
            <CB checked={bs.nursingDiagnosis.adverseIVReactions} onChange={v => upd("nursingDiagnosis")({ adverseIVReactions: v })} label="Potential for adverse reactions to IV meds" />
            <CB checked={bs.nursingDiagnosis.alterationComfort} onChange={v => upd("nursingDiagnosis")({ alterationComfort: v })} label="Alteration in Comfort" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <CB checked={bs.nursingDiagnosis.potentialInfection} onChange={v => upd("nursingDiagnosis")({ potentialInfection: v })} label="Potential for infection" />
          <CB checked={bs.nursingDiagnosis.impairedMobility} onChange={v => upd("nursingDiagnosis")({ impairedMobility: v })} label="Impaired mobility" />
          <CB checked={bs.nursingDiagnosis.ineffectiveCoping} onChange={v => upd("nursingDiagnosis")({ ineffectiveCoping: v })} label="Ineffective coping" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-gray-600">Education provided</Label>
          <Input value={bs.nursingDiagnosis.educationProvided} onChange={e => upd("nursingDiagnosis")({ educationProvided: e.target.value })} placeholder="e.g. discussed infection control, MD appointments" />
        </div>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2"><span className="text-sm">Medications changed since last visit?</span><RG value={bs.nursingDiagnosis.medsChangedSinceLastVisit} onChange={v => upd("nursingDiagnosis")({ medsChangedSinceLastVisit: v })} options={["Yes","No"]} /></div>
          <div className="flex items-center gap-2"><span className="text-sm">MD Contacted?</span><RG value={bs.nursingDiagnosis.mdContacted} onChange={v => upd("nursingDiagnosis")({ mdContacted: v })} options={["Yes","No"]} /></div>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2"><span className="text-sm font-semibold">Supervisory visit?</span><RG value={bs.nursingDiagnosis.supervisoryVisit} onChange={v => upd("nursingDiagnosis")({ supervisoryVisit: v })} options={["Yes","No"]} /></div>
          {bs.nursingDiagnosis.supervisoryVisit === "Yes" && (
            <>
              <CB checked={bs.nursingDiagnosis.supervisoryHHA} onChange={v => upd("nursingDiagnosis")({ supervisoryHHA: v })} label="HHA" />
              <CB checked={bs.nursingDiagnosis.supervisoryLVN} onChange={v => upd("nursingDiagnosis")({ supervisoryLVN: v })} label="LVN" />
              <CB checked={bs.nursingDiagnosis.supervisoryPTA} onChange={v => upd("nursingDiagnosis")({ supervisoryPTA: v })} label="PTA" />
              <div className="flex items-center gap-2"><span className="text-sm">Present?</span><RG value={bs.nursingDiagnosis.supervisoryPresent} onChange={v => upd("nursingDiagnosis")({ supervisoryPresent: v })} options={["Yes","No"]} /></div>
              <div className="flex items-center gap-2"><span className="text-sm">Demonstrate competency?</span><RG value={bs.nursingDiagnosis.demonstrateCompetency} onChange={v => upd("nursingDiagnosis")({ demonstrateCompetency: v })} options={["Yes","No"]} /></div>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2"><span className="text-sm font-semibold">POC Changed?</span><RG value={bs.nursingDiagnosis.pocChanged} onChange={v => upd("nursingDiagnosis")({ pocChanged: v })} options={["Yes","No"]} /></div>
          {bs.nursingDiagnosis.pocChanged === "Yes" && (
            <div className="flex items-center gap-1 flex-1">
              <span className="text-sm">Changes made to POC:</span>
              <Input value={bs.nursingDiagnosis.pocChanges} onChange={e => upd("nursingDiagnosis")({ pocChanges: e.target.value })} className="flex-1" />
            </div>
          )}
        </div>
      </Sub>
    </div>
  );
}
