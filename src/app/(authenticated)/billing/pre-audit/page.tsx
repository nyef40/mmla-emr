"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle2, FileText, Search } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type InsurancePrimary = { name?: string; policyNumber?: string; category?: string } | null;

type ChargeRow = {
  id: number;
  chargeDate: string;
  chargeCode: string;
  quantity: number;
  visitTime: string | null;
  billedAmount: string | null;
  computedAmount: string | null;
  verified: boolean;
  notes: string | null;
  patient: {
    id: number; firstName: string; lastName: string; patientId: string;
    socDate: string | null; insurancePrimary: InsurancePrimary;
  };
  clinician: { name: string | null } | null;
  billingCode: { description: string; revCode: string | null } | null;
};

type PatientGroup = {
  patientId: number;
  patient: ChargeRow["patient"];
  charges: ChargeRow[];
  selected: Set<number>;
};

type Episode = {
  id: number; episodeNumber: number;
  startDate: string; endDate: string;
  hippsFlag: boolean; docStatus: string;
};

type AuditResult = {
  charges: ChargeRow[];
  pendingCount: number;
  existingClaim: { id: number; claimNumber: string | null; status: string; periodStart: string; periodEnd: string } | null;
};

// ── Sub-nav ───────────────────────────────────────────────────────────────────

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
            pathname === href
              ? "border-[#1e5f8a] text-[#1e5f8a]"
              : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
          }`}
        >{label}</Link>
      ))}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(amount: string | number | null) {
  if (amount === null || amount === undefined || amount === "") return "—";
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function isMedicareCategory(category: string | undefined) {
  if (!category) return false;
  return category.toLowerCase().startsWith("medicare");
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── Audit Panel ───────────────────────────────────────────────────────────────

function AuditPanel({
  patient,
  startDate,
  endDate,
  result,
  onPosted,
}: {
  patient: PatientGroup["patient"];
  startDate: string;
  endDate: string;
  result: AuditResult;
  onPosted: () => void;
}) {
  const [postForm, setPostForm] = useState({
    tobCode: "329",
    hippsCode: "",
    claimNumber: "",
    totalOverride: "",
    notes: "",
  });
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(() => new Set(result.charges.map(c => c.id)));
  const [overridePeriod, setOverridePeriod] = useState(false);

  const isMedicare = isMedicareCategory(patient.insurancePrimary?.category);

  function chargeTotal() {
    return result.charges
      .filter(c => selected.has(c.id))
      .reduce((s, c) => s + parseFloat(c.billedAmount ?? c.computedAmount ?? "0"), 0);
  }

  const today = new Date().toISOString().slice(0, 10);
  const periodIncomplete = endDate >= today;
  const canPost = !result.existingClaim && result.charges.length > 0 && selected.size > 0;

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!canPost) return;
    const chargeIds = Array.from(selected);
    const totalAmount = postForm.totalOverride || chargeTotal().toFixed(2);
    setPosting(true); setPostError(null);
    try {
      const res = await fetch("/api/billing/pre-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          chargeIds,
          periodStart: startDate,
          periodEnd: endDate,
          tobCode: postForm.tobCode,
          hippsCode: postForm.hippsCode || undefined,
          claimNumber: postForm.claimNumber || undefined,
          totalAmount,
          notes: postForm.notes || undefined,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? "Failed"); }
      onPosted();
    } catch (e) {
      setPostError(e instanceof Error ? e.message : "Error posting claim");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="border rounded-md overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-[#1e5f8a]/5 border-b px-4 py-3 flex items-start justify-between">
        <div>
          <p className="font-semibold text-sm">
            {patient.lastName}, {patient.firstName}
            <span className="ml-2 font-mono text-xs text-gray-500">{patient.patientId}</span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {patient.insurancePrimary?.name ?? "No insurance"}
            {patient.insurancePrimary?.policyNumber && <> · MBI/ID: {patient.insurancePrimary.policyNumber}</>}
            {patient.socDate && <> · Admit: {patient.socDate}</>}
          </p>
          <p className="text-xs font-medium text-gray-700 mt-1">
            Period: {startDate} — {endDate}
          </p>
        </div>
        <div className="text-right space-y-1">
          {isMedicare && (
            <span className="inline-flex text-xs bg-blue-100 text-blue-800 border border-blue-200 rounded px-2 py-0.5">
              Medicare PDGM
            </span>
          )}
          <div className="flex flex-col gap-0.5 text-xs">
            {result.existingClaim ? (
              <span className="text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Claim #{result.existingClaim.claimNumber ?? result.existingClaim.id} ({result.existingClaim.status}) already covers this period
              </span>
            ) : (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> No prior claim
              </span>
            )}
            {result.pendingCount > 0 ? (
              <span className="text-orange-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {result.pendingCount} unverified charge{result.pendingCount !== 1 ? "s" : ""} in period
              </span>
            ) : (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> No pending charges
              </span>
            )}
            {periodIncomplete && isMedicare && (
              <span className="text-orange-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Period not yet complete
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Charges table */}
      {result.charges.length === 0 ? (
        <div className="px-4 py-8 text-center text-gray-400 text-sm">
          No verified unposted charges in this period.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 uppercase tracking-wide">
                <th className="px-3 py-2 w-8"></th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Rev</th>
                <th className="px-3 py-2">Employee</th>
                <th className="px-3 py-2 text-right">Hrs</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {result.charges.map(c => (
                <tr key={c.id} className={`border-t hover:bg-gray-50 ${!selected.has(c.id) ? "opacity-40" : ""}`}>
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selected.has(c.id)}
                      onChange={() => {
                        setSelected(prev => {
                          const s = new Set(prev);
                          s.has(c.id) ? s.delete(c.id) : s.add(c.id);
                          return s;
                        });
                      }}
                      className="h-3.5 w-3.5 accent-[#1e5f8a]" />
                  </td>
                  <td className="px-3 py-2 tabular-nums">{c.chargeDate}</td>
                  <td className="px-3 py-2 font-mono font-semibold text-[#1e5f8a]">{c.chargeCode}</td>
                  <td className="px-3 py-2 text-gray-600">{c.billingCode?.description ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-gray-500">{c.billingCode?.revCode ?? "—"}</td>
                  <td className="px-3 py-2">{c.clinician?.name ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.visitTime ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.quantity}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">
                    {fmt(c.billedAmount ?? c.computedAmount)}
                    {!c.billedAmount && c.computedAmount && <span className="text-gray-400 ml-1 text-[10px]">(est)</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-gray-50 font-semibold">
                <td colSpan={8} className="px-3 py-2 text-right text-gray-600 text-xs">
                  {selected.size} of {result.charges.length} charges selected · Billed total
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(chargeTotal())}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Post form */}
      {result.existingClaim ? null : (
        <form onSubmit={handlePost} className="border-t bg-yellow-50 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-yellow-800">Post Claim</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {isMedicare && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">HIPPS Code</Label>
                  <Input value={postForm.hippsCode} placeholder="e.g. 3BA21"
                    onChange={e => setPostForm(p => ({ ...p, hippsCode: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">TOB Code</Label>
                  <Input value={postForm.tobCode} placeholder="329"
                    onChange={e => setPostForm(p => ({ ...p, tobCode: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">PPS / Billed Total ($) *</Label>
                  <Input type="number" min="0" step="0.01"
                    value={postForm.totalOverride}
                    placeholder={chargeTotal().toFixed(2)}
                    onChange={e => setPostForm(p => ({ ...p, totalOverride: e.target.value }))} />
                </div>
              </>
            )}
            {!isMedicare && (
              <div className="space-y-1">
                <Label className="text-xs">Total Override ($)</Label>
                <Input type="number" min="0" step="0.01"
                  value={postForm.totalOverride}
                  placeholder={chargeTotal().toFixed(2)}
                  onChange={e => setPostForm(p => ({ ...p, totalOverride: e.target.value }))} />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Claim # (optional)</Label>
              <Input value={postForm.claimNumber} placeholder="e.g. 4314-125"
                onChange={e => setPostForm(p => ({ ...p, claimNumber: e.target.value }))} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Notes</Label>
              <Input value={postForm.notes} placeholder="Optional"
                onChange={e => setPostForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          {isMedicare && (
            <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
              Medicare PDGM: enter the PPS billed total from your billing audit report (e.g. $2,834.98), not the sum of charges.
              The HIPPS code and TOB will appear on the 837i.
            </p>
          )}
          {isMedicare && periodIncomplete && (
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={overridePeriod}
                onChange={e => setOverridePeriod(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 accent-orange-600"
              />
              <span className="text-xs text-orange-700">
                All visits for this period are complete — post early (period ends {endDate})
              </span>
            </label>
          )}
          {postError && <p className="text-xs text-red-600">{postError}</p>}
          <div className="flex gap-2 items-center">
            <Button type="submit" size="sm"
              className="bg-[#1e5f8a] hover:bg-[#174f75] text-white"
              disabled={posting || !canPost || (periodIncomplete && isMedicare && !overridePeriod)}>
              <FileText className="h-3.5 w-3.5 mr-1" />
              {posting ? "Posting…" : `Post Claim (${selected.size} charges)`}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PreAuditPage() {
  // Overview (all patients with unposted verified charges)
  const [groups, setGroups]       = useState<PatientGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Selector panel state
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [episodes, setEpisodes]   = useState<Episode[]>([]);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState("");
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd]     = useState("");

  // Audit result
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditError, setAuditError]    = useState<string | null>(null);
  const [postSuccess, setPostSuccess]  = useState<string | null>(null);

  const loadRef = useRef(false);

  const loadGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const res = await fetch("/api/billing/pre-audit");
      const rows: ChargeRow[] = await res.json();
      const map = new Map<number, PatientGroup>();
      for (const row of rows) {
        const pid = row.patient.id;
        if (!map.has(pid)) map.set(pid, { patientId: pid, patient: row.patient, charges: [], selected: new Set() });
        const g = map.get(pid)!;
        g.charges.push(row);
        g.selected.add(row.id);
      }
      setGroups(Array.from(map.values()));
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  useEffect(() => {
    if (loadRef.current) return;
    loadRef.current = true;
    loadGroups();
  }, [loadGroups]);

  // When patient selected, fetch episodes if Medicare
  const selectedGroup = groups.find(g => String(g.patientId) === selectedPatientId);
  const isMedicare = isMedicareCategory(selectedGroup?.patient.insurancePrimary?.category);

  useEffect(() => {
    if (!selectedPatientId || !isMedicare) { setEpisodes([]); setSelectedEpisodeId(""); return; }
    fetch(`/api/patients/${selectedPatientId}/episodes`)
      .then(r => r.json())
      .then((rows: Episode[]) => {
        setEpisodes(rows);
        setSelectedEpisodeId("");
      })
      .catch(() => setEpisodes([]));
  }, [selectedPatientId, isMedicare]);

  // When episode selected, auto-fill dates
  useEffect(() => {
    if (!selectedEpisodeId) return;
    const ep = episodes.find(e => String(e.id) === selectedEpisodeId);
    if (ep) { setManualStart(ep.startDate); setManualEnd(ep.endDate); }
  }, [selectedEpisodeId, episodes]);

  // For Medicare without episodes: auto-calculate 30-day end date from start
  useEffect(() => {
    if (!isMedicare || selectedEpisodeId || !manualStart) return;
    setManualEnd(addDays(manualStart, 29));
  }, [isMedicare, selectedEpisodeId, manualStart]);

  function resetAudit() {
    setAuditResult(null); setAuditError(null);
  }

  function handlePatientChange(pid: string) {
    setSelectedPatientId(pid);
    setSelectedEpisodeId("");
    setManualStart(""); setManualEnd("");
    resetAudit();
  }

  async function loadAudit() {
    if (!selectedPatientId || !manualStart || !manualEnd) return;
    setLoadingAudit(true); setAuditError(null); setAuditResult(null);
    try {
      const url = `/api/billing/pre-audit?patientId=${selectedPatientId}&startDate=${manualStart}&endDate=${manualEnd}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      const data: AuditResult = await res.json();
      setAuditResult(data);
    } catch (e) {
      setAuditError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoadingAudit(false);
    }
  }

  function handlePosted() {
    const g = selectedGroup;
    const msg = g ? `Claim posted for ${g.patient.firstName} ${g.patient.lastName} — ${manualStart} to ${manualEnd}` : "Claim posted";
    setPostSuccess(msg);
    setTimeout(() => setPostSuccess(null), 7000);
    resetAudit();
    setSelectedPatientId(""); setSelectedEpisodeId("");
    setManualStart(""); setManualEnd("");
    loadRef.current = false;
    loadGroups();
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <BillingSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Billing Pre-Audit</h1>
          <p className="text-xs text-gray-500 mt-0.5">Select a patient and period, review charges, then post the claim</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => { resetAudit(); loadRef.current = false; loadGroups(); }}>
          Refresh
        </Button>
      </div>

      {postSuccess && (
        <div className="bg-green-50 border border-green-300 text-green-800 text-sm rounded-md px-4 py-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {postSuccess}
        </div>
      )}

      {/* ── Selector panel ── */}
      <div className="border rounded-md p-4 bg-gray-50 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 flex items-center gap-1.5">
          <Search className="h-3.5 w-3.5" /> Select patient and billing period
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Patient */}
          <div className="space-y-1">
            <Label className="text-xs">Patient *</Label>
            <select
              value={selectedPatientId}
              onChange={e => handlePatientChange(e.target.value)}
              className="w-full h-9 rounded-md border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]"
            >
              <option value="">— Select patient with unposted charges —</option>
              {groups.map(g => (
                <option key={g.patientId} value={g.patientId}>
                  {g.patient.lastName}, {g.patient.firstName} ({g.patient.patientId}) — {g.charges.length} charge{g.charges.length !== 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Insurance badge */}
          {selectedGroup && (
            <div className="space-y-1">
              <Label className="text-xs">Insurance</Label>
              <div className="flex items-center h-9 gap-2">
                <span className={`text-xs font-medium px-2 py-1 rounded border ${
                  isMedicare
                    ? "bg-blue-50 text-blue-800 border-blue-200"
                    : "bg-orange-50 text-orange-800 border-orange-200"
                }`}>
                  {selectedGroup.patient.insurancePrimary?.name ?? "Unknown"}
                </span>
                {isMedicare && <span className="text-xs text-blue-600">PDGM / 30-day period</span>}
              </div>
            </div>
          )}
        </div>

        {selectedPatientId && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Medicare: episode picker or 30-day range */}
            {isMedicare && episodes.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">Certification Episode (auto-fills dates)</Label>
                <select
                  value={selectedEpisodeId}
                  onChange={e => setSelectedEpisodeId(e.target.value)}
                  className="w-full h-9 rounded-md border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]"
                >
                  <option value="">— Pick episode or enter 30-day dates below —</option>
                  {episodes.map(ep => (
                    <option key={ep.id} value={ep.id}>
                      Ep #{ep.episodeNumber}: {ep.startDate} – {ep.endDate}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-blue-600">
                  For Medicare PDGM adjust end date to 30-day boundary (start + 29 days)
                </p>
              </div>
            )}

            {/* Start date */}
            <div className="space-y-1">
              <Label className="text-xs">
                {isMedicare ? "Period Start (30-day)" : "From Date"} *
              </Label>
              <Input
                type="date"
                value={manualStart}
                max={today}
                onChange={e => { setManualStart(e.target.value); if (!isMedicare) setManualEnd(""); resetAudit(); }}
                className="h-9 text-sm"
              />
            </div>

            {/* End date */}
            <div className="space-y-1">
              <Label className="text-xs">
                {isMedicare ? "Period End (start + 29 days for Medicare)" : "To Date"} *
              </Label>
              <Input
                type="date"
                value={manualEnd}
                readOnly={isMedicare && !selectedEpisodeId && Boolean(manualStart)}
                onChange={e => { setManualEnd(e.target.value); resetAudit(); }}
                className={`h-9 text-sm ${isMedicare && !selectedEpisodeId && manualStart ? "bg-gray-100 text-gray-500" : ""}`}
              />
            </div>
          </div>
        )}

        {selectedPatientId && manualStart && manualEnd && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-[#1e5f8a] hover:bg-[#174f75] text-white"
              onClick={loadAudit}
              disabled={loadingAudit}
            >
              {loadingAudit ? "Loading…" : "Load Charges →"}
            </Button>
            {auditResult && (
              <Button size="sm" variant="ghost" onClick={resetAudit}>Clear</Button>
            )}
          </div>
        )}
      </div>

      {/* ── Audit Result ── */}
      {auditError && (
        <div className="bg-red-50 border border-red-300 text-red-800 text-sm rounded-md px-4 py-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> {auditError}
        </div>
      )}

      {auditResult && selectedGroup && (
        <AuditPanel
          patient={selectedGroup.patient}
          startDate={manualStart}
          endDate={manualEnd}
          result={auditResult}
          onPosted={handlePosted}
        />
      )}

      {/* ── Patient charge summary (shown when patient selected, before audit loads) ── */}
      {selectedPatientId && selectedGroup && !auditResult && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">
            Unposted verified charges — {selectedGroup.patient.firstName} {selectedGroup.patient.lastName}
          </p>
          {selectedGroup.charges.length === 0 ? (
            <div className="border rounded-md p-6 text-center">
              <CheckCircle2 className="h-7 w-7 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">No unposted verified charges for this patient</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <div className="text-xs divide-y">
                {selectedGroup.charges.map(c => (
                  <div key={c.id} className="px-4 py-2 flex items-center justify-between">
                    <span className="tabular-nums text-gray-500">{c.chargeDate}</span>
                    <span className="font-mono text-[#1e5f8a] font-semibold">{c.chargeCode}</span>
                    <span className="text-gray-600">{c.billingCode?.description ?? "—"}</span>
                    <span className="tabular-nums font-medium">
                      {fmt(c.billedAmount ?? c.computedAmount)}
                      {!c.billedAmount && <span className="text-gray-400 ml-1">(est)</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
