"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// I-RODS: 24 validated items (Vanhoutte et al.)
const IRODS_ITEMS = [
  "Read a newspaper or a book?",
  "Eat?",
  "Brush your teeth?",
  "Wash the upper part of your body?",
  "Go to the toilet?",
  "Prepare a snack?",
  "Put clothes on your upper body?",
  "Wash the lower part of your body?",
  "Move a chair?",
  "Turn a key in a lock?",
  "Go to the family doctor?",
  "Take a shower?",
  "Do the dishes?",
  "Do the shopping?",
  "Pick up an object (e.g. a ball)?",
  "Bend down to pick up an object?",
  "Climb a flight of stairs?",
  "Travel on public transport?",
  "Walk around obstacles?",
  "Take a walk up to a maximum of 1 km?",
  "Carry a heavy object and place it on the ground?",
  "Dance?",
  "Stand for a long period of time (e.g. several hours)?",
  "Run?",
];

const RESPONSE_OPTIONS = [
  { value: 0, label: "Impossible", sublabel: "Not possible for me" },
  { value: 1, label: "With difficulty", sublabel: "Possible, but with some effort" },
  { value: 2, label: "Easily", sublabel: "Possible, without any difficulty" },
];

const OPTION_STYLE = [
  "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  "border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
  "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
];

const OPTION_SELECTED = [
  "!border-red-400 !bg-red-100 ring-2 ring-red-300",
  "!border-yellow-400 !bg-yellow-100 ring-2 ring-yellow-300",
  "!border-green-400 !bg-green-100 ring-2 ring-green-300",
];

type Patient = {
  id: number;
  patientId: string;
  firstName: string;
  lastName: string;
};

export default function NewIrodsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [assessmentDate, setAssessmentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  // -1 = not answered yet
  const [responses, setResponses] = useState<number[]>(Array(24).fill(-1));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.push("/login"); return; }
  }, [authStatus, router]);

  const loadPatient = useCallback(async () => {
    try {
      const res = await fetch(`/api/patients/${patientId}`);
      if (!res.ok) { router.push("/patients"); return; }
      setPatient(await res.json());
    } finally {
      setLoading(false);
    }
  }, [patientId, router]);

  useEffect(() => {
    if (authStatus === "authenticated") loadPatient();
  }, [authStatus, loadPatient]);

  function setResponse(index: number, value: number) {
    setResponses(prev => prev.map((v, i) => i === index ? value : v));
  }

  const answered = responses.filter(v => v >= 0).length;
  const rawScore = responses.filter(v => v >= 0).reduce((sum, v) => sum + v, 0);
  // Linear approximation of centile — official Rasch centile requires published nomogram
  const centileApprox = answered === 24 ? Math.round((rawScore / 48) * 100) : null;

  const allAnswered = answered === 24;

  async function handleSubmit() {
    if (!allAnswered) {
      setError("Please answer all 24 questions before saving.");
      return;
    }
    setError("");
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 0));

    try {
      const res = await fetch(`/api/patients/${patientId}/irods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentDate, responses, notes }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "Failed to save assessment");
        return;
      }
      const created = await res.json();
      router.push(`/patients/${patientId}/irods/${created.id}`);
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || authStatus === "loading") return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e5f8a]" />
    </div>
  );

  if (!patient) return null;

  const patientName = `${patient.firstName} ${patient.lastName}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
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
            <span className="text-gray-800 font-medium">I-RODS Assessment</span>
          </div>
          <h1 className="text-xl font-bold">I-RODS Disability Scale</h1>
          <p className="text-xs text-gray-500 mt-0.5">Inflammatory Rasch-built Overall Disability Scale · {patientName}</p>
        </div>
        <Link
          href={`/patients/${patientId}/chart`}
          className="text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          ← Cancel
        </Link>
      </div>

      {/* Instructions */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">Instructions</p>
        <p>
          Please rate the patient&apos;s ability to perform each of the following activities over the <strong>past 2 weeks</strong>.
          Each item is scored 0 (impossible), 1 (possible with difficulty), or 2 (easily performed).
        </p>
      </div>

      {/* Date */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Assessment Date</label>
            <input
              type="date"
              value={assessmentDate}
              onChange={e => setAssessmentDate(e.target.value)}
              className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e5f8a]"
            />
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-500">Progress</p>
            <p className="text-lg font-bold text-[#1e5f8a]">{answered} / 24</p>
          </div>
          {answered > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Raw Score</p>
              <p className="text-lg font-bold">{rawScore} / {answered * 2}</p>
            </div>
          )}
        </div>
        <div className="mt-3 h-2 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#1e5f8a] transition-all duration-300"
            style={{ width: `${(answered / 24) * 100}%` }}
          />
        </div>
      </div>

      {/* 24 Items */}
      <div className="space-y-3">
        {IRODS_ITEMS.map((item, i) => {
          const selected = responses[i];
          const answered = selected >= 0;
          return (
            <div
              key={i}
              className={`rounded-lg border bg-white p-4 transition-colors ${answered ? "border-gray-200" : "border-orange-200"}`}
            >
              <p className="text-sm font-medium text-gray-800 mb-3">
                <span className="text-gray-400 font-normal mr-2">{i + 1}.</span>
                Can the patient… <span className="font-semibold">{item}</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {RESPONSE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setResponse(i, opt.value)}
                    className={`
                      rounded-md border px-3 py-2 text-xs font-medium transition-all text-left
                      ${OPTION_STYLE[opt.value]}
                      ${selected === opt.value ? OPTION_SELECTED[opt.value] : ""}
                    `}
                  >
                    <span className="block font-bold">{opt.value} — {opt.label}</span>
                    <span className="block text-[10px] opacity-75 mt-0.5">{opt.sublabel}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label className="block text-xs font-semibold text-gray-600 mb-2">Clinical Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e5f8a] resize-y"
          placeholder="Additional clinical observations…"
        />
      </div>

      {/* Running score summary */}
      {allAnswered && (
        <div className="rounded-lg border border-[#1e5f8a] bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1e5f8a] mb-2">Score Summary</p>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-[#1e5f8a]">{rawScore}</p>
              <p className="text-xs text-gray-600 mt-0.5">Raw Score (0–48)</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#1e5f8a]">{centileApprox}</p>
              <p className="text-xs text-gray-600 mt-0.5">Centile (approx. 0–100)</p>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            Centile shown is a linear approximation. Official Rasch centile conversion requires the published I-RODS nomogram (Vanhoutte et al.).
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Link
          href={`/patients/${patientId}/chart`}
          className="text-sm px-4 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !allAnswered}
          className="bg-[#1e5f8a] hover:bg-[#174f75] text-white disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save Assessment"}
        </Button>
      </div>
    </div>
  );
}
