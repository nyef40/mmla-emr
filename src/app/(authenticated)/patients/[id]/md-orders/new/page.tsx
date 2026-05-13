"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppCard } from "@/components/ui/card";

const DISCIPLINES = ["RN", "LVN", "PT", "OT", "ST", "MSW", "HHA"];

type FreqRow = { discipline: string; frequency: string };

type Patient = {
  id: number;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  physicianName: string | null;
  physicianNpi: string | null;
  physicianPhone: string | null;
  insurancePrimary: { name: string } | null;
};

function emptyRow(): FreqRow {
  return { discipline: "RN", frequency: "" };
}

export default function NewMdOrderPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [orderType, setOrderType] = useState<"verbal" | "non_verbal">("verbal");
  const [verbalReceivedBy, setVerbalReceivedBy] = useState("");
  const [verbalReceivedFrom, setVerbalReceivedFrom] = useState("");
  const [verbalReadBack, setVerbalReadBack] = useState(false);
  const [dateReceived, setDateReceived] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [timeReceived, setTimeReceived] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [freqRows, setFreqRows] = useState<FreqRow[]>([emptyRow()]);
  const [interventions, setInterventions] = useState("");
  const [infusionInterventions, setInfusionInterventions] = useState("");

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.push("/login"); return; }
    if (authStatus !== "authenticated") return;
    // Auto-fill received by with current user's name
    if (session?.user?.name) setVerbalReceivedBy(session.user.name);
  }, [authStatus, session, router]);

  const loadPatient = useCallback(async () => {
    try {
      const res = await fetch(`/api/patients/${patientId}`);
      if (!res.ok) { router.push("/patients"); return; }
      const data = await res.json();
      setPatient(data);
      // Auto-fill physician
      if (data.physicianName) setVerbalReceivedFrom(data.physicianName);
    } finally {
      setLoading(false);
    }
  }, [patientId, router]);

  useEffect(() => {
    if (authStatus === "authenticated") loadPatient();
  }, [authStatus, loadPatient]);

  function addRow() {
    setFreqRows(r => [...r, emptyRow()]);
  }

  function removeRow(i: number) {
    setFreqRows(r => r.filter((_, idx) => idx !== i));
  }

  function updateRow(i: number, field: keyof FreqRow, value: string) {
    setFreqRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  }

  async function handleSubmit(saveStatus: "draft" | "sent_to_md") {
    setError("");
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 0));

    try {
      const body = {
        orderType,
        verbalReceivedBy: orderType === "verbal" ? verbalReceivedBy : null,
        verbalReceivedFrom: orderType === "verbal" ? verbalReceivedFrom : null,
        verbalReadBack: orderType === "verbal" ? verbalReadBack : false,
        dateReceived,
        timeReceived,
        effectiveDate,
        clinicalNotes,
        visitFrequency: freqRows.filter(r => r.frequency.trim()),
        interventions,
        infusionInterventions,
        status: saveStatus,
      };

      const res = await fetch(`/api/patients/${patientId}/md-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "Failed to save order");
        return;
      }

      const created = await res.json();
      router.push(`/patients/${patientId}/md-orders/${created.id}`);
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || authStatus === "loading") {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e5f8a]" />
      </div>
    );
  }

  if (!patient) return null;

  const patientName = `${patient.firstName} ${patient.lastName}`;
  const dob = new Date(patient.dateOfBirth).toLocaleDateString();

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-10">
      {/* Breadcrumb */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/patients" className="hover:underline">Patients</Link>
            <span>/</span>
            <Link href={`/patients/${patientId}`} className="hover:underline">{patientName}</Link>
            <span>/</span>
            <Link href={`/patients/${patientId}/chart`} className="hover:underline">Chart</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">New MD Order</span>
          </div>
          <h1 className="text-xl font-bold">New Physician Order</h1>
        </div>
        <Link
          href={`/patients/${patientId}/chart`}
          className="text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          ← Cancel
        </Link>
      </div>

      {/* Patient Header (read-only) */}
      <AppCard title="Patient Information">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Patient</p>
            <p className="font-medium">{patientName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">MR #</p>
            <p className="font-medium">{patient.patientId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">DOB</p>
            <p className="font-medium">{dob}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Insurance</p>
            <p className="font-medium">{patient.insurancePrimary?.name ?? "—"}</p>
          </div>
          {patient.physicianName && (
            <div className="col-span-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Physician</p>
              <p className="font-medium">
                {patient.physicianName}
                {patient.physicianNpi && <span className="text-gray-400 ml-2">NPI: {patient.physicianNpi}</span>}
                {patient.physicianPhone && <span className="text-gray-400 ml-2">· {patient.physicianPhone}</span>}
              </p>
            </div>
          )}
        </div>
      </AppCard>

      {/* Order Type */}
      <AppCard title="Order Type">
        <div className="flex gap-6">
          {(["verbal", "non_verbal"] as const).map(t => (
            <label key={t} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input
                type="radio"
                name="orderType"
                value={t}
                checked={orderType === t}
                onChange={() => setOrderType(t)}
                className="accent-[#1e5f8a]"
              />
              {t === "verbal" ? "Verbal Order" : "Non-Verbal Order"}
            </label>
          ))}
        </div>

        {orderType === "verbal" && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Received By</label>
              <input
                type="text"
                value={verbalReceivedBy}
                onChange={e => setVerbalReceivedBy(e.target.value)}
                className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e5f8a]"
                placeholder="Nurse name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Received From (Physician)</label>
              <input
                type="text"
                value={verbalReceivedFrom}
                onChange={e => setVerbalReceivedFrom(e.target.value)}
                className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e5f8a]"
                placeholder="Physician name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date Received</label>
              <input
                type="date"
                value={dateReceived}
                onChange={e => setDateReceived(e.target.value)}
                className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e5f8a]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Time Received</label>
              <input
                type="text"
                value={timeReceived}
                onChange={e => setTimeReceived(e.target.value)}
                className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e5f8a]"
                placeholder="e.g. 3:50 PM"
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={verbalReadBack}
                  onChange={e => setVerbalReadBack(e.target.checked)}
                  className="accent-[#1e5f8a] h-4 w-4"
                />
                <span className="font-medium">Verbal order read back and verified</span>
              </label>
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Effective Date</label>
          <input
            type="date"
            value={effectiveDate}
            onChange={e => setEffectiveDate(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e5f8a]"
          />
        </div>
      </AppCard>

      {/* Clinical Notes (Physician Communication) */}
      <AppCard title="Physician Communication / Clinical Notes">
        <textarea
          value={clinicalNotes}
          onChange={e => setClinicalNotes(e.target.value)}
          rows={6}
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e5f8a] resize-y"
          placeholder="Patient diagnosis, clinical history, homebound status, medical necessity..."
        />
      </AppCard>

      {/* Visit Frequency */}
      <AppCard title="Visit Frequency">
        <div className="space-y-2">
          {freqRows.map((row, i) => (
            <div key={i} className="grid grid-cols-[140px_1fr_auto] gap-2 items-center">
              <select
                value={row.discipline}
                onChange={e => updateRow(i, "discipline", e.target.value)}
                className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e5f8a] bg-white"
              >
                {DISCIPLINES.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input
                type="text"
                value={row.frequency}
                onChange={e => updateRow(i, "frequency", e.target.value)}
                className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e5f8a]"
                placeholder="e.g. 2 x week every 3 weeks for 8 weeks starting 04/20/2026"
              />
              {freqRows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="text-red-500 hover:text-red-700 text-lg leading-none px-1"
                  aria-label="Remove row"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addRow}
            className="text-sm text-[#1e5f8a] hover:underline mt-1"
          >
            + Add discipline
          </button>
        </div>
      </AppCard>

      {/* Orders */}
      <AppCard title="Orders">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              Interventions
            </label>
            <textarea
              value={interventions}
              onChange={e => setInterventions(e.target.value)}
              rows={3}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e5f8a] resize-y"
              placeholder="Assessment of all body systems, vital signs, teaching..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              Infusion Therapy Interventions
            </label>
            <textarea
              value={infusionInterventions}
              onChange={e => setInfusionInterventions(e.target.value)}
              rows={3}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e5f8a] resize-y"
              placeholder="e.g. Administer IVIG Gamunex-C 10% 40gm via PIV x 2 days every 3 weeks..."
            />
          </div>
        </div>
      </AppCard>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => handleSubmit("draft")}
          disabled={submitting}
        >
          {submitting ? "Saving…" : "Save as Draft"}
        </Button>
        <Button
          className="bg-[#1e5f8a] hover:bg-[#174f75] text-white"
          onClick={() => handleSubmit("sent_to_md")}
          disabled={submitting}
        >
          {submitting ? "Saving…" : "Save & Send to MD"}
        </Button>
      </div>
    </div>
  );
}
