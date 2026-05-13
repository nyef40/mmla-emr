"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  OasisVitalSigns, OasisNeuroCognitive, OasisRespiratory,
  OasisCardiovascular, OasisUrinary, OasisGastrointestinal,
  OasisNutritional, OasisInfusion,
} from "../types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold uppercase tracking-wide text-gray-600">{label}</Label>
      {children}
    </div>
  );
}

function CB({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded border-gray-300 h-3.5 w-3.5" />
      <span>{label}</span>
    </label>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded p-3 space-y-3">
      <h4 className="font-bold text-xs uppercase tracking-wide text-gray-700">{title}</h4>
      {children}
    </div>
  );
}

function TextArea({ value, onChange, rows = 2 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a] resize-none"
    />
  );
}

type Props = {
  vitalSigns: OasisVitalSigns;
  neuroCognitive: OasisNeuroCognitive;
  respiratory: OasisRespiratory;
  cardiovascular: OasisCardiovascular;
  urinary: OasisUrinary;
  gastrointestinal: OasisGastrointestinal;
  nutritional: OasisNutritional;
  infusion: OasisInfusion;
  onVitalSignsChange: (u: Partial<OasisVitalSigns>) => void;
  onNeuroChange: (u: Partial<OasisNeuroCognitive>) => void;
  onRespiratoryChange: (u: Partial<OasisRespiratory>) => void;
  onCardiovascularChange: (u: Partial<OasisCardiovascular>) => void;
  onUrinaryChange: (u: Partial<OasisUrinary>) => void;
  onGIChange: (u: Partial<OasisGastrointestinal>) => void;
  onNutritionalChange: (u: Partial<OasisNutritional>) => void;
  onInfusionChange: (u: Partial<OasisInfusion>) => void;
};

export function BodySystemsSection({
  vitalSigns, neuroCognitive, respiratory, cardiovascular,
  urinary, gastrointestinal, nutritional, infusion,
  onVitalSignsChange, onNeuroChange, onRespiratoryChange,
  onCardiovascularChange, onUrinaryChange, onGIChange,
  onNutritionalChange, onInfusionChange,
}: Props) {
  const vs = vitalSigns;
  const nc = neuroCognitive;
  const r  = respiratory;
  const cv = cardiovascular;
  const u  = urinary;
  const gi = gastrointestinal;
  const n  = nutritional;
  const iv = infusion;

  return (
    <div className="space-y-4">
      {/* Vital Signs */}
      <Sub title="Vital Signs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Temperature">
            <Input value={vs.temp} onChange={e => onVitalSignsChange({ temp: e.target.value })} placeholder="98.6" />
          </Field>
          <Field label="Temp Method">
            <select
              value={vs.tempMethod}
              onChange={e => onVitalSignsChange({ tempMethod: e.target.value })}
              className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]"
            >
              <option>Non-Contact Temporal</option>
              <option>Oral</option>
              <option>Axillary</option>
              <option>Rectal</option>
              <option>Tympanic</option>
            </select>
          </Field>
          <Field label="Heart Rate">
            <Input value={vs.heartRate} onChange={e => onVitalSignsChange({ heartRate: e.target.value })} placeholder="72" />
          </Field>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Heart Rhythm</p>
            <div className="flex gap-3 mt-1">
              {(["regular", "irregular"] as const).map(s => (
                <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" checked={vs.heartRhythm === s} onChange={() => onVitalSignsChange({ heartRhythm: s })} className="h-3.5 w-3.5" />
                  <span className="capitalize">{s}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <Field label="BP Systolic">
            <Input value={vs.bpSystolic} onChange={e => onVitalSignsChange({ bpSystolic: e.target.value })} placeholder="120" />
          </Field>
          <Field label="BP Diastolic">
            <Input value={vs.bpDiastolic} onChange={e => onVitalSignsChange({ bpDiastolic: e.target.value })} placeholder="80" />
          </Field>
          <Field label="Position">
            <select
              value={vs.bpPosition}
              onChange={e => onVitalSignsChange({ bpPosition: e.target.value })}
              className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]"
            >
              <option>Sitting</option>
              <option>Standing</option>
              <option>Supine</option>
            </select>
          </Field>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Arm</p>
            <div className="flex gap-3 mt-1">
              {(["L", "R"] as const).map(a => (
                <label key={a} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" checked={vs.bpArm === a} onChange={() => onVitalSignsChange({ bpArm: a })} className="h-3.5 w-3.5" />
                  <span>{a === "L" ? "Left" : "Right"}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <Field label="Resp Rate">
            <Input value={vs.respiratoryRate} onChange={e => onVitalSignsChange({ respiratoryRate: e.target.value })} placeholder="16" />
          </Field>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Resp Rhythm</p>
            <div className="flex gap-3 mt-1">
              {(["regular", "irregular"] as const).map(s => (
                <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" checked={vs.respiratoryRhythm === s} onChange={() => onVitalSignsChange({ respiratoryRhythm: s })} className="h-3.5 w-3.5" />
                  <span className="capitalize">{s}</span>
                </label>
              ))}
            </div>
          </div>
          <Field label="Pulse Ox %">
            <Input value={vs.pulseOx} onChange={e => onVitalSignsChange({ pulseOx: e.target.value })} placeholder="98" />
          </Field>
          <Field label="Height (in)">
            <Input value={vs.height} onChange={e => onVitalSignsChange({ height: e.target.value })} />
          </Field>
          <div className="space-y-1">
            <Field label="Weight (lbs)">
              <Input value={vs.weight} onChange={e => onVitalSignsChange({ weight: e.target.value })} />
            </Field>
            <CB checked={vs.weightReported} onChange={v => onVitalSignsChange({ weightReported: v })} label="Reported (vs Actual)" />
          </div>
        </div>
      </Sub>

      {/* Neurological / Cognitive */}
      <Sub title="Neurological / Cognitive">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <CB checked={nc.pupillaryRReactive} onChange={v => onNeuroChange({ pupillaryRReactive: v })} label="Pupillary R Reactive" />
          <CB checked={nc.pupillaryLReactive} onChange={v => onNeuroChange({ pupillaryLReactive: v })} label="Pupillary L Reactive" />
          <CB checked={nc.lossOfBalance}      onChange={v => onNeuroChange({ lossOfBalance: v })}      label="Loss of Balance" />
          <CB checked={nc.seizuresTremors}    onChange={v => onNeuroChange({ seizuresTremors: v })}    label="Seizures/Tremors" />
          <CB checked={nc.weaknessParalysis}  onChange={v => onNeuroChange({ weaknessParalysis: v })}  label="Weakness/Paralysis" />
          <CB checked={nc.weaknessR}          onChange={v => onNeuroChange({ weaknessR: v })}          label="Right sided" />
          <CB checked={nc.weaknessL}          onChange={v => onNeuroChange({ weaknessL: v })}          label="Left sided" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1">Orientation:</p>
          <div className="flex flex-wrap gap-3">
            <CB checked={nc.orientedPerson}    onChange={v => onNeuroChange({ orientedPerson: v })}    label="Person" />
            <CB checked={nc.orientedPlace}     onChange={v => onNeuroChange({ orientedPlace: v })}     label="Place" />
            <CB checked={nc.orientedTime}      onChange={v => onNeuroChange({ orientedTime: v })}      label="Time" />
            <CB checked={nc.orientedSituation} onChange={v => onNeuroChange({ orientedSituation: v })} label="Situation" />
            <CB checked={nc.alert}             onChange={v => onNeuroChange({ alert: v })}             label="Alert" />
            <CB checked={nc.confused}          onChange={v => onNeuroChange({ confused: v })}          label="Confused" />
            <CB checked={nc.agitated}          onChange={v => onNeuroChange({ agitated: v })}          label="Agitated" />
            <CB checked={nc.depressed}         onChange={v => onNeuroChange({ depressed: v })}         label="Depressed" />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1">Risk Factors:</p>
          <div className="flex flex-wrap gap-3">
            <CB checked={nc.smokingObesity}  onChange={v => onNeuroChange({ smokingObesity: v })}  label="Smoking/Obesity" />
            <CB checked={nc.noneRiskFactors} onChange={v => onNeuroChange({ noneRiskFactors: v })} label="None identified" />
            <CB checked={nc.noneObserved}    onChange={v => onNeuroChange({ noneObserved: v })}    label="No S/S abuse/neglect" />
          </div>
        </div>
        <Field label="Cognitive Notes">
          <TextArea value={nc.cognitiveNotes} onChange={v => onNeuroChange({ cognitiveNotes: v })} />
        </Field>
      </Sub>

      {/* Respiratory */}
      <Sub title="Respiratory">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <CB checked={r.lungsAllClear}       onChange={v => onRespiratoryChange({ lungsAllClear: v })}       label="Lungs all clear" />
          <CB checked={r.respirationsEasy}    onChange={v => onRespiratoryChange({ respirationsEasy: v })}    label="Respirations easy" />
          <CB checked={r.dyspneaWithExertion} onChange={v => onRespiratoryChange({ dyspneaWithExertion: v })} label="Dyspnea with exertion" />
          <CB checked={r.dyspneaAtRest}       onChange={v => onRespiratoryChange({ dyspneaAtRest: v })}       label="Dyspnea at rest" />
          <CB checked={r.cough}               onChange={v => onRespiratoryChange({ cough: v })}               label="Cough" />
          <CB checked={r.coughProductive}     onChange={v => onRespiratoryChange({ coughProductive: v })}     label="Productive cough" />
          <CB checked={r.oxygenUse}           onChange={v => onRespiratoryChange({ oxygenUse: v })}           label="Oxygen in use" />
        </div>
        {r.oxygenUse && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="O₂ LPM">
              <Input value={r.o2Lpm} onChange={e => onRespiratoryChange({ o2Lpm: e.target.value })} placeholder="2" />
            </Field>
            <Field label="O₂ Delivery">
              <Input value={r.o2Delivery} onChange={e => onRespiratoryChange({ o2Delivery: e.target.value })} placeholder="NC, Mask, etc." />
            </Field>
          </div>
        )}
        <Field label="Notes">
          <TextArea value={r.additionalNotes} onChange={v => onRespiratoryChange({ additionalNotes: v })} />
        </Field>
      </Sub>

      {/* Cardiovascular */}
      <Sub title="Cardiovascular">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <CB checked={cv.normalHeartSounds}   onChange={v => onCardiovascularChange({ normalHeartSounds: v })}   label="Normal heart sounds" />
          <CB checked={cv.atrialFib}           onChange={v => onCardiovascularChange({ atrialFib: v })}           label="Atrial fibrillation" />
          <CB checked={cv.pacemaker}           onChange={v => onCardiovascularChange({ pacemaker: v })}           label="Pacemaker" />
          <CB checked={cv.capillaryRefillLess3} onChange={v => onCardiovascularChange({ capillaryRefillLess3: v })} label="Cap refill &lt;3 sec" />
          <CB checked={cv.edemaPedal}          onChange={v => onCardiovascularChange({ edemaPedal: v })}          label="Pedal edema" />
          <CB checked={cv.edemaR}              onChange={v => onCardiovascularChange({ edemaR: v })}              label="Right" />
          <CB checked={cv.edemaL}              onChange={v => onCardiovascularChange({ edemaL: v })}              label="Left" />
          <CB checked={cv.edemaDependent}      onChange={v => onCardiovascularChange({ edemaDependent: v })}      label="Dependent edema" />
          <CB checked={cv.nonPitting}          onChange={v => onCardiovascularChange({ nonPitting: v })}          label="Non-pitting" />
        </div>
        {cv.edemaPedal && (
          <Field label="Pitting Grade">
            <select
              value={cv.pittingGrade}
              onChange={e => onCardiovascularChange({ pittingGrade: e.target.value })}
              className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]"
            >
              <option value="">— select —</option>
              <option value="1+">1+ (mild)</option>
              <option value="2+">2+ (moderate)</option>
              <option value="3+">3+ (moderately severe)</option>
              <option value="4+">4+ (severe)</option>
            </select>
          </Field>
        )}
        <Field label="Notes">
          <TextArea value={cv.additionalNotes} onChange={v => onCardiovascularChange({ additionalNotes: v })} />
        </Field>
      </Sub>

      {/* Urinary */}
      <Sub title="Urinary / Renal">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <CB checked={u.noHistory}         onChange={v => onUrinaryChange({ noHistory: v })}         label="No significant history" />
          <CB checked={u.frequentUTI}       onChange={v => onUrinaryChange({ frequentUTI: v })}       label="Frequent UTIs" />
          <CB checked={u.kidneyStones}      onChange={v => onUrinaryChange({ kidneyStones: v })}      label="Kidney stones" />
          <CB checked={u.urgency}           onChange={v => onUrinaryChange({ urgency: v })}           label="Urgency" />
          <CB checked={u.incontinence}      onChange={v => onUrinaryChange({ incontinence: v })}      label="Incontinence" />
          <CB checked={u.frequency}         onChange={v => onUrinaryChange({ frequency: v })}         label="Frequency" />
          <CB checked={u.catheterFoley}     onChange={v => onUrinaryChange({ catheterFoley: v })}     label="Foley catheter" />
          <CB checked={u.catheterSuprapubic} onChange={v => onUrinaryChange({ catheterSuprapubic: v })} label="Suprapubic cath" />
          <CB checked={u.catheterCondom}    onChange={v => onUrinaryChange({ catheterCondom: v })}    label="Condom cath" />
        </div>
        <Field label="Urine Color">
          <Input value={u.urineColor} onChange={e => onUrinaryChange({ urineColor: e.target.value })} placeholder="clear yellow" className="w-48" />
        </Field>
        <Field label="Notes">
          <TextArea value={u.additionalNotes} onChange={v => onUrinaryChange({ additionalNotes: v })} />
        </Field>
      </Sub>

      {/* Gastrointestinal */}
      <Sub title="Gastrointestinal">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <CB checked={gi.heartBurn}       onChange={v => onGIChange({ heartBurn: v })}       label="Heartburn/GERD" />
          <CB checked={gi.nausea}          onChange={v => onGIChange({ nausea: v })}          label="Nausea/Vomiting" />
          <CB checked={gi.constipation}    onChange={v => onGIChange({ constipation: v })}    label="Constipation" />
          <CB checked={gi.diarrhea}        onChange={v => onGIChange({ diarrhea: v })}        label="Diarrhea" />
          <CB checked={gi.incontinence}    onChange={v => onGIChange({ incontinence: v })}    label="Bowel incontinence" />
          <CB checked={gi.bowelSoundsNormal} onChange={v => onGIChange({ bowelSoundsNormal: v })} label="Bowel sounds normal" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Last BM">
            <Input value={gi.lastBM} onChange={e => onGIChange({ lastBM: e.target.value })} placeholder="today, yesterday, etc." />
          </Field>
        </div>
        <Field label="Notes">
          <TextArea value={gi.additionalNotes} onChange={v => onGIChange({ additionalNotes: v })} />
        </Field>
      </Sub>

      {/* Nutritional */}
      <Sub title="Nutritional / Metabolic">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <CB checked={n.appetiteGood}         onChange={v => onNutritionalChange({ appetiteGood: v })}         label="Appetite good" />
          <CB checked={n.appetiteFair}         onChange={v => onNutritionalChange({ appetiteFair: v })}         label="Appetite fair" />
          <CB checked={n.appetitePoor}         onChange={v => onNutritionalChange({ appetitePoor: v })}         label="Appetite poor" />
          <CB checked={n.difficultySwallowing} onChange={v => onNutritionalChange({ difficultySwallowing: v })} label="Difficulty swallowing" />
          <CB checked={n.thyroidDisease}       onChange={v => onNutritionalChange({ thyroidDisease: v })}       label="Thyroid disease" />
          {n.thyroidDisease && <>
            <CB checked={n.hypo}             onChange={v => onNutritionalChange({ hypo: v })}             label="Hypothyroid" />
            <CB checked={n.hyper}            onChange={v => onNutritionalChange({ hyper: v })}            label="Hyperthyroid" />
            <CB checked={n.hypoOnTreatment}  onChange={v => onNutritionalChange({ hypoOnTreatment: v })} label="On treatment" />
          </>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nutritional Score">
            <Input value={n.nutritionalScore} onChange={e => onNutritionalChange({ nutritionalScore: e.target.value })} />
          </Field>
          <Field label="Diet Notes">
            <Input value={n.dietNotes} onChange={e => onNutritionalChange({ dietNotes: e.target.value })} />
          </Field>
        </div>
      </Sub>

      {/* Infusion */}
      <Sub title="Infusion / IV Therapy">
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1">Purpose:</p>
          <div className="flex flex-wrap gap-3">
            <CB checked={iv.purposeIVIG}       onChange={v => onInfusionChange({ purposeIVIG: v })}       label="IVIG" />
            <CB checked={iv.purposeAntibiotics} onChange={v => onInfusionChange({ purposeAntibiotics: v })} label="Antibiotics" />
            <CB checked={iv.purposePainControl} onChange={v => onInfusionChange({ purposePainControl: v })} label="Pain Control" />
            <div className="flex items-center gap-2">
              <span className="text-sm">Other:</span>
              <Input value={iv.purposeOther} onChange={e => onInfusionChange({ purposeOther: e.target.value })} className="h-7 text-sm w-32" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Access:</p>
            <div className="space-y-1">
              <CB checked={iv.accessPeripheral} onChange={v => onInfusionChange({ accessPeripheral: v })} label="Peripheral" />
              <CB checked={iv.accessMidline}    onChange={v => onInfusionChange({ accessMidline: v })}    label="Midline" />
              <CB checked={iv.accessCentral}    onChange={v => onInfusionChange({ accessCentral: v })}    label="Central (PICC/Port)" />
            </div>
          </div>
          <Field label="Brand/Type">
            <Input value={iv.brandType} onChange={e => onInfusionChange({ brandType: e.target.value })} />
          </Field>
          <Field label="Gauge">
            <Input value={iv.gauge} onChange={e => onInfusionChange({ gauge: e.target.value })} placeholder="24G" />
          </Field>
          <div className="flex items-end pb-1">
            <CB checked={iv.snToAdminister} onChange={v => onInfusionChange({ snToAdminister: v })} label="SN to administer" />
          </div>
        </div>
        <Field label="Infusion Therapy Notes">
          <TextArea value={iv.infusionTherapyNotes} onChange={v => onInfusionChange({ infusionTherapyNotes: v })} />
        </Field>
        <Field label="Therapy Goals">
          <TextArea value={iv.therapyGoals} onChange={v => onInfusionChange({ therapyGoals: v })} />
        </Field>
        <Field label="SN Orders">
          <TextArea value={iv.snOrders} onChange={v => onInfusionChange({ snOrders: v })} />
        </Field>
      </Sub>
    </div>
  );
}
