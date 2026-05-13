"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HeaderData } from "../types";

type BillingCode = { id: number; code: string; description: string };

type Props = {
  data: HeaderData;
  patientName: string;
  patientMRN: string;
  patientDOB: string;
  rnName: string;
  visitDate: string;
  onChange: (updates: Partial<HeaderData>) => void;
};

function CB({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded border-gray-300 h-3.5 w-3.5" />
      <span>{label}</span>
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold uppercase tracking-wide text-gray-600">{label}</Label>
      {children}
    </div>
  );
}

export function HeaderSection({ data, patientName, patientMRN, patientDOB, rnName, visitDate, onChange }: Props) {
  const [billingCodes, setBillingCodes] = useState<BillingCode[]>([]);

  useEffect(() => {
    fetch("/api/libraries/billing-codes")
      .then(r => r.ok ? r.json() : [])
      .then(setBillingCodes)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Agency header */}
      <div className="text-center border-b pb-3">
        <p className="font-bold text-lg">SKILLED NURSE INFUSION VISIT NOTE</p>
        <p className="text-sm text-gray-600">Mobile Medical LA, LLC · 6818 S. La Cienega Blvd 203 · Inglewood, CA 90302-1560</p>
        <p className="text-sm text-gray-600">Phone: (213) 545-6652 · Fax: (877) 845-6050</p>
      </div>

      {/* Visit meta row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-b pb-4">
        <div><span className="font-semibold">Patient:</span> {patientName}</div>
        <div><span className="font-semibold">MR#:</span> {patientMRN}</div>
        <div><span className="font-semibold">Visit Date:</span> {visitDate}</div>
        <div><span className="font-semibold">Caregiver:</span> {rnName}</div>
      </div>

      {/* Visit logistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Mileage">
          <Input value={data.mileage} onChange={e => onChange({ mileage: e.target.value })} placeholder="e.g. 50" />
        </Field>
        <Field label="Billing Code">
          <select
            value={data.billingCode}
            onChange={e => onChange({ billingCode: e.target.value })}
            className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]"
          >
            <option value="">— select —</option>
            {billingCodes.map(c => (
              <option key={c.id} value={c.code}>
                {c.code} — {c.description}
              </option>
            ))}
            {/* Show saved value even if not in current list */}
            {data.billingCode && !billingCodes.some(c => c.code === data.billingCode) && (
              <option value={data.billingCode}>{data.billingCode}</option>
            )}
          </select>
        </Field>
        <Field label="Time In">
          <Input type="time" value={data.timeIn} onChange={e => onChange({ timeIn: e.target.value })} />
        </Field>
        <Field label="Time Out">
          <Input type="time" value={data.timeOut} onChange={e => onChange({ timeOut: e.target.value })} />
        </Field>
      </div>

      {/* Patient information box */}
      <div className="border rounded-md p-4 space-y-4">
        <h3 className="font-bold text-sm uppercase tracking-wide border-b pb-1">Patient Information</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><span className="font-semibold">Name:</span> {patientName}</div>
          <div><span className="font-semibold">DOB:</span> {patientDOB}</div>
          <div><span className="font-semibold">Today&apos;s Date:</span> {visitDate}</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Weight (lbs)">
            <Input value={data.weight} onChange={e => onChange({ weight: e.target.value })} placeholder="137" />
          </Field>
          <div className="flex items-end gap-4 pb-1">
            <CB checked={data.weightReported} onChange={v => onChange({ weightReported: v })} label="Reported" />
            <span className="text-sm text-gray-500">(vs Actual)</span>
          </div>
          <Field label="Next Infusion Date">
            <Input type="date" value={data.nextInfusionDate} onChange={e => onChange({ nextInfusionDate: e.target.value })} />
          </Field>
          <div className="flex items-end pb-1">
            <CB checked={data.pharmacyChangeReport} onChange={v => onChange({ pharmacyChangeReport: v })} label="+/- 10% change — report to pharmacy" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <CB checked={data.medsListReviewed} onChange={v => onChange({ medsListReviewed: v })} label="Medications List Reviewed" />
          <CB checked={data.ordersReviewed} onChange={v => onChange({ ordersReviewed: v })} label="Orders Reviewed" />
          <Field label="Allergies">
            <Input value={data.allergies} onChange={e => onChange({ allergies: e.target.value })} placeholder="NKDA" />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Diagnosis">
            <Input value={data.diagnosisText} onChange={e => onChange({ diagnosisText: e.target.value })} placeholder="e.g. CIDP" />
          </Field>
          <Field label="MD / Prescriber">
            <Input value={data.prescriber} onChange={e => onChange({ prescriber: e.target.value })} placeholder="Dr. Name" />
          </Field>
          <Field label="Prescriber Phone">
            <Input value={data.prescriberPhone} onChange={e => onChange({ prescriberPhone: e.target.value })} placeholder="310-000-0000" />
          </Field>
        </div>
      </div>
    </div>
  );
}
