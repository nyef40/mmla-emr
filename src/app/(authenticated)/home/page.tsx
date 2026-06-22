"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Settings,
  BarChart2,
  BookOpen,
  FileBarChart,
  Users,
  FileText,
} from "lucide-react";
import type { Role } from "@/lib/authorize";

const L = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="block py-1 text-[#1a6fa5] text-sm hover:underline">
    {children}
  </Link>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="font-semibold text-gray-800 text-xs uppercase tracking-wide mt-3 mb-0.5 first:mt-0">{children}</p>
);

const sharedForms = [
  { label: "Care Coordination Note", href: "/admin/forms-overview#shared-care-coordination" },
  { label: "Inter-Office Communication Note", href: "/admin/forms-overview#shared-interoffice" },
  { label: "Medication Profile", href: "/admin/forms-overview#shared-medication" },
];
const officeForms = [
  { label: "Visit Note", href: "/admin/forms-overview#office-visit" },
  { label: "Assessment", href: "/admin/forms-overview#office-assessment" },
  { label: "Care Plan", href: "/admin/forms-overview#office-care-plan" },
];
const physicianForms = [
  { label: "Face to Face", href: "/admin/forms-overview#physician-f2f" },
  { label: "Certification", href: "/admin/forms-overview#physician-cert" },
];

// ── OASIS Forms ─────────────────────────────────────────────────────────────
const OASIS_FORMS: { name: string; developed: boolean; visitType?: string }[] = [
  { name: "OASIS Nurse Recertification",      developed: true,  visitType: "SN Recert Visit" },
  { name: "OASIS Nurse Resumption of Care",   developed: false },
  { name: "OASIS Nurse Other Follow Up",      developed: false },
  { name: "OASIS Discharge",                  developed: false },
  { name: "OASIS Discharge Non-Visit",        developed: false },
  { name: "OASIS Transfer/Death",             developed: false },
  { name: "OASIS Transfer Non-Visit",         developed: false },
];

// ── Clinical Forms ───────────────────────────────────────────────────────────
const CLINICAL_FORMS: { name: string; developed: boolean; visitType?: string }[] = [
  { name: "30 DAY PROGRESS NOTE",                                       developed: false },
  { name: "60 Day Progress Note",                                        developed: false },
  { name: "I-RODS Disability Scale",                                     developed: true,  visitType: "I-RODS DISABILITY SCALE" },
  { name: "Advance Beneficiary Notice of Noncoverage (ABN)",             developed: false },
  { name: "Braden Scale",                                                developed: false },
  { name: "Change in Patient's Primary Caregiver/Representative",        developed: false },
  { name: "Clinical Summary",                                            developed: false },
  { name: "Detailed Explanation of Non-Coverage (DENC)",                 developed: false },
  { name: "Diagnosis Code Addendum",                                     developed: false },
  { name: "Fall Risk Assessment/Reassessment",                           developed: false },
  { name: "Home Health Eligibility Certification",                       developed: false },
  { name: "Infection Control Report",                                    developed: false },
  { name: "Medicaid Physician Face to Face Encounter",                   developed: false },
  { name: "Pediatric Assessment",                                        developed: false },
  { name: "Pediatric Assessment - ROC",                                  developed: false },
  { name: "Pediatric Assessment - Recert",                               developed: false },
  { name: "Pediatric Visit Note",                                        developed: false },
  { name: "Physician Face to Face Encounter",                            developed: false },
  { name: "Physician Orders",                                            developed: false },
  { name: "Report of Incident",                                          developed: false },
  { name: "Skilled Nurse Discharge Summary",                             developed: false },
  { name: "SKILLED NURSE INFUSION VISIT NOTE",                          developed: true, visitType: "SKILLED NURSE INFUSION VISIT NOTE" },
  { name: "Skilled Nurse Patient Missed Visit",                          developed: false },
  { name: "Skilled Nurse Patient Transfer/Referral",                     developed: false },
  { name: "Skilled Nurse Supervisory Visit",                             developed: false },
  { name: "Skilled Nurse Visit Note",                                    developed: false },
  { name: "Wound Care Addendum",                                         developed: false },
  { name: "Opioid Risk Tool",                                            developed: false },
  { name: "Vaccine Administration Record",                               developed: false },
  { name: "Adult Nursing Evaluation & Care Plan",                        developed: false },
];

// ── Shared Forms ─────────────────────────────────────────────────────────────
const SHARED_FORMS: { name: string; developed: boolean; visitType?: string }[] = [
  { name: "Care Coordination Note",          developed: false },
  { name: "Inter-Office Communication Note", developed: false },
  { name: "Medication Profile",              developed: false },
];

// ── Form list column component ────────────────────────────────────────────────
function FormColumn({
  heading,
  forms,
  selectedPatientId,
  onDeveloped,
  onUndeveloped,
}: {
  heading: string;
  forms: { name: string; developed: boolean; visitType?: string }[];
  selectedPatientId: string;
  onDeveloped: (visitType: string) => void;
  onUndeveloped: () => void;
}) {
  return (
    <div className="min-w-0">
      <p className="font-bold text-[10px] uppercase tracking-widest text-gray-500 mb-2 pb-1 border-b border-gray-200">
        {heading}
      </p>
      <ul className="space-y-0.5">
        {forms.map(({ name, developed, visitType }) => {
          if (developed) {
            return (
              <li key={name}>
                <button
                  onClick={() => selectedPatientId ? onDeveloped(visitType!) : onUndeveloped()}
                  className="text-left text-xs text-[#1a6fa5] hover:underline w-full py-0.5 leading-snug"
                >
                  {name}
                </button>
              </li>
            );
          }
          return (
            <li key={name}>
              <span className="block text-xs text-gray-400 py-0.5 leading-snug">{name}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [totalPatients, setTotalPatients] = useState(0);
  const [patients, setPatients] = useState<{ id: number; patientId: string; firstName: string; lastName: string }[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [noPatientMsg, setNoPatientMsg] = useState(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/patients?limit=500")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setPatients(d.data ?? []); setTotalPatients(d.pagination?.total ?? d.data?.length ?? 0); } })
      .catch(() => {});
  }, []);

  const role = (session?.user?.role ?? "staff") as Role;
  const isAdmin = role === "admin";
  const isPt    = role === "pt";
  const isRn    = role === "rn";

  function showNoPatient() {
    setNoPatientMsg(true);
    setTimeout(() => setNoPatientMsg(false), 2000);
  }

  async function openDevelopedForm(visitType: string) {
    if (!selectedPatientId) { showNoPatient(); return; }
    setOpening(true);
    try {
      const res = await fetch(`/api/patients/${selectedPatientId}/visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitType }),
      });
      if (res.ok) {
        const visit = await res.json();
        router.push(`/patients/${selectedPatientId}/visits/${visit.id}`);
      }
    } finally {
      setOpening(false);
    }
  }

  if (status === "loading") return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e5f8a]" />
    </div>
  );

  // ── RN layout: vertical two-section ────────────────────────────────────────
  if (isRn) {
    return (
      <div className="flex flex-col gap-4">

        {/* ── 1. Patients: compact top section ── */}
        <AppCard title="Patients" icon={<Users className="h-4 w-4" />}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <span className="text-xs text-gray-500 shrink-0">Select patient:</span>
            <select
              className="w-full sm:flex-1 h-8 rounded border border-gray-300 bg-white px-2 text-sm text-gray-700 min-w-0"
              value={selectedPatientId}
              onChange={e => setSelectedPatientId(e.target.value)}
            >
              <option value="">— select patient —</option>
              {patients.map(p => (
                <option key={p.id} value={String(p.id)}>
                  {p.lastName}, {p.firstName} — {p.patientId}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              className="h-8 bg-[#1e5f8a] hover:bg-[#174f75] text-white text-xs px-3 shrink-0 w-full sm:w-auto"
              disabled={!selectedPatientId}
              onClick={() => selectedPatientId && router.push(`/patients/${selectedPatientId}`)}
            >
              Go
            </Button>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3">
            {[
              { label: "Patient Profile",  path: "" },
              { label: "Patient Chart",    path: "/chart" },
              { label: "Patient Schedule", path: "/schedule" },
            ].map(({ label, path }) => (
              <Link
                key={label}
                href={selectedPatientId ? `/patients/${selectedPatientId}${path}` : "#"}
                className={`text-sm ${
                  selectedPatientId
                    ? "text-[#1a6fa5] hover:underline"
                    : "text-gray-300 pointer-events-none"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </AppCard>

        {/* ── 2. Forms: main bottom section ── */}
        <AppCard title="Forms" icon={<FileText className="h-4 w-4" />}>
          {/* "Please select a patient" toast */}
          <div className={`mb-3 px-3 py-2 bg-orange-50 border border-orange-200 rounded text-orange-700 text-sm text-center transition-opacity duration-300 ${noPatientMsg ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            Please select a patient
          </div>

          {opening && (
            <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm text-center">
              Opening form…
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[160px_1fr_160px] gap-4 md:gap-0 md:divide-x divide-gray-100">
            {/* OASIS Forms */}
            <div className="md:pr-5">
              <FormColumn
                heading="OASIS Forms"
                forms={OASIS_FORMS}
                selectedPatientId={selectedPatientId}
                onDeveloped={openDevelopedForm}
                onUndeveloped={showNoPatient}
              />
            </div>

            {/* Clinical Forms */}
            <div className="md:px-5">
              <p className="font-bold text-[10px] uppercase tracking-widest text-gray-500 mb-2 pb-1 border-b border-gray-200">
                Clinical Forms
              </p>
              <ul className="columns-1 sm:columns-2 gap-x-6 space-y-0">
                {CLINICAL_FORMS.map(({ name, developed, visitType }) => {
                  if (developed) {
                    return (
                      <li key={name} className="break-inside-avoid">
                        <button
                          onClick={() => selectedPatientId ? openDevelopedForm(visitType!) : showNoPatient()}
                          className="text-left text-xs text-[#1a6fa5] hover:underline w-full py-0.5 leading-snug"
                        >
                          {name}
                        </button>
                      </li>
                    );
                  }
                  return (
                    <li key={name} className="break-inside-avoid">
                      <span className="block text-xs text-gray-400 py-0.5 leading-snug">{name}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Shared Forms */}
            <div className="md:pl-5">
              <FormColumn
                heading="Shared Forms"
                forms={SHARED_FORMS}
                selectedPatientId={selectedPatientId}
                onDeveloped={openDevelopedForm}
                onUndeveloped={showNoPatient}
              />
            </div>
          </div>
        </AppCard>

      </div>
    );
  }

  // ── Admin / Staff layout: existing 3-column grid ────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1.4fr] gap-3 items-start">

      {/* ── Column 1: Administrative + Libraries ── */}
      <div className="flex flex-col gap-3">

        {isAdmin && (
          <AppCard title="Administrative" icon={<Settings className="h-4 w-4" />}>
            <SectionLabel>Billing</SectionLabel>
            <L href="/admin/billing">Billing Module</L>

            <SectionLabel>Audit Logs</SectionLabel>
            <L href="/admin/audit">User / Patient Log</L>
            <L href="/admin/audit">Integration Log</L>

            <SectionLabel>Other Administrative</SectionLabel>
            <L href="/admin/upload">Upload Documents</L>
            <L href="/admin/forms-overview">Menus Overview</L>
          </AppCard>
        )}

        {!isPt && !isRn && (
          <AppCard title="Libraries" icon={<BookOpen className="h-4 w-4" />}>
            <L href="/admin/users">Users</L>
            <L href="/patients">Patients</L>
            <L href="/libraries/insurance">Insurance</L>
            <L href="/libraries/physician">Physician</L>
            <L href="/libraries/referrer">Referrer</L>
            <L href="/libraries/pharmacy">Pharmacy & DME</L>
            <L href="/libraries/icd-codes">ICD-10 Codes</L>
            <L href="/libraries/billing-codes">Billing Codes</L>
          </AppCard>
        )}
      </div>

      {/* ── Column 2: Dashboard + Custom Reports ── */}
      <div className="flex flex-col gap-3">

        {!isPt && !isRn && (
          <AppCard title="Dashboard" icon={<BarChart2 className="h-4 w-4" />}>
            <L href="/dashboard/reports/online-activity">View Online Activity</L>
            <L href="/dashboard/reports/analytics">Analytics Dashboard</L>
            <L href="/dashboard/reports/patient-dashboard">Patient Dashboard</L>
            <L href="/dashboard/reports/episode-summary">Episode Summary</L>
            <L href="/dashboard/reports/patient-activity">Patient Activity</L>
          </AppCard>
        )}

        {!isPt && !isRn && (
          <AppCard title="Custom Reports" icon={<FileBarChart className="h-4 w-4" />}>
            <L href="/dashboard/reports/online-activity">View Online Activity</L>
            <L href="/dashboard/reports/analytics">Analytics Dashboard</L>
            <L href="/dashboard/reports/patient-dashboard">Patient Dashboard</L>
            <L href="/dashboard/reports/episode-summary">Episode Summary</L>
            <L href="/dashboard/reports/patient-activity">Patient Activity</L>
          </AppCard>
        )}
      </div>

      {/* ── Column 3: Patients (full height, most important) ── */}
      <AppCard
        title="Patients"
        icon={<Users className="h-4 w-4" />}
        titleAction={
          <Button
            asChild
            size="sm"
            className="h-6 text-xs bg-white/20 hover:bg-white/30 text-white border border-white/40"
            variant="outline"
          >
            <Link href="/patients/new">+ New Patient</Link>
          </Button>
        }
      >
        <p className="text-xs text-gray-500 mb-2">Select an existing patient, then click a link.</p>

        {/* Patient dropdown + Go */}
        <div className="flex gap-2 mb-4">
          <select
            className="flex-1 h-8 rounded border border-gray-300 bg-white px-2 text-sm text-gray-700"
            value={selectedPatientId}
            onChange={e => setSelectedPatientId(e.target.value)}
          >
            <option value="">— select patient —</option>
            {patients.map(p => (
              <option key={p.id} value={String(p.id)}>
                {p.lastName}, {p.firstName} — {p.patientId}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            className="h-8 bg-[#1e5f8a] hover:bg-[#174f75] text-white text-xs px-3"
            disabled={!selectedPatientId}
            onClick={() => selectedPatientId && router.push(`/patients/${selectedPatientId}`)}
          >
            Go
          </Button>
        </div>

        {/* Patient quick-action links */}
        <div className="grid grid-cols-2 gap-x-4 mb-4">
          {[
            { label: "Patient Profile",        path: "" },
            { label: "Patient Chart",          path: "/chart" },
            { label: "Assign Staff to Patient", path: "" },
            { label: "Patient Schedule",       path: "/schedule" },
          ].map(({ label, path }) => (
            <Link
              key={label}
              href={selectedPatientId ? `/patients/${selectedPatientId}${path}` : "#"}
              className={`block py-1 text-sm ${selectedPatientId ? "text-[#1a6fa5] hover:underline" : "text-gray-300 pointer-events-none"}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="border-t pt-3 space-y-3">
          <div>
            <SectionLabel>Infusion Forms</SectionLabel>
            <Link
              href={selectedPatientId ? `/patients/${selectedPatientId}/visits/new` : "#"}
              className={`block py-1 text-sm font-medium ${selectedPatientId ? "text-[#1a6fa5] hover:underline" : "text-gray-300 pointer-events-none"}`}
            >
              SN Infusion Visit Note
            </Link>
          </div>

          <div>
            <SectionLabel>Physician Forms</SectionLabel>
            <Link
              href={selectedPatientId ? `/patients/${selectedPatientId}/md-orders/new` : "#"}
              className={`block py-1 text-sm font-medium ${selectedPatientId ? "text-[#1a6fa5] hover:underline" : "text-gray-300 pointer-events-none"}`}
            >
              Physician Order
            </Link>
            {physicianForms.map(f => <L key={f.href} href={f.href}>{f.label}</L>)}
          </div>

          <div>
            <SectionLabel>Shared Forms</SectionLabel>
            {sharedForms.map(f => <L key={f.href} href={f.href}>{f.label}</L>)}
          </div>

          <div>
            <SectionLabel>Office Forms</SectionLabel>
            <Link
              href={selectedPatientId ? `/patients/${selectedPatientId}/irods/new` : "#"}
              className={`block py-1 text-sm font-medium ${selectedPatientId ? "text-[#1a6fa5] hover:underline" : "text-gray-300 pointer-events-none"}`}
            >
              I-RODS Disability Scale
            </Link>
            {officeForms.map(f => <L key={f.href} href={f.href}>{f.label}</L>)}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t flex items-center justify-between">
          <span className="text-xs text-gray-500">{totalPatients} active patients</span>
          <Link href="/patients" className="flex items-center gap-1 text-xs text-[#1a6fa5] hover:underline">
            <Users className="h-3.5 w-3.5" />
            Patient Management
          </Link>
        </div>
      </AppCard>
    </div>
  );
}
