"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Pencil, Check, X } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type ClaimRow = {
  id: number;
  claimNumber: string | null;
  status: string;
  totalAmount: string | null;
  submittedDate: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  icn: string | null;
  tobCode: string | null;
  hippsCode: string | null;
  createdAt: string;
  patient: { id: number; firstName: string; lastName: string; patientId: string };
  insurance: { id: number; name: string } | null;
  visit: { id: number; visitType: string; visitDate: string } | null;
};


// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_TABS = ["all", "submitted", "accepted", "rejected", "paid", "void"] as const;
type StatusTab = typeof STATUS_TABS[number];

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    draft:     "bg-gray-100 text-gray-600",
    submitted: "bg-blue-100 text-blue-700",
    accepted:  "bg-green-100 text-green-700",
    rejected:  "bg-red-100 text-red-700",
    paid:      "bg-emerald-100 text-emerald-800",
    void:      "bg-gray-200 text-gray-400",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function fmt(amount: string | null) {
  if (!amount) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(parseFloat(amount));
}


// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ClaimsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [claims,    setClaims]    = useState<ClaimRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<StatusTab>("all");
  const [search,    setSearch]    = useState("");
  const [editIcn,   setEditIcn]   = useState<number | null>(null);
  const [icnDraft,  setIcnDraft]  = useState("");

  const isBilling = session?.user?.role === "admin" || session?.user?.role === "staff";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && !isBilling) router.push("/home");
  }, [status, isBilling, router]);

  const load = useCallback(() => {
    setLoading(true);
    const qs = tab !== "all" ? `?status=${tab}` : "";
    fetch(`/api/claims${qs}`)
      .then(r => r.json())
      .then((rows: ClaimRow[]) => setClaims(rows))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const visible = claims.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${c.patient.firstName} ${c.patient.lastName}`.toLowerCase();
    return name.includes(q) || (c.claimNumber ?? "").toLowerCase().includes(q);
  });

  async function saveIcn(claimId: number) {
    const res = await fetch(`/api/claims/${claimId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icn: icnDraft }),
    });
    if (res.ok) {
      setClaims(prev => prev.map(c => c.id === claimId ? { ...c, icn: icnDraft } : c));
    }
    setEditIcn(null);
  }

  if (status === "loading" || (status === "authenticated" && !isBilling)) return null;

  const billingTabs = [
    { href: "/billing/charges",   label: "Charge Load" },
    { href: "/billing/pre-audit", label: "Pre-Audit" },
    { href: "/billing/claims",    label: "Claims" },
    { href: "/billing/payroll",   label: "Payroll" },
  ];

  return (
    <div className="space-y-4">
      {/* Billing sub-nav */}
      <div className="flex gap-0 border-b">
        {billingTabs.map(({ href, label }) => (
          <Link key={href} href={href}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              pathname === href
                ? "border-[#1e5f8a] text-[#1e5f8a]"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
            }`}
          >{label}</Link>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Claims</h1>
          <p className="text-sm text-gray-500 mt-0.5">Insurance claims and payment tracking</p>
        </div>
        <Link
          href="/billing/pre-audit"
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-[#1e5f8a] text-white hover:bg-[#174f75] transition-colors"
        >
          + New Claim via Pre-Audit
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-md border overflow-hidden text-sm">
          {STATUS_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 capitalize transition-colors ${
                tab === t ? "bg-[#1e5f8a] text-white" : "bg-white hover:bg-gray-50 text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <Input
          placeholder="Search patient or claim #…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-56 h-8 text-sm"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e5f8a]" />
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#1e5f8a] text-white text-left text-xs">
                <th className="px-3 py-2.5 font-medium">Claim #</th>
                <th className="px-3 py-2.5 font-medium">Patient</th>
                <th className="px-3 py-2.5 font-medium">Insurance</th>
                <th className="px-3 py-2.5 font-medium">Period</th>
                <th className="px-3 py-2.5 font-medium">ICN / 277CA</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium text-right">Total</th>
                <th className="px-3 py-2.5 font-medium">Date</th>
                <th className="px-3 py-2.5 font-medium w-28" />
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                    {search ? "No claims match your search." : "No claims yet."}
                  </td>
                </tr>
              )}
              {visible.map(c => (
                <tr key={c.id} className="border-t hover:bg-gray-50 text-xs">
                  <td className="px-3 py-2 font-mono text-gray-700">
                    {c.claimNumber ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-medium text-sm">{c.patient.lastName}, {c.patient.firstName}</span>
                    <span className="text-gray-400 ml-1">{c.patient.patientId}</span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{c.insurance?.name ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-3 py-2 text-gray-600 tabular-nums">
                    {c.periodStart && c.periodEnd ? (
                      <div>{c.periodStart.slice(5)} – {c.periodEnd.slice(5)}</div>
                    ) : <div className="text-gray-300">—</div>}
                    {c.tobCode && <div className="text-gray-400 text-[10px]">TOB: {c.tobCode}</div>}
                  </td>
                  <td className="px-3 py-2">
                    {editIcn === c.id ? (
                      <span className="flex items-center gap-1">
                        <input
                          className="border rounded px-1.5 py-0.5 text-xs w-36 font-mono"
                          value={icnDraft}
                          autoFocus
                          onChange={e => setIcnDraft(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") saveIcn(c.id); if (e.key === "Escape") setEditIcn(null); }}
                        />
                        <button onClick={() => saveIcn(c.id)} className="text-green-600 hover:text-green-800"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setEditIcn(null)} className="text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 group">
                        <span className="font-mono text-gray-700">{c.icn ?? <span className="text-gray-300">—</span>}</span>
                        <button
                          onClick={() => { setEditIcn(c.id); setIcnDraft(c.icn ?? ""); }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-[#1e5f8a] transition-opacity"
                        ><Pencil className="h-3 w-3" /></button>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">{fmt(c.totalAmount)}</td>
                  <td className="px-3 py-2 text-gray-500">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/claims/${c.id}/837i`}
                        download
                        title="Download 837i EDI file"
                        className="text-gray-400 hover:text-[#1e5f8a] transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      <Link
                        href={`/billing/claims/${c.id}`}
                        className="text-[#1e5f8a] hover:underline font-medium"
                      >
                        View →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
