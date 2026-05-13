"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import type { OasisDiagnoses, OasisDiagnosis, OasisImmunization, OasisSafety } from "../types";

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

const SYMPTOM_CONTROL_OPTIONS = [
  { value: "0", label: "0 – Asymptomatic, no treatment needed" },
  { value: "1", label: "1 – Symptomatic, treatment not needed" },
  { value: "2", label: "2 – Symptoms well-controlled with treatment" },
  { value: "3", label: "3 – Symptoms controlled with difficulty" },
  { value: "4", label: "4 – Symptoms poorly controlled" },
];

function DiagRow({
  dx, label, onChange,
}: { dx: OasisDiagnosis; label: string; onChange: (u: Partial<OasisDiagnosis>) => void }) {
  return (
    <div className="border border-gray-100 rounded p-3 space-y-2 bg-gray-50">
      <p className="text-xs font-semibold text-gray-600">{label}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="Description">
          <Input value={dx.description} onChange={e => onChange({ description: e.target.value })} />
        </Field>
        <Field label="ICD-10 Code">
          <Input value={dx.icdCode} onChange={e => onChange({ icdCode: e.target.value })} placeholder="e.g. G35" />
        </Field>
        <Field label="Diag Date">
          <Input type="date" value={dx.diagDate} onChange={e => onChange({ diagDate: e.target.value })} />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Symptom Control Rating (M1021/M1023)">
          <select
            value={dx.symptomControl}
            onChange={e => onChange({ symptomControl: e.target.value as OasisDiagnosis["symptomControl"] })}
            className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]"
          >
            <option value="">— select —</option>
            {SYMPTOM_CONTROL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Type</p>
          <div className="flex gap-4 mt-1">
            {([["E", "Exacerbation"], ["O", "Ongoing"]] as const).map(([v, lbl]) => (
              <label key={v} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" checked={dx.type === v} onChange={() => onChange({ type: v })} className="h-3.5 w-3.5" />
                <span>{lbl}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type Props = {
  diagnoses: OasisDiagnoses;
  immunization: OasisImmunization;
  safety: OasisSafety;
  onDiagnosesChange: (u: Partial<OasisDiagnoses>) => void;
  onImmunizationChange: (u: Partial<OasisImmunization>) => void;
  onSafetyChange: (u: Partial<OasisSafety>) => void;
};

const IMMU_STATUS = ["unknown", "no", "yes"] as const;

function ImmRow({ label, value, onChange, showDate, date, onDate, showDetail, detail, onDetail }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  showDate?: boolean;
  date?: string;
  onDate?: (v: string) => void;
  showDetail?: boolean;
  detail?: string;
  onDetail?: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium w-32">{label}</span>
      <div className="flex gap-3">
        {IMMU_STATUS.map(s => (
          <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer capitalize">
            <input type="radio" checked={value === s} onChange={() => onChange(s)} className="h-3.5 w-3.5" />
            <span>{s === "unknown" ? "Unknown" : s === "yes" ? "Yes" : "No"}</span>
          </label>
        ))}
      </div>
      {showDate && value === "yes" && (
        <Input type="date" value={date ?? ""} onChange={e => onDate?.(e.target.value)} className="h-7 w-36 text-sm" />
      )}
      {showDetail && (
        <Input value={detail ?? ""} onChange={e => onDetail?.(e.target.value)} placeholder="notes" className="h-7 text-sm flex-1" />
      )}
    </div>
  );
}

export function DiagnosesSection({ diagnoses, immunization, safety, onDiagnosesChange, onImmunizationChange, onSafetyChange }: Props) {
  const d = diagnoses;

  function addOther() {
    const blank: OasisDiagnosis = { description: "", icdCode: "", symptomControl: "", diagDate: "", type: "" };
    onDiagnosesChange({ others: [...d.others, blank] });
  }

  function updateOther(i: number, patch: Partial<OasisDiagnosis>) {
    const updated = d.others.map((dx, idx) => idx === i ? { ...dx, ...patch } : dx);
    onDiagnosesChange({ others: updated });
  }

  function removeOther(i: number) {
    onDiagnosesChange({ others: d.others.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="space-y-4">
      {/* Diagnoses */}
      <Sub title="Diagnoses (M1021 Primary / M1023 Others)">
        <DiagRow dx={d.primary} label="Primary Diagnosis" onChange={patch => onDiagnosesChange({ primary: { ...d.primary, ...patch } })} />

        {d.others.map((dx, i) => (
          <div key={i} className="relative">
            <DiagRow dx={dx} label={`Other Diagnosis ${i + 1}`} onChange={patch => updateOther(i, patch)} />
            <button
              onClick={() => removeOther(i)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
              type="button"
              title="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        <Button type="button" size="sm" variant="outline" onClick={addOther} className="text-xs">
          <PlusCircle className="h-3.5 w-3.5 mr-1" /> Add Other Diagnosis
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <Field label="Pertinent History">
            <textarea
              value={d.pertinentHistory}
              onChange={e => onDiagnosesChange({ pertinentHistory: e.target.value })}
              rows={2}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a] resize-none"
            />
          </Field>
          <Field label="Last Hospitalization">
            <textarea
              value={d.lastHospitalization}
              onChange={e => onDiagnosesChange({ lastHospitalization: e.target.value })}
              rows={2}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a] resize-none"
            />
          </Field>
          <Field label="Last Physician Contact">
            <Input value={d.lastPhysicianContact} onChange={e => onDiagnosesChange({ lastPhysicianContact: e.target.value })} />
          </Field>
          <Field label="Advance Directives">
            <Input value={d.advanceDirectives} onChange={e => onDiagnosesChange({ advanceDirectives: e.target.value })} placeholder="DNR, Living Will, etc." />
          </Field>
        </div>
      </Sub>

      {/* Immunization */}
      <Sub title="Immunization Status">
        <div className="space-y-2">
          <ImmRow
            label="Pneumococcal"
            value={immunization.pneumococcal}
            onChange={v => onImmunizationChange({ pneumococcal: v as OasisImmunization["pneumococcal"] })}
            showDate date={immunization.pneumococcalDate} onDate={v => onImmunizationChange({ pneumococcalDate: v })}
            showDetail detail={immunization.pneumococcalDetail} onDetail={v => onImmunizationChange({ pneumococcalDetail: v })}
          />
          <ImmRow
            label="Influenza"
            value={immunization.influenza}
            onChange={v => onImmunizationChange({ influenza: v as OasisImmunization["influenza"] })}
            showDate date={immunization.influenzaDate} onDate={v => onImmunizationChange({ influenzaDate: v })}
          />
          <ImmRow
            label="Shingles"
            value={immunization.shingles}
            onChange={v => onImmunizationChange({ shingles: v as OasisImmunization["shingles"] })}
            showDate date={immunization.shinglesDate} onDate={v => onImmunizationChange({ shinglesDate: v })}
          />
          <ImmRow
            label="COVID-19"
            value={immunization.covid}
            onChange={v => onImmunizationChange({ covid: v as OasisImmunization["covid"] })}
            showDate date={immunization.covidDate} onDate={v => onImmunizationChange({ covidDate: v })}
            showDetail detail={immunization.covidDetail} onDetail={v => onImmunizationChange({ covidDetail: v })}
          />
        </div>
      </Sub>

      {/* Safety */}
      <Sub title="Home Safety Assessment">
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1">Environmental Hazards (check all that apply):</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <CB checked={safety.stairsInOut}        onChange={v => onSafetyChange({ stairsInOut: v })}        label="Stairs inside/outside" />
            <CB checked={safety.inadequateHeating}   onChange={v => onSafetyChange({ inadequateHeating: v })}  label="Inadequate heating/cooling" />
            <CB checked={safety.inadequateLighting}  onChange={v => onSafetyChange({ inadequateLighting: v })} label="Inadequate lighting" />
            <CB checked={safety.inadequateSanitation} onChange={v => onSafetyChange({ inadequateSanitation: v })} label="Inadequate sanitation" />
            <CB checked={safety.oxygenInUse}         onChange={v => onSafetyChange({ oxygenInUse: v })}        label="O₂ in use" />
            <CB checked={safety.cluttered}           onChange={v => onSafetyChange({ cluttered: v })}          label="Cluttered/unsafe walkways" />
            <CB checked={safety.floorCoverings}      onChange={v => onSafetyChange({ floorCoverings: v })}     label="Unsafe floor coverings" />
            <CB checked={safety.noneIdentified}      onChange={v => onSafetyChange({ noneIdentified: v })}     label="None identified" />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1">Emergency Planning:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <CB checked={safety.fireExtinguisher}       onChange={v => onSafetyChange({ fireExtinguisher: v })}       label="Fire extinguisher" />
            <CB checked={safety.smokeDetectorAll}       onChange={v => onSafetyChange({ smokeDetectorAll: v })}       label="Smoke detector on all floors" />
            <CB checked={safety.smokeDetectorMaintained} onChange={v => onSafetyChange({ smokeDetectorMaintained: v })} label="Smoke detector maintained" />
            <CB checked={safety.moreThanOneExit}        onChange={v => onSafetyChange({ moreThanOneExit: v })}        label="More than one exit" />
            <CB checked={safety.planForExit}            onChange={v => onSafetyChange({ planForExit: v })}            label="Plan for exit in emergency" />
            <CB checked={safety.planForPowerFailure}    onChange={v => onSafetyChange({ planForPowerFailure: v })}    label="Plan for power failure" />
            <CB checked={safety.planForNaturalDisaster} onChange={v => onSafetyChange({ planForNaturalDisaster: v })} label="Plan for natural disaster" />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1">Equipment:</p>
          <div className="flex flex-wrap gap-3">
            <CB checked={safety.walker}     onChange={v => onSafetyChange({ walker: v })}     label="Walker" />
            <CB checked={safety.cane}       onChange={v => onSafetyChange({ cane: v })}       label="Cane" />
            <CB checked={safety.wheelchair} onChange={v => onSafetyChange({ wheelchair: v })} label="Wheelchair" />
          </div>
        </div>
        <Field label="Safety Notes">
          <textarea
            value={safety.safetyMeasuresNotes}
            onChange={e => onSafetyChange({ safetyMeasuresNotes: e.target.value })}
            rows={2}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a] resize-none"
          />
        </Field>
      </Sub>
    </div>
  );
}
