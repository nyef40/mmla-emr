"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OasisFunctionalStatus, OasisFunctionalAbilities, OasisFallRisk, OasisSkinIntegumentary } from "../types";

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

const M_CODE_SELECT_CLASS = "w-full h-9 rounded-md border border-input bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]";

const GG_CODES = [
  { value: "", label: "—" },
  { value: "06", label: "06 – Independent" },
  { value: "05", label: "05 – Setup/cleanup only" },
  { value: "04", label: "04 – Supervision" },
  { value: "03", label: "03 – Partial/moderate assist" },
  { value: "02", label: "02 – Substantial/maximal assist" },
  { value: "01", label: "01 – Dependent" },
  { value: "07", label: "07 – Patient refused" },
  { value: "09", label: "09 – Not applicable" },
  { value: "10", label: "10 – Not attempted (safety)" },
  { value: "88", label: "88 – Not attempted (other)" },
];

function GgSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] text-gray-500 leading-tight">{label}</p>
      <select value={value} onChange={e => onChange(e.target.value)} className={M_CODE_SELECT_CLASS}>
        {GG_CODES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

type Props = {
  functionalStatus: OasisFunctionalStatus;
  functionalAbilities: OasisFunctionalAbilities;
  fallRisk: OasisFallRisk;
  skinIntegumentary: OasisSkinIntegumentary;
  onFunctionalStatusChange: (u: Partial<OasisFunctionalStatus>) => void;
  onFunctionalAbilitiesChange: (u: Partial<OasisFunctionalAbilities>) => void;
  onFallRiskChange: (u: Partial<OasisFallRisk>) => void;
  onSkinChange: (u: Partial<OasisSkinIntegumentary>) => void;
};

export function FunctionalSection({
  functionalStatus, functionalAbilities, fallRisk, skinIntegumentary,
  onFunctionalStatusChange, onFunctionalAbilitiesChange, onFallRiskChange, onSkinChange,
}: Props) {
  const fs = functionalStatus;
  const fa = functionalAbilities;
  const fr = fallRisk;
  const si = skinIntegumentary;

  return (
    <div className="space-y-4">
      {/* M-code Functional Status */}
      <Sub title="Functional Status – M-Codes (OASIS)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="M1800 – Grooming">
            <select value={fs.m1800} onChange={e => onFunctionalStatusChange({ m1800: e.target.value as OasisFunctionalStatus["m1800"] })} className={M_CODE_SELECT_CLASS}>
              <option value="">—</option>
              <option value="0">0 – Able to groom independently</option>
              <option value="1">1 – Grooming with assistive device</option>
              <option value="2">2 – Needs assistance</option>
              <option value="3">3 – Dependent</option>
            </select>
          </Field>
          <Field label="M1810 – Dressing Upper Body">
            <select value={fs.m1810} onChange={e => onFunctionalStatusChange({ m1810: e.target.value as OasisFunctionalStatus["m1810"] })} className={M_CODE_SELECT_CLASS}>
              <option value="">—</option>
              <option value="0">0 – Dresses independently</option>
              <option value="1">1 – Needs minor assistance</option>
              <option value="2">2 – Needs moderate assistance</option>
              <option value="3">3 – Dependent</option>
            </select>
          </Field>
          <Field label="M1820 – Dressing Lower Body">
            <select value={fs.m1820} onChange={e => onFunctionalStatusChange({ m1820: e.target.value as OasisFunctionalStatus["m1820"] })} className={M_CODE_SELECT_CLASS}>
              <option value="">—</option>
              <option value="0">0 – Dresses independently</option>
              <option value="1">1 – Needs minor assistance</option>
              <option value="2">2 – Needs moderate assistance</option>
              <option value="3">3 – Dependent</option>
            </select>
          </Field>
          <Field label="M1830 – Bathing">
            <select value={fs.m1830} onChange={e => onFunctionalStatusChange({ m1830: e.target.value as OasisFunctionalStatus["m1830"] })} className={M_CODE_SELECT_CLASS}>
              <option value="">—</option>
              <option value="0">0 – Independent, with or without device</option>
              <option value="1">1 – With built-in safety devices</option>
              <option value="2">2 – Bathes with minimal assistance</option>
              <option value="3">3 – Bathed with assistance in tub/shower</option>
              <option value="4">4 – Participates in bath at sink/chair</option>
              <option value="5">5 – Unable to bathe self</option>
              <option value="6">6 – Not attempted – unsafe</option>
            </select>
          </Field>
          <Field label="M1840 – Toilet Transferring">
            <select value={fs.m1840} onChange={e => onFunctionalStatusChange({ m1840: e.target.value as OasisFunctionalStatus["m1840"] })} className={M_CODE_SELECT_CLASS}>
              <option value="">—</option>
              <option value="0">0 – Transfers independently</option>
              <option value="1">1 – Transfers with device</option>
              <option value="2">2 – Needs assistance</option>
              <option value="3">3 – Unable; uses commode/bedpan</option>
              <option value="4">4 – Dependent</option>
            </select>
          </Field>
          <Field label="M1850 – Transferring">
            <select value={fs.m1850} onChange={e => onFunctionalStatusChange({ m1850: e.target.value as OasisFunctionalStatus["m1850"] })} className={M_CODE_SELECT_CLASS}>
              <option value="">—</option>
              <option value="0">0 – Transfers independently</option>
              <option value="1">1 – Transfers with device</option>
              <option value="2">2 – Needs assistance from person</option>
              <option value="3">3 – Partial assistance, unsafe alone</option>
              <option value="4">4 – Dependent</option>
              <option value="5">5 – Unable to transfer</option>
            </select>
          </Field>
          <Field label="M1860 – Ambulation / Locomotion">
            <select value={fs.m1860} onChange={e => onFunctionalStatusChange({ m1860: e.target.value as OasisFunctionalStatus["m1860"] })} className={M_CODE_SELECT_CLASS}>
              <option value="">—</option>
              <option value="0">0 – Ambulates independently on all surfaces</option>
              <option value="1">1 – Requires cane/walker/crutch</option>
              <option value="2">2 – Requires railings or supervision</option>
              <option value="3">3 – Requires personal assistance</option>
              <option value="4">4 – Uses wheelchair independently</option>
              <option value="5">5 – Uses wheelchair with assistance</option>
              <option value="6">6 – Bedfast, unable to ambulate</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Ambulation Notes">
            <TextArea value={fs.ambulation_notes} onChange={v => onFunctionalStatusChange({ ambulation_notes: v })} />
          </Field>
          <Field label="Weight Bearing Limitations">
            <TextArea value={fs.weightBearingLimitations} onChange={v => onFunctionalStatusChange({ weightBearingLimitations: v })} />
          </Field>
          <Field label="Assistive Devices">
            <Input value={fs.assistiveDevices} onChange={e => onFunctionalStatusChange({ assistiveDevices: e.target.value })} />
          </Field>
          <Field label="Activities Permitted">
            <Input value={fs.activitiesPermitted} onChange={e => onFunctionalStatusChange({ activitiesPermitted: e.target.value })} />
          </Field>
          <Field label="Functional Limitations">
            <Input value={fs.functionalLimitations} onChange={e => onFunctionalStatusChange({ functionalLimitations: e.target.value })} />
          </Field>
        </div>
      </Sub>

      {/* GG Functional Abilities */}
      <Sub title="Functional Abilities – GG Codes (OASIS E2)">
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">GG0130 – Self-Care (Follow-Up)</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <GgSelect value={fa.gg0130_eating} onChange={v => onFunctionalAbilitiesChange({ gg0130_eating: v })} label="Eating" />
            <GgSelect value={fa.gg0130_oralHygiene} onChange={v => onFunctionalAbilitiesChange({ gg0130_oralHygiene: v })} label="Oral Hygiene" />
            <GgSelect value={fa.gg0130_toiletHygiene} onChange={v => onFunctionalAbilitiesChange({ gg0130_toiletHygiene: v })} label="Toilet Hygiene" />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">GG0170 – Mobility (Follow-Up)</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <GgSelect value={fa.gg0170_rollLeftRight}   onChange={v => onFunctionalAbilitiesChange({ gg0170_rollLeftRight: v })}   label="Roll Left & Right" />
            <GgSelect value={fa.gg0170_sitToLying}      onChange={v => onFunctionalAbilitiesChange({ gg0170_sitToLying: v })}      label="Sit to Lying" />
            <GgSelect value={fa.gg0170_lyingToSitting}  onChange={v => onFunctionalAbilitiesChange({ gg0170_lyingToSitting: v })}  label="Lying to Sitting on Edge" />
            <GgSelect value={fa.gg0170_sitToStand}      onChange={v => onFunctionalAbilitiesChange({ gg0170_sitToStand: v })}      label="Sit to Stand" />
            <GgSelect value={fa.gg0170_chairTransfer}   onChange={v => onFunctionalAbilitiesChange({ gg0170_chairTransfer: v })}   label="Chair/Bed Transfer" />
            <GgSelect value={fa.gg0170_toiletTransfer}  onChange={v => onFunctionalAbilitiesChange({ gg0170_toiletTransfer: v })}  label="Toilet Transfer" />
            <GgSelect value={fa.gg0170_walk10Feet}      onChange={v => onFunctionalAbilitiesChange({ gg0170_walk10Feet: v })}      label="Walk 10 Feet" />
            <GgSelect value={fa.gg0170_walk50Feet}      onChange={v => onFunctionalAbilitiesChange({ gg0170_walk50Feet: v })}      label="Walk 50 Feet" />
            <GgSelect value={fa.gg0170_walkUneven}      onChange={v => onFunctionalAbilitiesChange({ gg0170_walkUneven: v })}      label="Walk on Uneven Surface" />
            <GgSelect value={fa.gg0170_oneStepCurb}     onChange={v => onFunctionalAbilitiesChange({ gg0170_oneStepCurb: v })}     label="1 Step Curb" />
            <GgSelect value={fa.gg0170_fourSteps}       onChange={v => onFunctionalAbilitiesChange({ gg0170_fourSteps: v })}       label="4 Steps" />
            <GgSelect value={fa.gg0170_wheelchair}      onChange={v => onFunctionalAbilitiesChange({ gg0170_wheelchair: v })}      label="Wheelchair 50 Ft" />
          </div>
        </div>
      </Sub>

      {/* Fall Risk */}
      <Sub title="Fall Risk Assessment (MAHC-10)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Most Recent Fall">
            <select
              value={fr.mostRecentFall}
              onChange={e => onFallRiskChange({ mostRecentFall: e.target.value as OasisFallRisk["mostRecentFall"] })}
              className={M_CODE_SELECT_CLASS}
            >
              <option value="">— select —</option>
              <option value="noFalls">No falls in last year</option>
              <option value="less3mo">Fall within last 3 months</option>
              <option value="3to6mo">Fall 3–6 months ago</option>
              <option value="7to12mo">Fall 7–12 months ago</option>
              <option value="overYear">Fall over a year ago</option>
            </select>
          </Field>
          <Field label="Fall Description">
            <Input value={fr.fallDescription} onChange={e => onFallRiskChange({ fallDescription: e.target.value })} />
          </Field>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1">MAHC-10 Risk Factors (check all):</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <CB checked={fr.age65plus}            onChange={v => onFallRiskChange({ age65plus: v })}            label="Age 65+" />
            <CB checked={fr.diagnosisMultiple}    onChange={v => onFallRiskChange({ diagnosisMultiple: v })}    label="Multiple diagnoses" />
            <CB checked={fr.priorFall3mo}         onChange={v => onFallRiskChange({ priorFall3mo: v })}         label="Prior fall within 3 mo" />
            <CB checked={fr.incontinence}         onChange={v => onFallRiskChange({ incontinence: v })}         label="Incontinence" />
            <CB checked={fr.visualImpairment}     onChange={v => onFallRiskChange({ visualImpairment: v })}     label="Visual impairment" />
            <CB checked={fr.impairedFunctional}   onChange={v => onFallRiskChange({ impairedFunctional: v })}   label="Impaired function/mobility" />
            <CB checked={fr.environmentalHazards} onChange={v => onFallRiskChange({ environmentalHazards: v })} label="Environmental hazards" />
            <CB checked={fr.polyPharmacy}         onChange={v => onFallRiskChange({ polyPharmacy: v })}         label="Polypharmacy (4+ meds)" />
            <CB checked={fr.painAffectingFunction} onChange={v => onFallRiskChange({ painAffectingFunction: v })} label="Pain affecting function" />
            <CB checked={fr.cognitiveImpairment}  onChange={v => onFallRiskChange({ cognitiveImpairment: v })}  label="Cognitive impairment" />
          </div>
        </div>
        <Field label="MAHC-10 Total Score">
          <Input
            value={fr.mahc10Total}
            onChange={e => onFallRiskChange({ mahc10Total: e.target.value })}
            className="w-20"
            placeholder="0–10"
          />
        </Field>
      </Sub>

      {/* Skin / Integumentary */}
      <Sub title="Skin / Integumentary (M1306)">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <CB checked={si.colorNormal}      onChange={v => onSkinChange({ colorNormal: v })}      label="Color normal" />
          <CB checked={si.colorPale}        onChange={v => onSkinChange({ colorPale: v })}        label="Pale/cyanotic" />
          <CB checked={si.skinTurgorGood}   onChange={v => onSkinChange({ skinTurgorGood: v })}   label="Turgor good" />
          <CB checked={si.skinTurgorFair}   onChange={v => onSkinChange({ skinTurgorFair: v })}   label="Turgor fair/poor" />
          <CB checked={si.tempDry}          onChange={v => onSkinChange({ tempDry: v })}          label="Dry" />
          <CB checked={si.tempWarm}         onChange={v => onSkinChange({ tempWarm: v })}         label="Warm" />
          <CB checked={si.woundsIdentified} onChange={v => onSkinChange({ woundsIdentified: v })} label="Wounds identified" />
        </div>
        <Field label="M1306 – Any Unhealed Pressure Ulcer/Injury Stage 2+">
          <div className="flex gap-4">
            {([["0", "No"], ["1", "Yes"]] as const).map(([v, lbl]) => (
              <label key={v} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" checked={si.m1306UnhealedUlcer === v} onChange={() => onSkinChange({ m1306UnhealedUlcer: v })} className="h-3.5 w-3.5" />
                <span>{lbl}</span>
              </label>
            ))}
          </div>
        </Field>
        <Field label="Integumentary Notes">
          <TextArea value={si.integumentaryNotes} onChange={v => onSkinChange({ integumentaryNotes: v })} />
        </Field>
      </Sub>
    </div>
  );
}
