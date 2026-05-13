import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Diagnosis = { description: string; icdCode: string; date: string };
type Insurance = { name: string; policyNumber: string; groupNumber: string; category: string; authRequired: boolean };

type Patient = {
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | Date;
  gender: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  allergies?: string | null;
  medications?: string | null;
  bloodType?: string | null;
  isActive?: boolean | null;
  socDate?: string | null;
  admissionStatus?: string | null;
  codeStatus?: string | null;
  primaryDiagnosis?: Diagnosis | null;
  otherDiagnoses?: Diagnosis[] | null;
  insurancePrimary?: Insurance | null;
  insuranceSecondary?: Insurance | null;
  physicianName?: string | null;
  physicianPhone?: string | null;
  physicianNpi?: string | null;
};

export function PatientSummary({ patient: p }: { patient: Patient }) {
  return (
    <div className="space-y-4">
      {/* Demographics */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-3 uppercase tracking-wide text-gray-500">Demographics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <Row label="MRN">{p.patientId}</Row>
          <Row label="DOB">{new Date(p.dateOfBirth).toLocaleDateString()}</Row>
          <Row label="Gender" className="capitalize">{p.gender}</Row>
          <Row label="Blood Type">{p.bloodType || "—"}</Row>
          <Row label="Phone">{p.phone || "—"}</Row>
          <Row label="Email">{p.email || "—"}</Row>
          {p.address && <Row label="Address" className="md:col-span-2">{p.address}</Row>}
          <Row label="Allergies"><span className={p.allergies && p.allergies !== "NKDA" ? "text-red-700 font-medium" : ""}>{p.allergies || "—"}</span></Row>
          {p.medications && <Row label="Medications" className="md:col-span-2">{p.medications}</Row>}
        </div>
      </Card>

      {/* Admission */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-3 uppercase tracking-wide text-gray-500">Admission</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <Row label="SOC Date">{p.socDate ? new Date(p.socDate).toLocaleDateString() : "—"}</Row>
          <Row label="Status">
            <Badge variant={p.admissionStatus === "admitted" ? "default" : "secondary"} className="text-xs capitalize">
              {p.admissionStatus ?? "—"}
            </Badge>
          </Row>
          <Row label="Code Status">
            <span className={p.codeStatus === "dnr" ? "text-red-700 font-semibold" : ""}>
              {p.codeStatus === "full_code" ? "Full Code" : p.codeStatus === "dnr" ? "DNR" : "—"}
            </span>
          </Row>
        </div>
      </Card>

      {/* Diagnoses */}
      {(p.primaryDiagnosis || (p.otherDiagnoses && p.otherDiagnoses.length > 0)) && (
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3 uppercase tracking-wide text-gray-500">Diagnoses</h3>
          {p.primaryDiagnosis && (
            <div className="mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase">Primary</span>
              <p className="text-sm">{p.primaryDiagnosis.description} <span className="font-mono text-xs text-[#1e5f8a]">({p.primaryDiagnosis.icdCode})</span></p>
            </div>
          )}
          {p.otherDiagnoses && p.otherDiagnoses.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Other</span>
              <ul className="space-y-1 mt-1">
                {p.otherDiagnoses.map((dx, i) => (
                  <li key={i} className="text-sm">{dx.description} <span className="font-mono text-xs text-[#1e5f8a]">({dx.icdCode})</span></li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Physician */}
      {p.physicianName && (
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3 uppercase tracking-wide text-gray-500">Primary Physician</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <Row label="Name">{p.physicianName}</Row>
            {p.physicianPhone && <Row label="Phone">{p.physicianPhone}</Row>}
            {p.physicianNpi && <Row label="NPI #">{p.physicianNpi}</Row>}
          </div>
        </Card>
      )}

      {/* Insurance */}
      {p.insurancePrimary && (
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3 uppercase tracking-wide text-gray-500">Insurance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <Row label="Primary">{p.insurancePrimary.name}</Row>
            <Row label="Category">{p.insurancePrimary.category}</Row>
            <Row label="Policy #">{p.insurancePrimary.policyNumber}</Row>
            {p.insurancePrimary.groupNumber && <Row label="Group #">{p.insurancePrimary.groupNumber}</Row>}
            {p.insuranceSecondary?.name && <>
              <Row label="Secondary" className="md:col-span-2">{p.insuranceSecondary.name} — {p.insuranceSecondary.policyNumber}</Row>
            </>}
          </div>
        </Card>
      )}
    </div>
  );
}

function Row({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex gap-2 ${className ?? ""}`}>
      <span className="font-semibold text-gray-500 w-24 shrink-0">{label}:</span>
      <span>{children}</span>
    </div>
  );
}
