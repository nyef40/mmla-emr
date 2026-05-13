"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type VisitClinician = { name: string | null };

type Visit = {
  id: string | number;
  visitDate: string | Date;
  visitType: string;
  status: string | null;
  formStatus?: string | null;
  clinician?: VisitClinician | null;
};

type Props = {
  visits: Visit[];
  patientId: number;
  userRole?: string;
};

const FORM_STATUS_LABEL: Record<string, string> = {
  draft:            "Pending",
  signed:           "Sent to Office",
  completed:        "Completed",
  needs_correction: "Needs Correction",
  locked:           "Locked",
};

const FORM_STATUS_CLASS: Record<string, string> = {
  draft:            "bg-yellow-50 text-yellow-700 border-yellow-200",
  signed:           "bg-blue-50 text-blue-700 border-blue-200",
  completed:        "bg-green-50 text-green-700 border-green-200",
  needs_correction: "bg-orange-50 text-orange-700 border-orange-200",
  locked:           "bg-gray-100 text-gray-600 border-gray-300",
};

export function VisitsTable({ visits, patientId, userRole }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | number | null>(null);
  const isAdmin = userRole === "admin" || userRole === "staff";

  async function patchStatus(visitId: string | number, action: "complete" | "needs_correction") {
    setBusy(visitId);
    try {
      const res = await fetch(`/api/patients/${patientId}/visits/${visitId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Action failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (visits.length === 0) {
    return <p className="text-sm text-gray-500 py-2">No visits recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="border px-3 py-2 font-semibold">Date</th>
            <th className="border px-3 py-2 font-semibold">Type</th>
            <th className="border px-3 py-2 font-semibold">Clinician</th>
            <th className="border px-3 py-2 font-semibold">Status</th>
            {isAdmin && <th className="border px-3 py-2 font-semibold">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {visits.map(visit => {
            const fs = visit.formStatus ?? "draft";
            const isBusy = busy === visit.id;
            return (
              <tr key={visit.id} className="hover:bg-gray-50 transition-colors">
                <td className="border px-3 py-2">
                  <Link
                    href={`/patients/${patientId}/visits/${visit.id}`}
                    className="text-[#1e5f8a] hover:underline"
                  >
                    {new Date(visit.visitDate).toLocaleDateString()}
                  </Link>
                </td>
                <td className="border px-3 py-2">{visit.visitType}</td>
                <td className="border px-3 py-2">{visit.clinician?.name ?? "—"}</td>
                <td className="border px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${FORM_STATUS_CLASS[fs] ?? FORM_STATUS_CLASS.draft}`}>
                    {FORM_STATUS_LABEL[fs] ?? fs}
                  </span>
                </td>
                {isAdmin && (
                  <td className="border px-3 py-2">
                    <select
                      className="text-xs border rounded px-1.5 py-1 bg-white text-gray-700 disabled:opacity-50"
                      defaultValue=""
                      disabled={isBusy || (fs !== "signed" && fs !== "completed")}
                      onChange={e => {
                        if (!e.target.value) return;
                        const action = e.target.value as "complete" | "needs_correction";
                        e.target.value = "";
                        patchStatus(visit.id, action);
                      }}
                    >
                      <option value="">Select action…</option>
                      {fs === "signed" && (
                        <option value="complete">Move to Completed</option>
                      )}
                      {(fs === "signed" || fs === "completed") && (
                        <option value="needs_correction">Needs Correction</option>
                      )}
                    </select>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
