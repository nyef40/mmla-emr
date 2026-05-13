"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";

const VISIT_TYPES = ["SN Infusion", "SN Recert Visit", "SN Assessment", "SN Wound Care", "SN Medication Teaching"];

export function NewVisitDialog({ patientId }: { patientId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [visitType, setVisitType] = useState("SN Infusion");
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/patients/${patientId}/visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitType, visitDate }),
      });
      if (!res.ok) throw new Error(await res.text());
      const visit = await res.json();
      router.push(`/patients/${patientId}/visits/${visit.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create visit");
      setCreating(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" size="sm" className="bg-[#1e5f8a] hover:bg-[#174f75] text-white" onClick={() => setOpen(true)}>
        <PlusCircle className="h-3.5 w-3.5 mr-1" /> New Visit
      </Button>
    );
  }

  return (
    <div className="border rounded-md p-4 bg-gray-50 space-y-4">
      <p className="font-semibold text-sm">New Visit</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Visit Date</Label>
          <Input
            type="date"
            value={visitDate}
            onChange={e => setVisitDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Visit Type</Label>
          <select
            value={visitType}
            onChange={e => setVisitType(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]"
          >
            {VISIT_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          className="bg-[#1e5f8a] hover:bg-[#174f75] text-white"
          onClick={create}
          disabled={creating || !visitDate}
        >
          {creating ? "Creating…" : "Start Visit"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={creating}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
