"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

type BillingCode = {
  id: number;
  code: string;
  description: string;
  rate: string | null;
  rateType: "per_hour" | "per_visit" | null;
  displayOrder: number;
};

const RATE_TYPE_LABELS: Record<string, string> = {
  per_hour:  "/ hr",
  per_visit: "/ visit",
};

export default function BillingCodesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [codes, setCodes] = useState<BillingCode[]>([]);
  const [loading, setLoading] = useState(true);

  const [newCode,     setNewCode]     = useState("");
  const [newDesc,     setNewDesc]     = useState("");
  const [newRate,     setNewRate]     = useState("");
  const [newRateType, setNewRateType] = useState<"per_hour" | "per_visit">("per_hour");
  const [newOrder,    setNewOrder]    = useState("");
  const [adding,      setAdding]      = useState(false);
  const [addError,    setAddError]    = useState<string | null>(null);
  const [deletingId,  setDeletingId]  = useState<number | null>(null);

  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/libraries/billing-codes")
      .then(r => r.json())
      .then(setCodes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch("/api/libraries/billing-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode,
          description: newDesc,
          rate: newRate ? parseFloat(newRate) : null,
          rateType: newRate ? newRateType : null,
          displayOrder: newOrder ? parseInt(newOrder, 10) : 99,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setAddError(err.error ?? "Failed to add");
        return;
      }
      const added: BillingCode = await res.json();
      setCodes(prev => [...prev, added].sort((a, b) => a.displayOrder - b.displayOrder));
      setNewCode("");
      setNewDesc("");
      setNewRate("");
      setNewOrder("");
    } catch {
      setAddError("Network error");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: number, code: string) {
    if (!confirm(`Remove billing code "${code}"? It will no longer appear in new visit notes.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/libraries/billing-codes/${id}`, { method: "DELETE" });
      if (!res.ok) { alert("Delete failed"); return; }
      setCodes(prev => prev.filter(c => c.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  if (status === "loading" || loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e5f8a]" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing Codes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            CPT codes available for visit notes and charge load
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/libraries">← Libraries</Link>
        </Button>
      </div>

      {/* Code table */}
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#1e5f8a] text-white text-left">
              <th className="px-4 py-2.5 font-medium w-12">#</th>
              <th className="px-4 py-2.5 font-medium w-28">Code</th>
              <th className="px-4 py-2.5 font-medium">Description</th>
              <th className="px-4 py-2.5 font-medium w-28 text-right">Rate</th>
              <th className="px-4 py-2.5 font-medium w-24">Type</th>
              {isAdmin && <th className="px-4 py-2.5 font-medium w-20 text-center">Remove</th>}
            </tr>
          </thead>
          <tbody>
            {codes.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-4 py-6 text-center text-gray-400">
                  No billing codes defined.
                </td>
              </tr>
            )}
            {codes.map(c => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-400 text-xs">{c.displayOrder}</td>
                <td className="px-4 py-2.5 font-mono font-semibold">{c.code}</td>
                <td className="px-4 py-2.5 text-gray-700">{c.description}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {c.rate ? `$${parseFloat(c.rate).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500">
                  {c.rateType ? RATE_TYPE_LABELS[c.rateType] : <span className="text-gray-300">—</span>}
                </td>
                {isAdmin && (
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => handleDelete(c.id, c.code)}
                      disabled={deletingId === c.id}
                      className="text-red-500 hover:text-red-700 disabled:opacity-40"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add form — admin only */}
      {isAdmin && (
        <div className="border rounded-md p-4 bg-gray-50 space-y-4">
          <p className="font-semibold text-sm">Add Billing Code</p>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">CPT Code</Label>
              <Input
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
                placeholder="e.g. G0151"
                required
                className="w-28"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="e.g. PT Visit"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Rate ($)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={newRate}
                onChange={e => setNewRate(e.target.value)}
                placeholder="400.00"
                className="w-28"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <select
                value={newRateType}
                onChange={e => setNewRateType(e.target.value as "per_hour" | "per_visit")}
                className="border rounded px-2 py-2 text-sm h-10"
              >
                <option value="per_hour">Per Hour</option>
                <option value="per_visit">Per Visit</option>
              </select>
            </div>
            <div className="space-y-1 w-20">
              <Label className="text-xs">Order</Label>
              <Input
                type="number"
                value={newOrder}
                onChange={e => setNewOrder(e.target.value)}
                placeholder="99"
                min={1}
              />
            </div>
            <Button
              type="submit"
              disabled={adding}
              className="bg-[#1e5f8a] hover:bg-[#174f75] text-white"
            >
              {adding ? "Adding…" : "Add"}
            </Button>
          </form>
          {addError && <p className="text-xs text-red-600">{addError}</p>}
        </div>
      )}
    </div>
  );
}
