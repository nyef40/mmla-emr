"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { OasisMedications, OasisCareManagement, OasisAssessmentSummary, OasisPlanOfCare } from "../types";

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

function TextArea({ value, onChange, rows = 3, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a] resize-none"
    />
  );
}

type Props = {
  medications: OasisMedications;
  careManagement: OasisCareManagement;
  assessmentSummary: OasisAssessmentSummary;
  planOfCare: OasisPlanOfCare;
  onMedicationsChange: (u: Partial<OasisMedications>) => void;
  onCareManagementChange: (u: Partial<OasisCareManagement>) => void;
  onAssessmentSummaryChange: (u: Partial<OasisAssessmentSummary>) => void;
  onPlanOfCareChange: (u: Partial<OasisPlanOfCare>) => void;
};

export function CarePlanSection({
  medications, careManagement, assessmentSummary, planOfCare,
  onMedicationsChange, onCareManagementChange, onAssessmentSummaryChange, onPlanOfCareChange,
}: Props) {
  const cm = careManagement;
  const as_ = assessmentSummary;
  const poc = planOfCare;

  return (
    <div className="space-y-4">
      {/* Medications */}
      <Sub title="Medications">
        <CB
          checked={medications.medChangedSinceLastVisit}
          onChange={v => onMedicationsChange({ medChangedSinceLastVisit: v })}
          label="Medications changed since last visit"
        />
        <Field label="Medication Notes">
          <TextArea
            value={medications.additionalNotes}
            onChange={v => onMedicationsChange({ additionalNotes: v })}
            rows={4}
            placeholder="List any medication changes, new prescriptions, or reconciliation notes…"
          />
        </Field>
      </Sub>

      {/* Care Management */}
      <Sub title="Care Management (M1033)">
        <Field label="Primary Caregiver Changes">
          <TextArea value={cm.primaryCaregiverChanges} onChange={v => onCareManagementChange({ primaryCaregiverChanges: v })} rows={2} />
        </Field>
        <Field label="Re-hospitalization Risk">
          <TextArea value={cm.rehospitalizationRisk} onChange={v => onCareManagementChange({ rehospitalizationRisk: v })} rows={2} />
        </Field>
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1">M1033 – Risk for Hospitalization (check all):</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <CB checked={cm.m1033HistoryFalls}         onChange={v => onCareManagementChange({ m1033HistoryFalls: v })}         label="History of falls" />
            <CB checked={cm.m1033WeightLoss}           onChange={v => onCareManagementChange({ m1033WeightLoss: v })}           label="Unintended weight loss" />
            <CB checked={cm.m1033TakingManyMeds}       onChange={v => onCareManagementChange({ m1033TakingManyMeds: v })}       label="Taking many medications" />
            <CB checked={cm.m1033CurrentlyExhaustion}  onChange={v => onCareManagementChange({ m1033CurrentlyExhaustion: v })}  label="Currently experiencing exhaustion" />
            <CB checked={cm.m1033OtherRisk}            onChange={v => onCareManagementChange({ m1033OtherRisk: v })}            label="Other risk(s)" />
            <CB checked={cm.m1033None}                 onChange={v => onCareManagementChange({ m1033None: v })}                 label="None of the above" />
          </div>
        </div>
      </Sub>

      {/* Assessment Summary */}
      <Sub title="Assessment Summary">
        <Field label="Clinical Summary">
          <TextArea
            value={as_.summaryText}
            onChange={v => onAssessmentSummaryChange({ summaryText: v })}
            rows={4}
            placeholder="Overall clinical impression and status…"
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Supplies Used">
            <TextArea value={as_.suppliesUsed} onChange={v => onAssessmentSummaryChange({ suppliesUsed: v })} rows={2} />
          </Field>
          <Field label="Interventions Provided">
            <TextArea value={as_.interventionsProvided} onChange={v => onAssessmentSummaryChange({ interventionsProvided: v })} rows={2} />
          </Field>
          <Field label="Response to Interventions">
            <TextArea value={as_.responseToInterventions} onChange={v => onAssessmentSummaryChange({ responseToInterventions: v })} rows={2} />
          </Field>
        </div>
      </Sub>

      {/* Plan of Care */}
      <Sub title="Plan of Care / Recertification">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Homebound Status">
            <TextArea
              value={poc.homeboundStatus}
              onChange={v => onPlanOfCareChange({ homeboundStatus: v })}
              rows={2}
              placeholder="Describe homebound justification…"
            />
          </Field>
          <Field label="Recertification Eligibility">
            <TextArea value={poc.recertificationEligibility} onChange={v => onPlanOfCareChange({ recertificationEligibility: v })} rows={2} />
          </Field>
          <Field label="Face-to-Face Encounter">
            <Input value={poc.faceToFace} onChange={e => onPlanOfCareChange({ faceToFace: e.target.value })} placeholder="Date, provider" />
          </Field>
          <Field label="Prognosis">
            <select
              value={poc.prognosis}
              onChange={e => onPlanOfCareChange({ prognosis: e.target.value })}
              className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]"
            >
              <option value="">— select —</option>
              <option>Poor</option>
              <option>Guarded</option>
              <option>Fair</option>
              <option>Good</option>
              <option>Excellent</option>
            </select>
          </Field>
          <Field label="Rehab Potential">
            <select
              value={poc.rehabPotential}
              onChange={e => onPlanOfCareChange({ rehabPotential: e.target.value })}
              className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]"
            >
              <option value="">— select —</option>
              <option>Poor</option>
              <option>Fair</option>
              <option>Good</option>
              <option>Excellent</option>
            </select>
          </Field>
          <Field label="Durable Medical Equipment">
            <Input value={poc.dme} onChange={e => onPlanOfCareChange({ dme: e.target.value })} placeholder="List DME ordered or in use" />
          </Field>
          <Field label="Other Interventions">
            <TextArea value={poc.otherInterventions} onChange={v => onPlanOfCareChange({ otherInterventions: v })} rows={2} />
          </Field>
          <Field label="Other Goals">
            <TextArea value={poc.otherGoals} onChange={v => onPlanOfCareChange({ otherGoals: v })} rows={2} />
          </Field>
          <Field label="Discharge Plan">
            <TextArea value={poc.dischargePlan} onChange={v => onPlanOfCareChange({ dischargePlan: v })} rows={2} />
          </Field>
          <Field label="Plans for Next Visit">
            <TextArea value={poc.plansForNextVisit} onChange={v => onPlanOfCareChange({ plansForNextVisit: v })} rows={2} />
          </Field>
        </div>
      </Sub>
    </div>
  );
}
