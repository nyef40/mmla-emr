"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TolerationsData } from "../types";

type Props = { data: TolerationsData; onChange: (u: Partial<TolerationsData>) => void };

function CB({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded border-gray-300 h-3.5 w-3.5" />
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

export function TolerationsSection({ data, onChange }: Props) {
  return (
    <div className="border rounded-md p-4 space-y-4">
      <h3 className="font-bold text-sm uppercase tracking-wide border-b pb-1">Toleration of Infusion Assessment</h3>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-sm font-semibold">Any change in status since RN left after last visit?</Label>
          <RG value={data.statusChangedSinceLastVisit} onChange={v => onChange({ statusChangedSinceLastVisit: v })} options={["Yes", "No", "N/A (First Dose)"]} />
          {data.statusChangedSinceLastVisit === "Yes" && (
            <Input className="mt-1" placeholder="Describe..." value={data.statusChangeDescription} onChange={e => onChange({ statusChangeDescription: e.target.value })} />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-sm font-semibold">Fevers?</Label>
            <Input value={data.fevers} onChange={e => onChange({ fevers: e.target.value })} placeholder="None / temperature" />
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <CB checked={data.erVisits} onChange={v => onChange({ erVisits: v })} label="ER visits / Hospitalizations?" />
          <CB checked={data.pharmacyNotified} onChange={v => onChange({ pharmacyNotified: v })} label="Pharmacy notified?" />
        </div>

        {data.pharmacyNotified && (
          <div className="grid grid-cols-2 gap-4 pl-4">
            <div className="space-y-1">
              <Label className="text-sm">Date / Time of call</Label>
              <Input value={data.pharmacyCallDateTime} onChange={e => onChange({ pharmacyCallDateTime: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Person taking call</Label>
              <Input value={data.pharmacyCallPerson} onChange={e => onChange({ pharmacyCallPerson: e.target.value })} />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-sm font-semibold">Disease symptoms poorly controlled?</Label>
          <RG value={data.diseasePoorlyControlled} onChange={v => onChange({ diseasePoorlyControlled: v })} options={["Yes", "No"]} />
          {data.diseasePoorlyControlled === "Yes" && (
            <Input className="mt-1" placeholder="Describe..." value={data.poorlyControlledDescription} onChange={e => onChange({ poorlyControlledDescription: e.target.value })} />
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-semibold">Recommend returning to controlled setting?</Label>
          <RG value={data.returnToFacility} onChange={v => onChange({ returnToFacility: v })} options={["Yes", "No"]} />
          {data.returnToFacility === "Yes" && (
            <div className="space-y-1 mt-1">
              <Label className="text-sm">Rationale</Label>
              <Input value={data.returnToFacilityRationale} onChange={e => onChange({ returnToFacilityRationale: e.target.value })} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
