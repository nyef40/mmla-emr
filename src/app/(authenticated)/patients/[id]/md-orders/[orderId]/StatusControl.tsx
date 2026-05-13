"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "draft" | "sent_to_md" | "signed" | "expired";

const TRANSITIONS: Record<Status, { value: Status; label: string }[]> = {
  draft:      [{ value: "sent_to_md", label: "Mark as Sent to MD" }],
  sent_to_md: [
    { value: "signed",  label: "Mark as Signed" },
    { value: "expired", label: "Mark as Expired" },
  ],
  signed:  [{ value: "expired", label: "Mark as Expired" }],
  expired: [],
};

export function MdOrderStatusControl({
  patientId,
  orderId,
  currentStatus,
}: {
  patientId: number;
  orderId: number;
  currentStatus: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const options = TRANSITIONS[currentStatus as Status] ?? [];
  if (options.length === 0) return null;

  async function update(newStatus: Status) {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/md-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "Update failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Admin: Update Status</h2>
      <div className="flex items-center gap-3 flex-wrap">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => update(opt.value)}
            disabled={busy}
            className="text-sm px-4 py-1.5 rounded-md border border-[#1e5f8a] text-[#1e5f8a] hover:bg-blue-50 disabled:opacity-50"
          >
            {busy ? "Updating…" : opt.label}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
