"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Calculator, ChevronDown, ChevronRight, FileText, Download } from "lucide-react";
import { FY2026, lookupCaseWeight, lookupWageIndex, WAGE_INDICES, calcPps, calcFinal } from "@/lib/pdgm";

// ── Types ─────────────────────────────────────────────────────────────────────

type BillingCodeLine = { code: string; description: string; units: number; amount: number };

type Payment = {
  id: number;
  amount: string;
  paymentDate: string;
  payer: string | null;
  paymentType: string;
  checkNumber: string | null;
  notes: string | null;
  createdAt: string;
};

type Claim = {
  id: number;
  claimNumber: string | null;
  status: string;
  totalAmount: string | null;
  submittedDate: string | null;
  billingCodesJson: BillingCodeLine[] | null;
  notes: string | null;
  hippsCode: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  tobCode: string | null;
  // PDGM / PPS
  caseWeight: string | null;
  wageIndex: string | null;
  cbsaCode: string | null;
  eepAmount: string | null;
  outlierAmount: string | null;
  sequesterAmount: string | null;
  finalPosted: string | null;
  ppsNotes: string | null;
  createdAt: string;
  updatedAt: string;
  patient: { id: number; firstName: string; lastName: string; patientId: string };
  insurance: { id: number; name: string; category: string } | null;
  visit: { id: number; visitType: string; visitDate: string; formStatus: string } | null;
  payments: Payment[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

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
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${cls[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function fmt(amount: string | null | number) {
  if (amount === null || amount === undefined || amount === "") return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    typeof amount === "string" ? parseFloat(amount) : amount
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value ?? <span className="text-gray-400">—</span>}</p>
    </div>
  );
}

// ── Status Actions ────────────────────────────────────────────────────────────

function StatusActions({
  claim,
  isAdmin,
  onUpdate,
}: {
  claim: Claim;
  isAdmin: boolean;
  onUpdate: (updated: Claim) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function transition(status: string, extra?: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/claims/${claim.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...extra }),
      });
      if (res.ok) {
        const full = await fetch(`/api/claims/${claim.id}`).then(r => r.json());
        onUpdate(full);
      }
    } finally {
      setBusy(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {claim.status === "draft" && (
        <Button
          size="sm"
          disabled={busy}
          onClick={() => transition("submitted", { submittedDate: today })}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Submit Claim
        </Button>
      )}
      {claim.status === "submitted" && (
        <>
          <Button size="sm" disabled={busy} onClick={() => transition("accepted")}
            className="bg-green-600 hover:bg-green-700 text-white">
            Mark Accepted
          </Button>
          <Button size="sm" disabled={busy} onClick={() => transition("rejected")}
            className="bg-red-600 hover:bg-red-700 text-white">
            Mark Rejected
          </Button>
        </>
      )}
      {claim.status === "accepted" && (
        <Button size="sm" disabled={busy} onClick={() => transition("paid")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white">
          Mark Paid
        </Button>
      )}
      {claim.status !== "void" && isAdmin && (
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => {
            if (!confirm("Void this claim? This cannot be undone.")) return;
            transition("void");
          }}
          className="text-gray-500 border-gray-300"
        >
          Void
        </Button>
      )}
    </div>
  );
}

// ── EDI Fields Section ────────────────────────────────────────────────────────

function EdiFieldsSection({ claim, onUpdate }: { claim: Claim; onUpdate: (c: Claim) => void }) {
  const editable = claim.status !== "void";
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    hippsCode:   claim.hippsCode   ?? "",
    periodStart: claim.periodStart ? claim.periodStart.slice(0, 10) : "",
    periodEnd:   claim.periodEnd   ? claim.periodEnd.slice(0, 10)   : "",
    tobCode:     claim.tobCode     ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setForm({
      hippsCode:   claim.hippsCode   ?? "",
      periodStart: claim.periodStart ? claim.periodStart.slice(0, 10) : "",
      periodEnd:   claim.periodEnd   ? claim.periodEnd.slice(0, 10)   : "",
      tobCode:     claim.tobCode     ?? "329",
    });
    setError(null);
    setEditing(true);
  }

  async function save() {
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/claims/${claim.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hippsCode:   form.hippsCode   || null,
          periodStart: form.periodStart || null,
          periodEnd:   form.periodEnd   || null,
          tobCode:     form.tobCode     || null,
        }),
      });
      if (!res.ok) { const e = await res.json(); setError(e.error ?? "Save failed"); return; }
      const full = await fetch(`/api/claims/${claim.id}`).then(r => r.json());
      onUpdate(full);
      setEditing(false);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <h2 className="font-semibold text-sm">EDI / Billing</h2>
        {editable && !editing && (
          <button onClick={startEdit} className="text-xs text-[#1e5f8a] hover:underline">Edit</button>
        )}
        {editing && (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:underline">Cancel</button>
            <Button size="sm" disabled={saving} onClick={save}
              className="h-6 text-xs bg-[#1e5f8a] hover:bg-[#174f75] text-white px-2">
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        )}
      </div>

      {!editing ? (
        <div className="px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoRow label="HIPPS Code" value={claim.hippsCode} />
          <InfoRow label="Period Start" value={claim.periodStart?.slice(0, 10)} />
          <InfoRow label="Period End"   value={claim.periodEnd?.slice(0, 10)} />
          <InfoRow label="TOB Code"     value={claim.tobCode} />
        </div>
      ) : (
        <div className="px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">HIPPS Code</Label>
              <Input value={form.hippsCode} placeholder="e.g. 3BA21"
                onChange={e => setForm(p => ({ ...p, hippsCode: e.target.value }))}
                className="h-8 text-sm font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Period Start</Label>
              <Input type="date" value={form.periodStart}
                onChange={e => setForm(p => ({ ...p, periodStart: e.target.value }))}
                className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Period End</Label>
              <Input type="date" value={form.periodEnd}
                onChange={e => setForm(p => ({ ...p, periodEnd: e.target.value }))}
                className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">TOB Code</Label>
              <Input value={form.tobCode} placeholder="329"
                onChange={e => setForm(p => ({ ...p, tobCode: e.target.value }))}
                className="h-8 text-sm font-mono" />
            </div>
          </div>
          <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
            Set HIPPS code then re-download the 837i to include the <code>SV2*0023*HP:…</code> PPS line.
          </p>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}

// ── Medicare PPS Section ──────────────────────────────────────────────────────

function fmt2(n: number | string | null | undefined) {
  if (n === null || n === undefined || n === "") return "—";
  const v = typeof n === "string" ? parseFloat(n) : n;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
}
function fmtNum(n: number | string | null | undefined, decimals = 4) {
  if (n === null || n === undefined || n === "") return "—";
  return parseFloat(String(n)).toFixed(decimals);
}

function CalcRow({ label, value, bold, indent, separator }: {
  label: string; value: React.ReactNode;
  bold?: boolean; indent?: boolean; separator?: boolean;
}) {
  return (
    <tr className={`border-t ${separator ? "border-gray-300" : "border-gray-100"}`}>
      <td className={`px-4 py-1.5 text-xs ${indent ? "pl-8 text-gray-500" : bold ? "font-semibold text-gray-800" : "text-gray-600"}`}>
        {label}
      </td>
      <td className={`px-4 py-1.5 text-xs text-right tabular-nums ${bold ? "font-semibold text-gray-900" : "text-gray-700"}`}>
        {value}
      </td>
    </tr>
  );
}

function MedicarePpsSection({ claim, onUpdate }: { claim: Claim; onUpdate: (c: Claim) => void }) {
  const isMedicare = (claim.insurance?.category ?? "").toLowerCase().startsWith("medicare");
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const knownWeight = claim.hippsCode ? lookupCaseWeight(claim.hippsCode) : null;

  const [form, setForm] = useState({
    baseRate:       String(FY2026.baseRate),
    caseWeight:     claim.caseWeight ?? (knownWeight !== null ? String(knownWeight) : ""),
    cbsaCode:       claim.cbsaCode ?? "",
    wageIndex:      claim.wageIndex ?? "",
    outlierAmount:  claim.outlierAmount ?? "",
    sequesterAmount: claim.sequesterAmount ?? "",
    ppsNotes:       claim.ppsNotes ?? "",
  });

  // When HIPPS changes on the claim, auto-fill known case weight
  const hipps = claim.hippsCode ?? "";
  const autoWeight = hipps ? lookupCaseWeight(hipps) : null;

  // When CBSA changes, auto-fill wage index
  function handleCbsaChange(code: string) {
    const wi = lookupWageIndex(code);
    setForm(p => ({
      ...p,
      cbsaCode: code,
      wageIndex: wi ? String(wi.wageIndex) : p.wageIndex,
    }));
  }

  // Live calculation
  const base  = parseFloat(form.baseRate)   || FY2026.baseRate;
  const cw    = parseFloat(form.caseWeight) || 0;
  const wi    = parseFloat(form.wageIndex)  || 0;
  const eepLive = cw && wi
    ? calcPps({ baseRate: base, caseWeight: cw, laborShare: FY2026.laborShare, nonLabor: FY2026.nonLabor, wageIndex: wi })
    : null;
  const outlierLive   = parseFloat(form.outlierAmount)   || 0;
  const seqLive       = parseFloat(form.sequesterAmount) || (eepLive ? eepLive.sequester : 0);
  const finalLive     = eepLive ? calcFinal(eepLive.eep, outlierLive, seqLive) : null;

  async function save() {
    setSaving(true); setSaveError(null);
    const eepVal  = eepLive?.eep ?? null;
    const finalVal = finalLive ?? null;
    try {
      const res = await fetch(`/api/claims/${claim.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseWeight:      form.caseWeight    || null,
          wageIndex:       form.wageIndex     || null,
          cbsaCode:        form.cbsaCode      || null,
          eepAmount:       eepVal,
          outlierAmount:   form.outlierAmount  || null,
          sequesterAmount: form.sequesterAmount || null,
          finalPosted:     finalVal,
          ppsNotes:        form.ppsNotes      || null,
        }),
      });
      if (!res.ok) { const e = await res.json(); setSaveError(e.error ?? "Save failed"); return; }
      const full = await fetch(`/api/claims/${claim.id}`).then(r => r.json());
      onUpdate(full);
      setEditing(false);
    } catch {
      setSaveError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (!isMedicare) return null;

  const hasSaved = !!(claim.eepAmount || claim.caseWeight);

  return (
    <div className="border rounded-md overflow-hidden">
      {/* Header */}
      <div
        role="button" tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => (e.key === "Enter" || e.key === " ") && setOpen(o => !o)}
        className="flex items-center justify-between px-4 py-3 bg-blue-50 border-b cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-blue-700" />
          <h2 className="font-semibold text-sm text-blue-900">Medicare PDGM — PPS Calculation</h2>
          {hasSaved && (
            <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 rounded px-2 py-0.5">
              EEP {fmt2(claim.eepAmount)} · Final {fmt2(claim.finalPosted)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!editing && open && claim.status !== "void" && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setEditing(true); }}
              className="text-xs text-blue-700 hover:underline"
            >
              {hasSaved ? "Edit" : "Enter values"}
            </button>
          )}
          {open ? <ChevronDown className="h-4 w-4 text-blue-600" /> : <ChevronRight className="h-4 w-4 text-blue-600" />}
        </div>
      </div>

      {open && (
        <div className="p-4 space-y-4 bg-white">
          {/* Input form */}
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Base rate (read-only — set by CMS FY) */}
                <div className="space-y-1">
                  <Label className="text-xs">FY Base Rate ($) <span className="text-gray-400 font-normal">CMS</span></Label>
                  <Input value={form.baseRate} readOnly className="h-8 text-sm bg-gray-50 tabular-nums" />
                </div>
                {/* HIPPS / Case weight */}
                <div className="space-y-1">
                  <Label className="text-xs">
                    Case-Mix Weight
                    {autoWeight !== null && !form.caseWeight && (
                      <button type="button" onClick={() => setForm(p => ({ ...p, caseWeight: String(autoWeight) }))}
                        className="ml-1 text-blue-600 hover:underline font-normal">
                        (use {autoWeight} for {hipps})
                      </button>
                    )}
                  </Label>
                  <Input
                    type="number" step="0.0001" min="0"
                    value={form.caseWeight}
                    placeholder={autoWeight !== null ? String(autoWeight) : "e.g. 0.7553"}
                    onChange={e => setForm(p => ({ ...p, caseWeight: e.target.value }))}
                    className="h-8 text-sm tabular-nums"
                  />
                </div>
                {/* CBSA */}
                <div className="space-y-1">
                  <Label className="text-xs">CBSA Code <span className="text-gray-400 font-normal">(MSA)</span></Label>
                  <div className="flex gap-1">
                    <Input
                      value={form.cbsaCode}
                      placeholder="e.g. 31084"
                      onChange={e => handleCbsaChange(e.target.value)}
                      className="h-8 text-sm font-mono flex-1"
                    />
                    {form.cbsaCode && lookupWageIndex(form.cbsaCode) && (
                      <span className="self-center text-xs text-green-700 whitespace-nowrap">
                        ✓ {lookupWageIndex(form.cbsaCode)!.name.split(",")[0]}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5">
                    <select
                      value=""
                      onChange={e => e.target.value && handleCbsaChange(e.target.value)}
                      className="w-full border rounded px-2 py-1 text-xs text-gray-500"
                    >
                      <option value="">— or pick from known CBSAs —</option>
                      {Object.entries(WAGE_INDICES).map(([code, { name }]) => (
                        <option key={code} value={code}>{code} · {name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Wage index */}
                <div className="space-y-1">
                  <Label className="text-xs">Wage Index</Label>
                  <Input
                    type="number" step="0.0001" min="0"
                    value={form.wageIndex}
                    placeholder="e.g. 1.2699"
                    onChange={e => setForm(p => ({ ...p, wageIndex: e.target.value }))}
                    className="h-8 text-sm tabular-nums"
                  />
                </div>
                {/* Outlier */}
                <div className="space-y-1">
                  <Label className="text-xs">Outlier Add-on ($) <span className="text-gray-400 font-normal">from audit report</span></Label>
                  <Input
                    type="number" step="0.01" min="0"
                    value={form.outlierAmount}
                    placeholder="0.00"
                    onChange={e => setForm(p => ({ ...p, outlierAmount: e.target.value }))}
                    className="h-8 text-sm tabular-nums"
                  />
                </div>
                {/* Sequester */}
                <div className="space-y-1">
                  <Label className="text-xs">Sequester/Other Adj ($) <span className="text-gray-400 font-normal">reduction</span></Label>
                  <Input
                    type="number" step="0.01" min="0"
                    value={form.sequesterAmount}
                    placeholder={eepLive ? eepLive.sequester.toFixed(2) : "0.00"}
                    onChange={e => setForm(p => ({ ...p, sequesterAmount: e.target.value }))}
                    className="h-8 text-sm tabular-nums"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <Label className="text-xs">Notes (Assessment date, RFA, Episode timing, etc.)</Label>
                <Input
                  value={form.ppsNotes}
                  placeholder="e.g. Assessment: 2/13/2026 · RFA: 4 (Follow Up) · Late · Community"
                  onChange={e => setForm(p => ({ ...p, ppsNotes: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>

              {/* Live preview */}
              {eepLive && (
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Live Preview
                  </div>
                  <table className="w-full">
                    <tbody>
                      <CalcRow label="Standard Base Rate (FY2026)" value={fmt2(base)} indent />
                      <CalcRow label={`× Case-Mix Weight (HIPPS ${hipps || "—"})`} value={fmtNum(cw, 7)} indent />
                      <CalcRow label={`× Wage Adj [(${FY2026.laborShare} × ${fmtNum(wi, 4)}) + ${FY2026.nonLabor}]`}
                        value={fmtNum(FY2026.laborShare * wi + FY2026.nonLabor, 6)} indent />
                      <CalcRow label="= EEP (Expected Episode Payment)" value={fmt2(eepLive.eep)} bold />
                      <CalcRow label="+ Outlier Add-on" value={fmt2(outlierLive)} indent />
                      <CalcRow label="− Sequester / Other Adj" value={fmt2(seqLive)} indent />
                      <CalcRow label="= Final Posted" value={fmt2(finalLive)} bold separator />
                    </tbody>
                  </table>
                </div>
              )}

              {saveError && <p className="text-xs text-red-600">{saveError}</p>}
              <div className="flex gap-2">
                <Button size="sm" disabled={saving} onClick={save}
                  className="bg-[#1e5f8a] hover:bg-[#174f75] text-white">
                  {saving ? "Saving…" : "Save PPS Calculation"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            /* Saved view */
            hasSaved ? (
              <div className="space-y-3">
                {/* Calculation breakdown table */}
                <table className="w-full border rounded-md overflow-hidden">
                  <tbody>
                    <CalcRow label="Standard Base Rate (FY2026)" value={fmt2(FY2026.baseRate)} indent />
                    <CalcRow
                      label={`× Case-Mix Weight${claim.hippsCode ? ` (HIPPS ${claim.hippsCode})` : ""}`}
                      value={fmtNum(claim.caseWeight, 7)} indent
                    />
                    <CalcRow
                      label={`× Wage Adj [(${FY2026.laborShare} × ${fmtNum(claim.wageIndex, 4)}) + ${FY2026.nonLabor}]${claim.cbsaCode ? ` — CBSA ${claim.cbsaCode}` : ""}`}
                      value={fmtNum(
                        FY2026.laborShare * parseFloat(claim.wageIndex ?? "0") + FY2026.nonLabor, 6
                      )} indent
                    />
                    <CalcRow label="= EEP (Expected Episode Payment)" value={fmt2(claim.eepAmount)} bold />
                    <CalcRow label="+ Outlier Add-on" value={fmt2(claim.outlierAmount)} indent />
                    <CalcRow label="− Sequester / Other Adj" value={fmt2(claim.sequesterAmount)} indent />
                    <CalcRow label="= Final Posted" value={fmt2(claim.finalPosted)} bold separator />
                  </tbody>
                </table>
                {claim.ppsNotes && (
                  <p className="text-xs text-gray-500 italic">{claim.ppsNotes}</p>
                )}
                <p className="text-xs text-gray-400">
                  Labor share {FY2026.laborShare} · Non-labor {FY2026.nonLabor} · FY2026 base rate ${FY2026.baseRate}
                </p>
              </div>
            ) : (
              <div className="text-sm text-gray-400 py-2">
                No PPS calculation saved yet.
                {claim.hippsCode ? (
                  <> HIPPS <span className="font-mono font-semibold text-gray-600">{claim.hippsCode}</span> is set
                    {autoWeight !== null && <> — case weight <span className="font-mono">{autoWeight}</span> is known.</>}
                    {" "}Click <button type="button" onClick={() => setEditing(true)}
                      className="text-[#1e5f8a] hover:underline">Enter values</button> to calculate.
                  </>
                ) : (
                  <> Set the HIPPS code in the EDI / Billing section first.</>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ── Billing Codes Section ─────────────────────────────────────────────────────

function BillingCodesSection({ claim, onUpdate }: { claim: Claim; onUpdate: (c: Claim) => void }) {
  const isDraft = claim.status === "draft";
  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState<BillingCodeLine[]>(claim.billingCodesJson ?? []);
  const [saving, setSaving] = useState(false);

  const lines = claim.billingCodesJson ?? [];
  const total = lines.reduce((s, r) => s + r.amount, 0);

  function addRow() { setRows(prev => [...prev, { code: "", description: "", units: 1, amount: 0 }]); }
  function removeRow(i: number) { setRows(prev => prev.filter((_, idx) => idx !== i)); }
  function updateRow(i: number, field: keyof BillingCodeLine, value: string | number) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }

  async function save() {
    setSaving(true);
    const totalAmount = rows.reduce((s, r) => s + r.amount, 0);
    try {
      const res = await fetch(`/api/claims/${claim.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingCodesJson: rows.filter(r => r.code), totalAmount }),
      });
      if (res.ok) {
        const full = await fetch(`/api/claims/${claim.id}`).then(r => r.json());
        onUpdate(full);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <h2 className="font-semibold text-sm">Billing Codes</h2>
        {isDraft && !editing && (
          <button onClick={() => { setRows(claim.billingCodesJson ?? []); setEditing(true); }}
            className="text-xs text-[#1e5f8a] hover:underline">
            Edit
          </button>
        )}
        {editing && (
          <div className="flex gap-2">
            <button onClick={addRow} className="text-xs text-[#1e5f8a] hover:underline">+ Add row</button>
            <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:underline">Cancel</button>
            <Button size="sm" disabled={saving} onClick={save}
              className="h-6 text-xs bg-[#1e5f8a] hover:bg-[#174f75] text-white px-2">
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        )}
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-xs text-gray-500 bg-white">
            <th className="px-4 py-2 text-left w-28">Code</th>
            <th className="px-4 py-2 text-left">Description</th>
            <th className="px-4 py-2 text-right w-16">Units</th>
            <th className="px-4 py-2 text-right w-28">Amount</th>
            {editing && <th className="w-8" />}
          </tr>
        </thead>
        <tbody>
          {!editing && lines.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-sm">
                No billing codes. {isDraft && <button onClick={() => setEditing(true)} className="text-[#1e5f8a] hover:underline">Add codes.</button>}
              </td>
            </tr>
          )}
          {!editing && lines.map((l, i) => (
            <tr key={i} className="border-t">
              <td className="px-4 py-2.5 font-mono text-xs font-semibold">{l.code}</td>
              <td className="px-4 py-2.5 text-gray-700">{l.description}</td>
              <td className="px-4 py-2.5 text-right">{l.units}</td>
              <td className="px-4 py-2.5 text-right font-medium tabular-nums">{fmt(l.amount)}</td>
            </tr>
          ))}
          {editing && rows.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="px-2 py-1">
                <input
                  value={r.code}
                  onChange={e => updateRow(i, "code", e.target.value)}
                  placeholder="e.g. 99601"
                  className="w-full border rounded px-2 py-1 text-xs"
                />
              </td>
              <td className="px-2 py-1">
                <input
                  value={r.description}
                  onChange={e => updateRow(i, "description", e.target.value)}
                  placeholder="Description"
                  className="w-full border rounded px-2 py-1 text-xs"
                />
              </td>
              <td className="px-2 py-1">
                <input
                  type="number"
                  min={1}
                  value={r.units}
                  onChange={e => updateRow(i, "units", parseInt(e.target.value, 10) || 1)}
                  className="w-full border rounded px-2 py-1 text-xs text-right"
                />
              </td>
              <td className="px-2 py-1">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={r.amount}
                  onChange={e => updateRow(i, "amount", parseFloat(e.target.value) || 0)}
                  className="w-full border rounded px-2 py-1 text-xs text-right"
                />
              </td>
              <td className="px-1 py-1 text-center">
                <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        {lines.length > 0 && !editing && (
          <tfoot>
            <tr className="border-t bg-gray-50">
              <td colSpan={3} className="px-4 py-2 text-right text-xs font-medium text-gray-600">Total</td>
              <td className="px-4 py-2 text-right font-semibold tabular-nums">{fmt(total)}</td>
            </tr>
          </tfoot>
        )}
        {editing && (
          <tfoot>
            <tr className="border-t bg-gray-50">
              <td colSpan={3} className="px-4 py-2 text-right text-xs font-medium text-gray-600">Total</td>
              <td className="px-4 py-2 text-right font-semibold tabular-nums">
                {fmt(rows.reduce((s, r) => s + r.amount, 0))}
              </td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

// ── Payments Section ──────────────────────────────────────────────────────────

const PAYMENT_TYPES = ["check", "ach", "era", "other"] as const;

function PaymentsSection({
  claim,
  isAdmin,
  onUpdate,
}: {
  claim: Claim;
  isAdmin: boolean;
  onUpdate: (c: Claim) => void;
}) {
  const [amount,      setAmount]      = useState("");
  const [payDate,     setPayDate]     = useState(new Date().toISOString().slice(0, 10));
  const [payer,       setPayer]       = useState("");
  const [payType,     setPayType]     = useState<typeof PAYMENT_TYPES[number]>("check");
  const [checkNum,    setCheckNum]    = useState("");
  const [notes,       setNotes]       = useState("");
  const [adding,      setAdding]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [deletingId,  setDeletingId]  = useState<number | null>(null);

  const canAddPayment = claim.status !== "void" && claim.status !== "draft" && claim.status !== "rejected";

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !payDate) { setError("Amount and date are required"); return; }
    setAdding(true); setError(null);
    try {
      const res = await fetch(`/api/claims/${claim.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentDate: payDate,
          payer: payer || null,
          paymentType: payType,
          checkNumber: checkNum || null,
          notes: notes || null,
        }),
      });
      if (!res.ok) { const e = await res.json(); setError(e.error ?? "Failed"); return; }
      // refetch claim to get updated status + payments
      const updated = await fetch(`/api/claims/${claim.id}`).then(r => r.json());
      onUpdate(updated);
      setAmount(""); setPayer(""); setCheckNum(""); setNotes("");
    } catch {
      setError("Network error");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(paymentId: number, amt: string) {
    if (!confirm(`Delete payment of ${fmt(amt)}?`)) return;
    setDeletingId(paymentId);
    try {
      await fetch(`/api/claims/${claim.id}/payments/${paymentId}`, { method: "DELETE" });
      const updated = await fetch(`/api/claims/${claim.id}`).then(r => r.json());
      onUpdate(updated);
    } finally {
      setDeletingId(null);
    }
  }

  const paymentsTotal = claim.payments.reduce((s, p) => s + parseFloat(p.amount), 0);

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <h2 className="font-semibold text-sm">Payments</h2>
      </div>

      {/* Payments table */}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-xs text-gray-500 bg-white">
            <th className="px-4 py-2 text-left">Date</th>
            <th className="px-4 py-2 text-left">Payer</th>
            <th className="px-4 py-2 text-left">Type</th>
            <th className="px-4 py-2 text-left">Check #</th>
            <th className="px-4 py-2 text-right">Amount</th>
            {isAdmin && <th className="w-10" />}
          </tr>
        </thead>
        <tbody>
          {claim.payments.length === 0 && (
            <tr>
              <td colSpan={isAdmin ? 6 : 5} className="px-4 py-6 text-center text-gray-400 text-sm">
                No payments recorded.
              </td>
            </tr>
          )}
          {claim.payments.map(p => (
            <tr key={p.id} className="border-t">
              <td className="px-4 py-2.5">{p.paymentDate}</td>
              <td className="px-4 py-2.5 text-gray-700">{p.payer ?? <span className="text-gray-300">—</span>}</td>
              <td className="px-4 py-2.5 uppercase text-xs font-medium">{p.paymentType}</td>
              <td className="px-4 py-2.5 font-mono text-xs">{p.checkNumber ?? <span className="text-gray-300">—</span>}</td>
              <td className="px-4 py-2.5 text-right font-medium tabular-nums">{fmt(p.amount)}</td>
              {isAdmin && (
                <td className="px-2 py-2.5 text-center">
                  <button
                    onClick={() => handleDelete(p.id, p.amount)}
                    disabled={deletingId === p.id}
                    className="text-red-400 hover:text-red-600 disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
        {claim.payments.length > 0 && (
          <tfoot>
            <tr className="border-t bg-gray-50">
              <td colSpan={4} className="px-4 py-2 text-right text-xs font-medium text-gray-600">Total Received</td>
              <td className="px-4 py-2 text-right font-semibold tabular-nums">{fmt(paymentsTotal)}</td>
              {isAdmin && <td />}
            </tr>
          </tfoot>
        )}
      </table>

      {/* Add payment form */}
      {canAddPayment && (
        <form onSubmit={handleAdd} className="border-t p-4 bg-gray-50 space-y-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Record Payment</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Amount *</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Payment Date *</Label>
              <Input
                type="date"
                value={payDate}
                onChange={e => setPayDate(e.target.value)}
                required
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <select
                value={payType}
                onChange={e => setPayType(e.target.value as typeof PAYMENT_TYPES[number])}
                className="w-full border rounded-md px-2 py-1.5 text-sm h-8"
              >
                {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Payer</Label>
              <Input
                value={payer}
                onChange={e => setPayer(e.target.value)}
                placeholder="e.g. Blue Shield"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Check #</Label>
              <Input
                value={checkNum}
                onChange={e => setCheckNum(e.target.value)}
                placeholder="Optional"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional"
                className="h-8 text-sm"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" disabled={adding} size="sm"
            className="bg-[#1e5f8a] hover:bg-[#174f75] text-white">
            {adding ? "Saving…" : "Record Payment"}
          </Button>
        </form>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ClaimDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [claim,   setClaim]   = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const isBilling = session?.user?.role === "admin" || session?.user?.role === "staff";
  const isAdmin   = session?.user?.role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && !isBilling) router.push("/home");
  }, [status, isBilling, router]);

  const load = useCallback(() => {
    if (!params?.id) return;
    setLoading(true);
    fetch(`/api/claims/${params.id}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setClaim)
      .catch(e => setError(e === 404 ? "Claim not found." : "Failed to load claim."))
      .finally(() => setLoading(false));
  }, [params?.id]);

  useEffect(() => { load(); }, [load]);

  if (status === "loading" || (status === "authenticated" && !isBilling)) return null;

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e5f8a]" />
    </div>
  );

  if (error || !claim) return (
    <div className="space-y-4">
      <Link href="/billing/claims" className="text-sm text-[#1e5f8a] hover:underline">← Claims</Link>
      <p className="text-red-600">{error ?? "Claim not found."}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <Link href="/billing/claims" className="text-xs text-[#1e5f8a] hover:underline">← All Claims</Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {claim.claimNumber ? `Claim #${claim.claimNumber}` : `Claim #${claim.id}`}
            </h1>
            <StatusBadge status={claim.status} />
          </div>
          <p className="text-sm text-gray-500">
            {claim.patient.lastName}, {claim.patient.firstName} · {claim.patient.patientId}
          </p>
        </div>
        <StatusActions claim={claim} isAdmin={isAdmin} onUpdate={setClaim} />
      </div>

      {/* Info grid */}
      <div className="border rounded-md p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 bg-white">
        <InfoRow label="Patient" value={`${claim.patient.lastName}, ${claim.patient.firstName}`} />
        <InfoRow label="Insurance" value={claim.insurance?.name} />
        <InfoRow
          label="Visit"
          value={claim.visit
            ? <Link href={`/patients/${claim.patient.id}/visits/${claim.visit.id}`} className="text-[#1e5f8a] hover:underline">
                {claim.visit.visitDate?.slice(0, 10)} — {claim.visit.visitType}
              </Link>
            : null
          }
        />
        <InfoRow label="Claim Number" value={claim.claimNumber} />
        <InfoRow label="Submitted Date" value={claim.submittedDate} />
        <InfoRow label="Total Billed" value={fmt(claim.totalAmount)} />
        {claim.notes && (
          <div className="col-span-full">
            <p className="text-xs text-gray-500 mb-0.5">Notes</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{claim.notes}</p>
          </div>
        )}
      </div>

      {/* EDI / Billing fields */}
      <EdiFieldsSection claim={claim} onUpdate={setClaim} />

      {/* Medicare PDGM PPS calculation */}
      <MedicarePpsSection claim={claim} onUpdate={setClaim} />

      {/* 837i download + Billing Audit */}
      {claim.status !== "void" && (
        <div className="flex items-center gap-3 flex-wrap">
          <a
            href={`/api/claims/${claim.id}/837i`}
            download
            className="inline-flex items-center gap-1.5 text-xs bg-[#1e5f8a] hover:bg-[#174f75] text-white rounded-md px-3 py-2 font-medium"
          >
            <Download className="h-3.5 w-3.5" />
            Download 837i EDI
          </a>
          <a
            href={`/api/claims/${claim.id}/billing-audit`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md px-3 py-2 font-medium transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Billing Audit Report
          </a>
          {!claim.hippsCode && (
            <p className="text-xs text-orange-600">
              HIPPS not set — the PPS service line will be omitted from the 837i.
            </p>
          )}
        </div>
      )}

      {/* Billing codes */}
      <BillingCodesSection claim={claim} onUpdate={setClaim} />

      {/* Payments */}
      <PaymentsSection claim={claim} isAdmin={isAdmin} onUpdate={setClaim} />
    </div>
  );
}
