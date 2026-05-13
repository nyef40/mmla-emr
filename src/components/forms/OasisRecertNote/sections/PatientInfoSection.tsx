"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OasisHeader, OasisPatientTracking, OasisClinicalRecord } from "../types";

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

type Props = {
  header: OasisHeader;
  patientTracking: OasisPatientTracking;
  clinicalRecord: OasisClinicalRecord;
  patientName: string;
  patientMRN: string;
  patientDOB: string;
  visitDate: string;
  onHeaderChange: (u: Partial<OasisHeader>) => void;
  onTrackingChange: (u: Partial<OasisPatientTracking>) => void;
  onClinicalChange: (u: Partial<OasisClinicalRecord>) => void;
};

export function PatientInfoSection({
  header, patientTracking, clinicalRecord,
  patientName, patientMRN, visitDate,
  onHeaderChange, onTrackingChange, onClinicalChange,
}: Props) {
  const pt = patientTracking;

  return (
    <div className="space-y-4">
      {/* Agency header */}
      <div className="text-center border-b pb-3">
        <p className="font-bold text-base">OASIS NURSE RECERTIFICATION VISIT NOTE</p>
        <p className="text-sm text-gray-600">Mobile Medical LA, LLC · 6818 S. La Cienega Blvd 203 · Inglewood, CA 90302-1560</p>
        <p className="text-sm text-gray-600">Phone: (213) 545-6652 · Fax: (877) 845-6050</p>
      </div>

      {/* Visit meta row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-b pb-3">
        <div><span className="font-semibold">Patient:</span> {patientName}</div>
        <div><span className="font-semibold">MR#:</span> {patientMRN}</div>
        <div><span className="font-semibold">Visit Date:</span> {visitDate}</div>
      </div>

      {/* Visit logistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Time In">
          <Input type="time" value={header.timeIn} onChange={e => onHeaderChange({ timeIn: e.target.value })} />
        </Field>
        <Field label="Time Out">
          <Input type="time" value={header.timeOut} onChange={e => onHeaderChange({ timeOut: e.target.value })} />
        </Field>
        <Field label="Episode #">
          <Input value={header.episodeNumber} onChange={e => onHeaderChange({ episodeNumber: e.target.value })} placeholder="e.g. 2" />
        </Field>
        <Field label="Assessment Reason (M0100)">
          <select
            value={header.assessmentReasonCode}
            onChange={e => onHeaderChange({ assessmentReasonCode: e.target.value })}
            className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]"
          >
            <option value="04">04 – Recertification Assessment</option>
            <option value="05">05 – Other Follow-Up</option>
          </select>
        </Field>
        <Field label="Cert Period From">
          <Input type="date" value={header.certPeriodFrom} onChange={e => onHeaderChange({ certPeriodFrom: e.target.value })} />
        </Field>
        <Field label="Cert Period To">
          <Input type="date" value={header.certPeriodTo} onChange={e => onHeaderChange({ certPeriodTo: e.target.value })} />
        </Field>
      </div>

      {/* Clinical Record Info */}
      <Sub title="Clinical Record Info (M0080 / M0090)">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Discipline (M0080)">
            <select
              value={clinicalRecord.discipline}
              onChange={e => onClinicalChange({ discipline: e.target.value as OasisClinicalRecord["discipline"] })}
              className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]"
            >
              <option value="RN">RN</option>
              <option value="PT">PT</option>
              <option value="SLP">SLP</option>
              <option value="OT">OT</option>
            </select>
          </Field>
          <Field label="Assessment Date (M0090)">
            <Input type="date" value={clinicalRecord.assessmentDate} onChange={e => onClinicalChange({ assessmentDate: e.target.value })} />
          </Field>
        </div>
      </Sub>

      {/* Patient Tracking */}
      <Sub title="Patient Tracking (M0010 – M0150)">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="CMS Cert # (M0010)">
            <Input value={pt.cmsCertNumber} onChange={e => onTrackingChange({ cmsCertNumber: e.target.value })} />
          </Field>
          <Field label="Branch State (M0014)">
            <Input value={pt.branchState} onChange={e => onTrackingChange({ branchState: e.target.value })} placeholder="CA" />
          </Field>
          <Field label="Physician NPI (M0018)">
            <Input value={pt.physicianNpi} onChange={e => onTrackingChange({ physicianNpi: e.target.value })} />
          </Field>
          <Field label="Patient ID (M0020)">
            <Input value={pt.patientIdNumber} onChange={e => onTrackingChange({ patientIdNumber: e.target.value })} />
          </Field>
          <Field label="SOC Date (M0030)">
            <Input type="date" value={pt.socDate} onChange={e => onTrackingChange({ socDate: e.target.value })} />
          </Field>
          <Field label="Patient State (M0050)">
            <Input value={pt.patientState} onChange={e => onTrackingChange({ patientState: e.target.value })} placeholder="CA" />
          </Field>
          <Field label="ZIP Code (M0060)">
            <Input value={pt.patientZip} onChange={e => onTrackingChange({ patientZip: e.target.value })} />
          </Field>
          <div className="space-y-1">
            <Field label="Medicare # (M0063)">
              <Input value={pt.medicareNumber} onChange={e => onTrackingChange({ medicareNumber: e.target.value })} disabled={pt.medicareNA} />
            </Field>
            <CB checked={pt.medicareNA} onChange={v => onTrackingChange({ medicareNA: v })} label="N/A" />
          </div>
          <div className="space-y-1">
            <Field label="Medicaid # (M0065)">
              <Input value={pt.medicaidNumber} onChange={e => onTrackingChange({ medicaidNumber: e.target.value })} disabled={pt.medicaidNA} />
            </Field>
            <CB checked={pt.medicaidNA} onChange={v => onTrackingChange({ medicaidNA: v })} label="N/A" />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Sex (A0810)</p>
          <div className="flex gap-4">
            {(["male", "female"] as const).map(s => (
              <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" checked={pt.sex === s} onChange={() => onTrackingChange({ sex: s })} className="h-3.5 w-3.5" />
                <span className="capitalize">{s}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">Payment Sources (M0150)</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <CB checked={pt.paymentMedicare}    onChange={v => onTrackingChange({ paymentMedicare: v })}    label="Medicare" />
            <CB checked={pt.paymentMedicareAdv} onChange={v => onTrackingChange({ paymentMedicareAdv: v })} label="Medicare Advantage" />
            <CB checked={pt.paymentMedicaid}    onChange={v => onTrackingChange({ paymentMedicaid: v })}    label="Medicaid" />
            <CB checked={pt.paymentMedicaidHMO} onChange={v => onTrackingChange({ paymentMedicaidHMO: v })} label="Medicaid HMO" />
            <CB checked={pt.paymentWorkersComp} onChange={v => onTrackingChange({ paymentWorkersComp: v })} label="Workers Comp" />
            <CB checked={pt.paymentTitle}       onChange={v => onTrackingChange({ paymentTitle: v })}       label="Title V / XVIII" />
            <CB checked={pt.paymentOtherGov}    onChange={v => onTrackingChange({ paymentOtherGov: v })}   label="Other Gov" />
            <CB checked={pt.paymentPrivate}     onChange={v => onTrackingChange({ paymentPrivate: v })}    label="Private" />
            <CB checked={pt.paymentPrivateHMO}  onChange={v => onTrackingChange({ paymentPrivateHMO: v })} label="Private HMO" />
            <CB checked={pt.paymentSelfPay}     onChange={v => onTrackingChange({ paymentSelfPay: v })}    label="Self Pay" />
            <div className="col-span-2 flex items-center gap-2">
              <span className="text-sm text-gray-600">Other:</span>
              <Input
                value={pt.paymentOther}
                onChange={e => onTrackingChange({ paymentOther: e.target.value })}
                placeholder="specify"
                className="h-7 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Field label="Resumption of Care Date (M0032)">
              <Input type="date" value={pt.resumptionDate} onChange={e => onTrackingChange({ resumptionDate: e.target.value })} disabled={pt.resumptionNA} />
            </Field>
            <CB checked={pt.resumptionNA} onChange={v => onTrackingChange({ resumptionNA: v })} label="N/A – Not applicable" />
          </div>
        </div>
      </Sub>
    </div>
  );
}
