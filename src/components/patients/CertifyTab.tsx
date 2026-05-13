"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Upload, Lock, CheckCircle, AlertTriangle, Pencil, Check, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Episode = {
  id: number;
  episodeNumber: number;
  startDate: string;
  endDate: string;
  actualEnd: string | null;
  fbvAccrual: string | null;
  finalBill: string | null;
  held: boolean;
  pep: boolean;
  hippsFlag: boolean;
  medicaid: boolean;
  docStatus: string;
  admitNumber: string | null;
  isActive: boolean;
};

type OasisAssessment = {
  id: number;
  assessDate: string;
  assessmentReason: string;
  rfaCode: number;
  hippsCode: string | null;
  hhrgCode: string | null;
  status: "completed" | "locked_awaiting_export" | "exported";
  exportFileName: string | null;
  exportedAt: string | null;
  iqiesSubmissionId: string | null;
  correctionNum: number;
  completedBy: { name: string | null } | null;
};

type MdOrder = {
  id: number;
  effectiveDate: string | null;
  documentType: string;
  status: string;
  printed: boolean;
  signedAt: string | null;
  physicianId: number | null;
  clinicalNotes: string | null;
  physician: { firstName: string; lastName: string } | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  completed:              { label: "Completed",             cls: "bg-blue-50 text-blue-700 border-blue-200",   icon: null },
  locked_awaiting_export: { label: "Locked Awaiting Export", cls: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Lock },
  exported:               { label: "Exported",              cls: "bg-green-50 text-green-700 border-green-200",  icon: CheckCircle },
};

function OasisStatusBadge({ status }: { status: OasisAssessment["status"] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.completed;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.cls}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {cfg.label}
    </span>
  );
}

function daysBetween(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CertifyTab({ patientId, canEdit }: { patientId: number; canEdit: boolean }) {
  const [episodes,    setEpisodes]    = useState<Episode[]>([]);
  const [selected,    setSelected]    = useState<Episode | null>(null);
  const [assessments, setAssessments] = useState<OasisAssessment[]>([]);
  const [orders,      setOrders]      = useState<MdOrder[]>([]);
  const [detailTab,   setDetailTab]   = useState<"orders" | "assessments">("assessments");
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  // Episode form
  const [addingEp,  setAddingEp]  = useState(false);
  const [epDraft,   setEpDraft]   = useState({ startDate: "", endDate: "", episodeNumber: "" });
  const [savingEp,  setSavingEp]  = useState(false);

  // OASIS form
  const [addingOasis, setAddingOasis] = useState(false);
  const [oasisDraft,  setOasisDraft]  = useState({ assessDate: "", rfaCode: "4", hippsCode: "", notes: "" });
  const [savingOasis, setSavingOasis] = useState(false);

  // Export panel
  const [exportPanel, setExportPanel] = useState<number | null>(null);
  const [exportFile,  setExportFile]  = useState("");
  const [exporting,   setExporting]   = useState(false);

  // OASIS field editing
  const [editHipps,    setEditHipps]    = useState<number | null>(null);
  const [hippsDraft,   setHippsDraft]   = useState("");
  const [editIqies,    setEditIqies]    = useState<number | null>(null);
  const [iqiesDraft,   setIqiesDraft]   = useState("");

  const loadEpisodes = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/patients/${patientId}/episodes`);
    const rows: Episode[] = await res.json();
    // Sort descending by startDate (most recent first)
    rows.sort((a, b) => b.startDate.localeCompare(a.startDate));
    setEpisodes(rows);
    if (rows.length > 0 && !selected) setSelected(rows[0]);
    setLoading(false);
  }, [patientId, selected]);

  const loadDetails = useCallback(async (ep: Episode) => {
    const [aRes, oRes] = await Promise.all([
      fetch(`/api/patients/${patientId}/oasis`),
      fetch(`/api/patients/${patientId}/md-orders`),
    ]);
    const allAssessments: OasisAssessment[] = await aRes.json();
    const allOrders: MdOrder[] = await oRes.json();
    // Filter to episode
    setAssessments(allAssessments.filter((a: OasisAssessment & { episodeId?: number | null }) => a.episodeId === ep.id || a.episodeId == null));
    setOrders(allOrders.filter((o: MdOrder & { episodeId?: number | null }) => o.episodeId === ep.id));
  }, [patientId]);

  useEffect(() => { loadEpisodes(); }, [loadEpisodes]);
  useEffect(() => { if (selected) loadDetails(selected); }, [selected, loadDetails]);

  async function selectEpisode(ep: Episode) {
    setSelected(ep);
  }

  async function toggleEpisodeFlag(field: "held" | "pep" | "hippsFlag" | "medicaid" | "docStatus", value: unknown) {
    if (!selected || !canEdit) return;
    const res = await fetch(`/api/patients/${patientId}/episodes/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      const updated = await res.json();
      setEpisodes(prev => prev.map(e => e.id === updated.id ? updated : e));
      setSelected(updated);
    }
  }

  async function saveEpisode() {
    if (!epDraft.startDate || !epDraft.endDate) return;
    setSavingEp(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: epDraft.startDate,
          endDate: epDraft.endDate,
          episodeNumber: epDraft.episodeNumber ? parseInt(epDraft.episodeNumber) : episodes.length + 1,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      setAddingEp(false);
      setEpDraft({ startDate: "", endDate: "", episodeNumber: "" });
      await loadEpisodes();
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    setSavingEp(false);
  }

  async function saveOasis() {
    if (!oasisDraft.assessDate || !selected) return;
    setSavingOasis(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/oasis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeId: selected.id,
          assessDate: oasisDraft.assessDate,
          rfaCode: parseInt(oasisDraft.rfaCode),
          hippsCode: oasisDraft.hippsCode || undefined,
          notes: oasisDraft.notes || undefined,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      setAddingOasis(false);
      setOasisDraft({ assessDate: "", rfaCode: "4", hippsCode: "", notes: "" });
      await loadDetails(selected);
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    setSavingOasis(false);
  }

  async function lockOasis(aid: number) {
    const res = await fetch(`/api/patients/${patientId}/oasis/${aid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "locked_awaiting_export" }),
    });
    if (res.ok && selected) await loadDetails(selected);
  }

  async function exportOasis(aid: number) {
    if (!exportFile.trim()) return;
    setExporting(true);
    const res = await fetch(`/api/patients/${patientId}/oasis/${aid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "export", exportFileName: exportFile.trim() }),
    });
    if (res.ok && selected) {
      setExportPanel(null);
      setExportFile("");
      await loadDetails(selected);
    }
    setExporting(false);
  }

  async function saveHipps(aid: number) {
    const res = await fetch(`/api/patients/${patientId}/oasis/${aid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hippsCode: hippsDraft }),
    });
    if (res.ok && selected) {
      await loadDetails(selected);
      setEditHipps(null);
    }
  }

  async function saveIqies(aid: number) {
    const res = await fetch(`/api/patients/${patientId}/oasis/${aid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ iqiesSubmissionId: iqiesDraft }),
    });
    if (res.ok && selected) {
      await loadDetails(selected);
      setEditIqies(null);
    }
  }

  if (loading) return <p className="text-sm text-gray-400 py-4">Loading…</p>;

  const days = selected ? daysBetween(selected.startDate, selected.endDate) : 0;

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 text-xs rounded-md px-3 py-2 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
          <button className="ml-auto" onClick={() => setError(null)}><X className="h-3 w-3" /></button>
        </div>
      )}

      {/* ── Episode grid ────────────────────────────────────────────────────── */}
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide text-left">
              <th className="px-3 py-2">From-Date</th>
              <th className="px-3 py-2">Thru-Date</th>
              <th className="px-3 py-2">Actual-End</th>
              <th className="px-3 py-2">FBV/Accrual</th>
              <th className="px-3 py-2">Final-Bill</th>
              <th className="px-3 py-2 text-center">Held</th>
              <th className="px-3 py-2 text-center">Pep</th>
            </tr>
          </thead>
          <tbody>
            {episodes.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-gray-400">No certification periods yet</td></tr>
            )}
            {episodes.map(ep => (
              <tr
                key={ep.id}
                onClick={() => selectEpisode(ep)}
                className={`border-t cursor-pointer transition-colors ${
                  selected?.id === ep.id ? "bg-[#1e5f8a]/10 font-semibold" : "hover:bg-gray-50"
                }`}
              >
                <td className="px-3 py-1.5 tabular-nums">{ep.startDate}</td>
                <td className="px-3 py-1.5 tabular-nums">{ep.endDate}</td>
                <td className="px-3 py-1.5 tabular-nums text-gray-500">{ep.actualEnd ?? ""}</td>
                <td className="px-3 py-1.5 tabular-nums text-gray-600">{ep.fbvAccrual ?? ""}</td>
                <td className="px-3 py-1.5 tabular-nums text-gray-600">{ep.finalBill ?? ""}</td>
                <td className="px-3 py-1.5 text-center">{ep.held ? "☑" : "☐"}</td>
                <td className="px-3 py-1.5 text-center">{ep.pep  ? "☑" : "☐"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add episode form */}
        {addingEp && (
          <div className="border-t bg-blue-50 px-3 py-2 flex items-center gap-2 flex-wrap">
            <Input type="date" value={epDraft.startDate} onChange={e => setEpDraft(d => ({ ...d, startDate: e.target.value }))}
              className="h-7 text-xs w-36" placeholder="From" />
            <Input type="date" value={epDraft.endDate} onChange={e => setEpDraft(d => ({ ...d, endDate: e.target.value }))}
              className="h-7 text-xs w-36" placeholder="Thru" />
            <Input type="number" value={epDraft.episodeNumber} onChange={e => setEpDraft(d => ({ ...d, episodeNumber: e.target.value }))}
              className="h-7 text-xs w-20" placeholder="Period #" />
            <Button size="sm" className="h-7 bg-[#1e5f8a] text-white text-xs" disabled={savingEp} onClick={saveEpisode}>
              {savingEp ? "…" : "Add"}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAddingEp(false)}>Cancel</Button>
          </div>
        )}

        {/* Episode action bar */}
        {canEdit && (
          <div className="border-t px-3 py-1.5 flex items-center gap-1.5 bg-gray-50">
            <button onClick={() => setAddingEp(true)} title="Add period"
              className="w-6 h-6 flex items-center justify-center border rounded bg-white hover:bg-gray-100">
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button title="Remove selected period" disabled={!selected}
              className="w-6 h-6 flex items-center justify-center border rounded bg-white hover:bg-gray-100 disabled:opacity-40">
              <Minus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Selected episode details ─────────────────────────────────────────── */}
      {selected && (
        <>
          {/* Info bar */}
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <span className="text-[#1e5f8a] font-semibold">
              From: {selected.startDate} &nbsp; To: {selected.endDate} &nbsp; Days: {days}
            </span>
            <span className={`font-medium ${selected.docStatus === "all_docs_rcvd" ? "text-blue-600" : "text-orange-600"}`}>
              {selected.docStatus === "all_docs_rcvd" ? "All-Docs-Rcvd" : "Docs-Not-Rcvd"}
            </span>
            {canEdit && (
              <button
                onClick={() => toggleEpisodeFlag("docStatus", selected.docStatus === "all_docs_rcvd" ? "docs_not_rcvd" : "all_docs_rcvd")}
                className="text-gray-400 hover:text-[#1e5f8a] underline text-[10px]"
              >
                toggle
              </button>
            )}
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={selected.hippsFlag} className="accent-[#1e5f8a]"
                onChange={() => canEdit && toggleEpisodeFlag("hippsFlag", !selected.hippsFlag)} />
              <span>Hipps</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={selected.medicaid} className="accent-[#1e5f8a]"
                onChange={() => canEdit && toggleEpisodeFlag("medicaid", !selected.medicaid)} />
              <span>Medicaid</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={selected.pep} className="accent-[#1e5f8a]"
                onChange={() => canEdit && toggleEpisodeFlag("pep", !selected.pep)} />
              <span>Pep</span>
            </label>
          </div>

          {/* Orders / Assessments tabs */}
          <div className="border rounded-md overflow-hidden">
            <div className="flex border-b bg-gray-50">
              {(["orders", "assessments"] as const).map(t => (
                <button key={t} onClick={() => setDetailTab(t)}
                  className={`px-4 py-2 text-xs font-medium border-b-2 capitalize transition-colors ${
                    detailTab === t ? "border-[#1e5f8a] text-[#1e5f8a] bg-white" : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Assessments tab */}
            {detailTab === "assessments" && (
              <div>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide text-left">
                      <th className="px-3 py-2">Assess-Date</th>
                      <th className="px-3 py-2">Assessment-Reason</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">HIPPS</th>
                      <th className="px-3 py-2">HHRG</th>
                      <th className="px-3 py-2">iQIES ID</th>
                      {canEdit && <th className="px-3 py-2 w-28" />}
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.length === 0 && (
                      <tr><td colSpan={7} className="px-3 py-4 text-center text-gray-400">No OASIS assessments for this period</td></tr>
                    )}
                    {assessments.map(a => (
                      <tr key={a.id} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2 tabular-nums font-medium">{a.assessDate}</td>
                        <td className="px-3 py-2">{a.assessmentReason}</td>
                        <td className="px-3 py-2"><OasisStatusBadge status={a.status} /></td>

                        {/* HIPPS inline edit */}
                        <td className="px-3 py-2">
                          {editHipps === a.id ? (
                            <span className="flex items-center gap-1">
                              <input className="border rounded px-1 py-0.5 text-xs w-20 font-mono" value={hippsDraft} autoFocus
                                onChange={e => setHippsDraft(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") saveHipps(a.id); if (e.key === "Escape") setEditHipps(null); }} />
                              <button onClick={() => saveHipps(a.id)} className="text-green-600"><Check className="h-3 w-3" /></button>
                              <button onClick={() => setEditHipps(null)} className="text-gray-400"><X className="h-3 w-3" /></button>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 group">
                              <span className="font-mono text-[#1e5f8a]">{a.hippsCode ?? "—"}</span>
                              {canEdit && <button onClick={() => { setEditHipps(a.id); setHippsDraft(a.hippsCode ?? ""); }}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-[#1e5f8a]">
                                <Pencil className="h-3 w-3" />
                              </button>}
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-2 font-mono text-gray-500">{a.hhrgCode ?? "—"}</td>

                        {/* iQIES submission ID inline edit */}
                        <td className="px-3 py-2">
                          {editIqies === a.id ? (
                            <span className="flex items-center gap-1">
                              <input className="border rounded px-1 py-0.5 text-xs w-24 font-mono" value={iqiesDraft} autoFocus
                                onChange={e => setIqiesDraft(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") saveIqies(a.id); if (e.key === "Escape") setEditIqies(null); }} />
                              <button onClick={() => saveIqies(a.id)} className="text-green-600"><Check className="h-3 w-3" /></button>
                              <button onClick={() => setEditIqies(null)} className="text-gray-400"><X className="h-3 w-3" /></button>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 group">
                              <span className="font-mono text-xs text-gray-500">{a.iqiesSubmissionId ?? "—"}</span>
                              {canEdit && a.status === "exported" && (
                                <button onClick={() => { setEditIqies(a.id); setIqiesDraft(a.iqiesSubmissionId ?? ""); }}
                                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-[#1e5f8a]">
                                  <Pencil className="h-3 w-3" />
                                </button>
                              )}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        {canEdit && (
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              {a.status === "completed" && (
                                <button onClick={() => lockOasis(a.id)} title="Lock for export"
                                  className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100">
                                  <Lock className="h-3 w-3" /> Lock
                                </button>
                              )}
                              {a.status === "locked_awaiting_export" && exportPanel !== a.id && (
                                <button onClick={() => { setExportPanel(a.id); setExportFile(`${selected.endDate.replace(/-/g, "_")}_export.zip`); }}
                                  title="Post / Export to iQIES"
                                  className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-[#1e5f8a] bg-[#1e5f8a]/10 text-[#1e5f8a] hover:bg-[#1e5f8a]/20">
                                  <Upload className="h-3 w-3" /> Post
                                </button>
                              )}
                              {a.status === "exported" && a.exportFileName && (
                                <span className="text-[10px] text-green-600 font-mono">{a.exportFileName}</span>
                              )}
                            </div>
                            {/* Export panel */}
                            {exportPanel === a.id && (
                              <div className="mt-2 p-2 border rounded bg-gray-50 space-y-2">
                                <p className="text-[10px] font-semibold uppercase text-gray-500">Assessment Export</p>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-gray-500 shrink-0">File:</span>
                                  <input className="border rounded px-1.5 py-0.5 text-[10px] font-mono flex-1"
                                    value={exportFile} onChange={e => setExportFile(e.target.value)} />
                                </div>
                                <div className="flex gap-1.5">
                                  <button onClick={() => exportOasis(a.id)} disabled={exporting || !exportFile.trim()}
                                    className="text-[10px] px-2 py-0.5 rounded bg-[#1e5f8a] text-white disabled:opacity-50">
                                    {exporting ? "…" : "Post"}
                                  </button>
                                  <button onClick={() => setExportPanel(null)}
                                    className="text-[10px] px-2 py-0.5 rounded border text-gray-600">
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Add OASIS form */}
                {addingOasis && (
                  <div className="border-t px-3 py-2 bg-blue-50 space-y-2">
                    <p className="text-[10px] font-semibold uppercase text-gray-500">New OASIS Assessment</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Input type="date" value={oasisDraft.assessDate} onChange={e => setOasisDraft(d => ({ ...d, assessDate: e.target.value }))}
                        className="h-7 text-xs w-36" />
                      <select value={oasisDraft.rfaCode} onChange={e => setOasisDraft(d => ({ ...d, rfaCode: e.target.value }))}
                        className="h-7 text-xs border rounded px-1.5 bg-white">
                        <option value="1">RFA 1 – Start of Care</option>
                        <option value="3">RFA 3 – Resumption</option>
                        <option value="4">RFA 4 – Follow-up</option>
                        <option value="5">RFA 5 – Other</option>
                        <option value="9">RFA 9 – Discharge</option>
                      </select>
                      <Input value={oasisDraft.hippsCode} onChange={e => setOasisDraft(d => ({ ...d, hippsCode: e.target.value }))}
                        placeholder="HIPPS code" className="h-7 text-xs w-24 font-mono" />
                      <Button size="sm" className="h-7 bg-[#1e5f8a] text-white text-xs" disabled={savingOasis || !oasisDraft.assessDate} onClick={saveOasis}>
                        {savingOasis ? "…" : "Add"}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAddingOasis(false)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {canEdit && !addingOasis && (
                  <div className="border-t px-3 py-1.5 flex gap-1 bg-gray-50">
                    <button onClick={() => setAddingOasis(true)}
                      className="w-6 h-6 flex items-center justify-center border rounded bg-white hover:bg-gray-100">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Orders tab */}
            {detailTab === "orders" && (
              <div>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide text-left">
                      <th className="px-3 py-2">Order-Date</th>
                      <th className="px-3 py-2">Document-Type</th>
                      <th className="px-3 py-2">Doctor-Name</th>
                      <th className="px-3 py-2 text-center">Printed</th>
                      <th className="px-3 py-2 text-center">Signed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 && (
                      <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-400">No orders for this period</td></tr>
                    )}
                    {orders.map(o => (
                      <tr key={o.id} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2 tabular-nums">{o.effectiveDate ?? "—"}</td>
                        <td className="px-3 py-2 font-semibold">{o.documentType}</td>
                        <td className="px-3 py-2">
                          {o.physician ? `${o.physician.lastName}, ${o.physician.firstName}` : "—"}
                        </td>
                        <td className="px-3 py-2 text-center">{o.printed ? "☑" : "☐"}</td>
                        <td className="px-3 py-2 text-center">{o.status === "signed" ? "☑" : "☐"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
