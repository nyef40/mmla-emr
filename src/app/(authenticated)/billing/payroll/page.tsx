"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Trash2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type PayrollRow = {
  id: number;
  userId: number;
  periodStart: string;
  periodEnd: string;
  hours: string | null;
  visitsCount: number | null;
  rate: string | null;
  rateType: "hourly" | "per_visit" | "salary";
  total: string | null;
  status: "draft" | "approved" | "paid";
  payDate: string | null;
  notes: string | null;
  user: { id: number; name: string | null; role: string };
};

type UserOption = { id: number; name: string | null; role: string };

type GenDraft = {
  userId: string;
  periodStart: string;
  periodEnd: string;
  rate: string;
  rateType: "hourly" | "per_visit" | "salary";
  notes: string;
};

const STATUS_LABELS: Record<string, string> = { draft: "Draft", approved: "Approved", paid: "Paid" };
const STATUS_BADGE: Record<string, string> = {
  draft:    "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  paid:     "bg-green-50 text-green-700 border-green-200",
};
const RATE_TYPE_LABELS: Record<string, string> = {
  hourly:    "/ hr",
  per_visit: "/ visit",
  salary:    "flat",
};

const today = new Date().toISOString().slice(0, 10);

function firstOfMonth(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function emptyGen(): GenDraft {
  return { userId: "", periodStart: firstOfMonth(), periodEnd: today, rate: "", rateType: "per_visit", notes: "" };
}

function fmt$(v: string | null): string {
  if (!v) return "—";
  return `$${parseFloat(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

// ── Billing sub-nav ────────────────────────────────────────────────────────────

function BillingSubNav() {
  const pathname = usePathname();
  const tabs = [
    { href: "/billing/charges",   label: "Charge Load" },
    { href: "/billing/pre-audit", label: "Pre-Audit" },
    { href: "/billing/claims",    label: "Claims" },
    { href: "/billing/payroll",   label: "Payroll" },
  ];
  return (
    <div className="flex gap-0 border-b mb-4">
      {tabs.map(({ href, label }) => (
        <Link key={href} href={href}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            pathname.startsWith(href)
              ? "border-[#1e5f8a] text-[#1e5f8a]"
              : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PayrollPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [rows,    setRows]    = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [empList, setEmpList] = useState<UserOption[]>([]);

  // Filters
  const [fUser,   setFUser]   = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fFrom,   setFFrom]   = useState("");
  const [fTo,     setFTo]     = useState("");
  const filterRef = useRef({ fUser, fStatus, fFrom, fTo });
  filterRef.current = { fUser, fStatus, fFrom, fTo };

  // Generate form
  const [generating, setGenerating] = useState(false);
  const [genDraft,   setGenDraft]   = useState<GenDraft>(emptyGen());
  const [genSaving,  setGenSaving]  = useState(false);
  const [genError,   setGenError]   = useState<string | null>(null);

  // Pay date dialog state (for marking paid)
  const [payingId,   setPayingId]   = useState<number | null>(null);
  const [payDate,    setPayDate]     = useState(today);

  // Expanded row for notes
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [pageError, setPageError] = useState<string | null>(null);

  const isAdmin   = session?.user?.role === "admin";
  const isBilling = isAdmin || session?.user?.role === "staff";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && !isBilling) router.push("/home");
  }, [status, isBilling, router]);

  useEffect(() => {
    if (!isBilling) return;
    fetch("/api/users")
      .then(r => r.json())
      .then(d => setEmpList(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [isBilling]);

  function doLoad() {
    const { fUser, fStatus, fFrom, fTo } = filterRef.current;
    setLoading(true); setPageError(null);
    const qs = new URLSearchParams();
    if (fUser)   qs.set("userId", fUser);
    if (fStatus) qs.set("status", fStatus);
    if (fFrom)   qs.set("from", fFrom);
    if (fTo)     qs.set("to", fTo);
    fetch(`/api/payroll?${qs}`)
      .then(r => r.json())
      .then(setRows)
      .catch(() => setPageError("Failed to load payroll records"))
      .finally(() => setLoading(false));
  }

  const loadedOnce = useRef(false);
  useEffect(() => {
    if (isBilling && !loadedOnce.current) { loadedOnce.current = true; doLoad(); }
  }, [isBilling]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Generate payroll ────────────────────────────────────────────────────────
  async function saveGenerate() {
    setGenError(null);
    if (!genDraft.userId)      { setGenError("Select an employee");       return; }
    if (!genDraft.rate)        { setGenError("Rate is required");         return; }
    if (!genDraft.periodStart) { setGenError("Period start is required"); return; }
    if (!genDraft.periodEnd)   { setGenError("Period end is required");   return; }
    if (genDraft.periodStart > genDraft.periodEnd) { setGenError("Period start must be before end"); return; }

    setGenSaving(true);
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:      parseInt(genDraft.userId, 10),
          periodStart: genDraft.periodStart,
          periodEnd:   genDraft.periodEnd,
          rate:        genDraft.rate,
          rateType:    genDraft.rateType,
          notes:       genDraft.notes || null,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setGenError(b.error ?? `Error ${res.status}`);
        return;
      }
      const created: PayrollRow = await res.json();
      setRows(prev => [created, ...prev]);
      setGenerating(false);
      setGenDraft(emptyGen());
    } catch (e) {
      console.error(e);
      setGenError("Network error — payroll not saved");
    } finally {
      setGenSaving(false);
    }
  }

  // ── Status transitions ──────────────────────────────────────────────────────
  async function approve(row: PayrollRow) {
    if (!confirm(`Approve payroll for ${row.user.name ?? "employee"} (${row.periodStart} – ${row.periodEnd})?`)) return;
    const res = await fetch(`/api/payroll/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    if (res.ok) {
      const updated: PayrollRow = await res.json();
      setRows(prev => prev.map(r => r.id === row.id ? updated : r));
    } else {
      const b = await res.json().catch(() => ({}));
      setPageError(b.error ?? "Approval failed");
    }
  }

  async function markPaid(id: number, payDateValue: string) {
    const res = await fetch(`/api/payroll/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid", payDate: payDateValue }),
    });
    if (res.ok) {
      const updated: PayrollRow = await res.json();
      setRows(prev => prev.map(r => r.id === id ? updated : r));
      setPayingId(null);
    } else {
      const b = await res.json().catch(() => ({}));
      setPageError(b.error ?? "Mark paid failed");
    }
  }

  async function deleteRow(row: PayrollRow) {
    if (!confirm(`Delete draft payroll for ${row.user.name ?? "employee"}?`)) return;
    const res = await fetch(`/api/payroll/${row.id}`, { method: "DELETE" });
    if (res.ok) setRows(prev => prev.filter(r => r.id !== row.id));
    else { const b = await res.json().catch(() => ({})); setPageError(b.error ?? "Delete failed"); }
  }

  if (status === "loading" || (status === "authenticated" && !isBilling)) return null;

  // Summary counts
  const counts = rows.reduce((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const th = "px-3 py-2 text-left text-xs font-semibold text-white whitespace-nowrap";

  return (
    <div className="space-y-3">
      <BillingSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Payroll</h1>
          <p className="text-xs text-gray-500 mt-0.5">Pay period summaries calculated from Charge Load hours</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Status summary pills */}
          {(["draft", "approved", "paid"] as const).map(s =>
            (counts[s] ?? 0) > 0 && (
              <span key={s} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_BADGE[s]}`}>
                {counts[s]} {STATUS_LABELS[s]}
              </span>
            )
          )}
        </div>
      </div>

      {/* Error banner */}
      {pageError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
          <span className="flex-1">{pageError}</span>
          <button onClick={() => setPageError(null)} className="text-red-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Filter bar */}
      <div className="border rounded-md p-3 bg-gray-50 flex flex-wrap gap-3 items-end text-sm">
        <div className="space-y-0.5">
          <label className="text-xs text-gray-500 block">Employee</label>
          <select value={fUser} onChange={e => setFUser(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
            <option value="">All Employees</option>
            {empList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="space-y-0.5">
          <label className="text-xs text-gray-500 block">Status</label>
          <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <div className="space-y-0.5">
          <label className="text-xs text-gray-500 block">Period From</label>
          <Input type="date" value={fFrom} onChange={e => setFFrom(e.target.value)} className="h-8 text-sm w-36" />
        </div>
        <div className="space-y-0.5">
          <label className="text-xs text-gray-500 block">Period To</label>
          <Input type="date" value={fTo} onChange={e => setFTo(e.target.value)} className="h-8 text-sm w-36" />
        </div>
        <Button onClick={doLoad} size="sm" className="bg-[#1e5f8a] hover:bg-[#174f75] text-white h-8">Apply</Button>
      </div>

      {/* Generate form */}
      {generating && (
        <div className="border rounded-md bg-yellow-50 p-4 space-y-3">
          <p className="text-sm font-semibold">Generate Payroll Record</p>
          {genError && (
            <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />{genError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-600">Employee *</label>
              <select value={genDraft.userId} onChange={e => setGenDraft(p => ({ ...p, userId: e.target.value }))}
                className="border rounded px-2 py-1.5 text-sm w-full">
                <option value="">— select —</option>
                {empList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-600">Period Start *</label>
              <Input type="date" value={genDraft.periodStart} max={today}
                onChange={e => setGenDraft(p => ({ ...p, periodStart: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-600">Period End *</label>
              <Input type="date" value={genDraft.periodEnd} max={today}
                onChange={e => setGenDraft(p => ({ ...p, periodEnd: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-600">Rate ($) *</label>
              <Input type="number" min={0} step="0.01" value={genDraft.rate} placeholder="e.g. 75.00"
                onChange={e => setGenDraft(p => ({ ...p, rate: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-600">Rate Type *</label>
              <select value={genDraft.rateType} onChange={e => setGenDraft(p => ({ ...p, rateType: e.target.value as GenDraft["rateType"] }))}
                className="border rounded px-2 py-1.5 text-sm w-full">
                <option value="hourly">Per Hour</option>
                <option value="per_visit">Per Visit (day)</option>
                <option value="salary">Salary (flat)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-600">Notes</label>
              <Input value={genDraft.notes} placeholder="optional"
                onChange={e => setGenDraft(p => ({ ...p, notes: e.target.value }))} className="h-8 text-sm" />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Hours and visit count will be calculated automatically from Charge Load records for the selected period.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={saveGenerate} disabled={genSaving}
              className="bg-[#1e5f8a] hover:bg-[#174f75] text-white">
              {genSaving ? "Generating…" : "Generate as Draft"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setGenerating(false); setGenError(null); setGenDraft(emptyGen()); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Pay date modal */}
      {payingId !== null && (
        <div className="border rounded-md bg-blue-50 p-4 flex items-center gap-3">
          <span className="text-sm font-medium">Pay Date:</span>
          <Input type="date" value={payDate} max={today} onChange={e => setPayDate(e.target.value)} className="h-8 text-sm w-40" />
          <Button size="sm" onClick={() => markPaid(payingId, payDate)}
            className="bg-green-600 hover:bg-green-700 text-white">Confirm Paid</Button>
          <Button size="sm" variant="ghost" onClick={() => setPayingId(null)}>Cancel</Button>
        </div>
      )}

      {/* Payroll table */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e5f8a]" />
        </div>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-[#1e5f8a]">
                <th className={th}>Employee</th>
                <th className={th}>Period</th>
                <th className={`${th} text-right`}>Hrs</th>
                <th className={`${th} text-right`}>Visits</th>
                <th className={`${th} text-right`}>Rate</th>
                <th className={th}>Type</th>
                <th className={`${th} text-right`}>Total</th>
                <th className={th}>Status</th>
                <th className={th}>Pay Date</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No payroll records. Click <strong>Generate Payroll</strong> to create one.
                  </td>
                </tr>
              )}
              {rows.map(row => (
                <>
                  <tr key={row.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm font-medium">{row.user.name ?? `User #${row.userId}`}</td>
                    <td className="px-3 py-2 text-xs tabular-nums">
                      {row.periodStart} — {row.periodEnd}
                    </td>
                    <td className="px-3 py-2 text-xs text-right tabular-nums">
                      {row.hours ? parseFloat(row.hours).toFixed(2) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2 text-xs text-right tabular-nums">
                      {row.visitsCount ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2 text-xs text-right tabular-nums">{fmt$(row.rate)}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{RATE_TYPE_LABELS[row.rateType]}</td>
                    <td className="px-3 py-2 text-sm font-semibold text-right tabular-nums">{fmt$(row.total)}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_BADGE[row.status]}`}>
                        {STATUS_LABELS[row.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs tabular-nums text-gray-500">
                      {row.payDate ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 items-center">
                        {/* Notes toggle */}
                        {row.notes && (
                          <button onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                            title="Toggle notes" className="text-gray-400 hover:text-gray-700">
                            {expandedId === row.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        )}
                        {/* Approve (admin, draft only) */}
                        {isAdmin && row.status === "draft" && (
                          <Button size="sm" variant="outline"
                            className="h-6 text-xs px-2 text-blue-700 border-blue-200 hover:bg-blue-50"
                            onClick={() => approve(row)}>
                            Approve
                          </Button>
                        )}
                        {/* Mark Paid (admin, approved only) */}
                        {isAdmin && row.status === "approved" && (
                          <Button size="sm"
                            className="h-6 text-xs px-2 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => { setPayingId(row.id); setPayDate(today); }}>
                            Mark Paid
                          </Button>
                        )}
                        {/* Delete (admin, draft only) */}
                        {isAdmin && row.status === "draft" && (
                          <button onClick={() => deleteRow(row)} title="Delete draft"
                            className="text-red-400 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {/* Expanded notes row */}
                  {expandedId === row.id && row.notes && (
                    <tr key={`${row.id}-notes`} className="bg-gray-50 border-t">
                      <td colSpan={10} className="px-3 py-2 text-xs text-gray-600 italic">
                        {row.notes}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 border-t pt-3">
        {isBilling && (
          <Button size="sm" onClick={() => { setGenerating(true); setGenError(null); setGenDraft(emptyGen()); }}
            className="bg-[#1e5f8a] hover:bg-[#174f75] text-white">
            + Generate Payroll
          </Button>
        )}
        <span className="text-xs text-gray-400">
          Hours and visit counts pull from Charge Load · Admin approves and marks paid
        </span>
      </div>
    </div>
  );
}
