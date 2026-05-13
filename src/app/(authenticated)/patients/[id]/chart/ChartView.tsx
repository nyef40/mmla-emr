"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Folder, ChevronDown, ChevronRight, Trash2, Upload, FileText, X } from "lucide-react";

// ─── Serialisable types (no Date objects) ────────────────────────────────────

export type EpisodeRow = {
  id: number;
  episodeNumber: number;
  chartNumber: string | null;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;
  isActive: boolean;
};

export type MdOrderRow = {
  id: number;
  date: string;
  createdBy: string;
  status: string;
  orderType: string;
};

export type VisitRow = {
  id: number;
  date: string;
  visitType: string;
  clinician: string;
  formStatus: string;
};

export type IrodsRow = {
  id: number;
  date: string;
  completedBy: string;
  rawScore: number;
};

export type DocRow = {
  id: number;
  episodeId: number | null;
  category: string;
  displayName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  docDate: string;
  notes: string | null;
  uploadedBy: { name: string | null } | null;
};

export type ChartViewProps = {
  patientId: number;
  patientMrn: string;
  socDate: string | null;
  admissionStatus: string;
  episodes: EpisodeRow[];
  mdOrders: MdOrderRow[];
  visits: VisitRow[];
  irods: IrodsRow[];
  isAdmin: boolean;
};

// ─── Document categories (mirrors Netsmart chart tree) ────────────────────────

const DOC_CATEGORIES = [
  "Physicians Orders",
  "Plan of Care/OASIS",
  "Nurses Clinical Notes",
  "Infusion Therapy",
  "Clinical Notes",
  "Medication",
  "Physical Therapy Notes",
  "Occupational Therapy Notes",
  "Speech Therapy Notes",
  "Social Service Notes",
  "Home Health Aide Notes",
  "Patient Data",
  "Miscellaneous",
  "Client Documentation",
  "NonCategory",
] as const;

// ─── Visit type → chart section mapping ──────────────────────────────────────

function visitSection(visitType: string): string {
  switch (visitType) {
    case "SN Recert Visit":        return "Plan of Care/OASIS";
    case "SN Infusion":            return "Infusion Therapy";
    case "SN Wound Care":          return "Infusion Therapy";
    case "SN Medication Teaching": return "Medication";
    case "SN Assessment":          return "Nurses Clinical Notes";
    default:                       return "Nurses Clinical Notes";
  }
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const MD_STATUS: Record<string, { label: string; cls: string }> = {
  draft:      { label: "Draft",       cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  sent_to_md: { label: "Sent to MD",  cls: "bg-blue-50 text-blue-700 border-blue-200" },
  signed:     { label: "Signed",      cls: "bg-green-50 text-green-700 border-green-200" },
  expired:    { label: "Expired",     cls: "bg-gray-100 text-gray-500 border-gray-300" },
};

const VISIT_STATUS: Record<string, { label: string; cls: string }> = {
  draft:            { label: "Pending",          cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  signed:           { label: "Sent to Office",   cls: "bg-blue-50 text-blue-700 border-blue-200" },
  completed:        { label: "Completed",        cls: "bg-green-50 text-green-700 border-green-200" },
  needs_correction: { label: "Needs Correction", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  locked:           { label: "Locked",           cls: "bg-gray-100 text-gray-500 border-gray-300" },
};

function StatusBadge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>{label}</span>
  );
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function parseLocalDate(d: string): Date {
  const [y, m, day] = d.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, day);
}

function fmtDate(d: string) {
  return parseLocalDate(d).toLocaleDateString("en-US", {
    month: "2-digit", day: "2-digit", year: "numeric",
  });
}

function findEpisodeId(date: string, episodes: EpisodeRow[]): number | null {
  const d = parseLocalDate(date);
  for (const ep of [...episodes].sort(
    (a, b) => parseLocalDate(b.startDate).getTime() - parseLocalDate(a.startDate).getTime()
  )) {
    const start = parseLocalDate(ep.startDate);
    const end   = parseLocalDate(ep.endDate);
    if (d >= start && d <= end) return ep.id;
  }
  return null;
}

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Table rows ───────────────────────────────────────────────────────────────

function FormRow({ children }: { children: React.ReactNode }) {
  return (
    <tr className="border-b last:border-0 hover:bg-gray-50 transition-colors">
      {children}
    </tr>
  );
}

// ─── Collapsible category within an episode ───────────────────────────────────

function Category({
  label,
  children,
  catKey,
  defaultOpen = true,
}: {
  label: string;
  children: React.ReactNode;
  catKey: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <tr
        className="cursor-pointer select-none bg-gray-100 hover:bg-gray-200 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <td colSpan={6} className="px-4 py-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wide">
            {open
              ? <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
              : <ChevronRight className="h-3.5 w-3.5 text-gray-500" />}
            {label}
          </div>
        </td>
      </tr>
      {open && children}
    </>
  );
}

// ─── Upload Dialog ────────────────────────────────────────────────────────────

function UploadDialog({
  patientId,
  episodes,
  initialEpisodeId,
  onClose,
  onUploaded,
}: {
  patientId: number;
  episodes: EpisodeRow[];
  initialEpisodeId: number | null;
  onClose: () => void;
  onUploaded: (doc: DocRow) => void;
}) {
  const [episodeId, setEpisodeId]     = useState<string>(initialEpisodeId ? String(initialEpisodeId) : "");
  const [category,  setCategory]      = useState<string>("NonCategory");
  const [displayName, setDisplayName] = useState("");
  const [docDate,   setDocDate]       = useState(new Date().toISOString().slice(0, 10));
  const [notes,     setNotes]         = useState("");
  const [file,      setFile]          = useState<File | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [error,     setError]         = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f && !displayName) setDisplayName(f.name.replace(/\.[^.]+$/, ""));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Please select a file."); return; }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (episodeId) fd.append("episodeId", episodeId);
      fd.append("category", category);
      fd.append("displayName", displayName || file.name);
      fd.append("docDate", docDate);
      if (notes) fd.append("notes", notes);

      const res = await fetch(`/api/patients/${patientId}/documents`, { method: "POST", body: fd });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let msg = "Upload failed.";
        try { const j = JSON.parse(text); msg = j.error ?? j.message ?? msg; } catch { /* not JSON */ }
        setError(msg);
        return;
      }
      const doc: DocRow = await res.json();
      onUploaded(doc);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setUploading(false);
    }
  }

  const sortedEps = [...episodes].sort(
    (a, b) => parseLocalDate(b.startDate).getTime() - parseLocalDate(a.startDate).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Upload className="h-4 w-4 text-[#1a6fa5]" />
            Upload Document to Patient Chart
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Chart location */}
          <div className="bg-gray-50 rounded-md border p-3 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Chart Location</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Episode</label>
              <select
                value={episodeId}
                onChange={e => setEpisodeId(e.target.value)}
                className="w-full border rounded px-2.5 py-1.5 text-sm"
              >
                <option value="">No episode / Unassigned</option>
                {sortedEps.map(ep => (
                  <option key={ep.id} value={String(ep.id)}>
                    Episode #{ep.episodeNumber} ({fmtDate(ep.startDate)} – {fmtDate(ep.endDate)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Section / Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full border rounded px-2.5 py-1.5 text-sm"
              >
                {DOC_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Document info */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. OASIS SOC Assessment"
                className="w-full border rounded px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Document Date</label>
              <input
                type="date"
                value={docDate}
                onChange={e => setDocDate(e.target.value)}
                className="border rounded px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">File</label>
              <input
                ref={fileRef}
                type="file"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-gray-300 file:text-xs file:bg-gray-50 file:cursor-pointer"
              />
              {file && (
                <p className="mt-1 text-xs text-gray-400">{file.name} — {fmtBytes(file.size)}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full border rounded px-2.5 py-1.5 text-sm resize-none"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-sm rounded border text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-1.5 text-sm rounded bg-[#1a6fa5] text-white hover:bg-[#155d8e] disabled:opacity-60"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Single episode block ──────────────────────────────────────────────────────

function EpisodeBlock({
  ep,
  patientId,
  mdOrders,
  visits,
  irods,
  docs,
  isAdmin,
  selectedVisits,
  onToggleVisit,
  onDeleteOrder,
  onDeleteVisit,
  onDeleteIrods,
  onDeleteDoc,
  onUploadClick,
}: {
  ep: EpisodeRow;
  patientId: number;
  mdOrders: MdOrderRow[];
  visits: VisitRow[];
  irods: IrodsRow[];
  docs: DocRow[];
  isAdmin: boolean;
  selectedVisits: Set<number>;
  onToggleVisit: (id: number) => void;
  onDeleteOrder: (id: number) => void;
  onDeleteVisit: (id: number) => void;
  onDeleteIrods: (id: number) => void;
  onDeleteDoc: (id: number) => void;
  onUploadClick: (episodeId: number | null) => void;
}) {
  const [open, setOpen] = useState(true);

  // Map every item to its chart section
  const secOrders = new Map<string, MdOrderRow[]>();
  const secVisits = new Map<string, VisitRow[]>();
  const secIrods  = new Map<string, IrodsRow[]>();
  const secDocs   = new Map<string, DocRow[]>();

  mdOrders.forEach(o => {
    const k = "Physicians Orders";
    secOrders.set(k, [...(secOrders.get(k) ?? []), o]);
  });
  visits.forEach(v => {
    const k = visitSection(v.visitType);
    secVisits.set(k, [...(secVisits.get(k) ?? []), v]);
  });
  irods.forEach(a => {
    const k = "Clinical Notes";
    secIrods.set(k, [...(secIrods.get(k) ?? []), a]);
  });
  docs.forEach(d => {
    const k = d.category ?? "NonCategory";
    secDocs.set(k, [...(secDocs.get(k) ?? []), d]);
  });

  const epKey = `ep-${ep.id}`;

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden mb-3">
      {/* Episode header bar — div to avoid nested <button> */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => (e.key === "Enter" || e.key === " ") && setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-[#4a7c9e] text-white text-sm font-semibold hover:bg-[#3d6b8a] transition-colors cursor-pointer select-none"
      >
        <Folder className="h-4 w-4 flex-shrink-0" />
        <span>
          Episode #{ep.episodeNumber}
          {ep.chartNumber && ` — ${ep.chartNumber}`}
          <span className="font-normal ml-2">
            {ep.startDate ? `(Start date: ${fmtDate(ep.startDate)} — End date: ${fmtDate(ep.endDate)})` : "(Unassigned)"}
          </span>
        </span>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onUploadClick(ep.id > 0 ? ep.id : null); }}
          className="ml-auto mr-2 flex items-center gap-1 text-xs text-white/80 hover:text-white border border-white/30 hover:border-white/70 rounded px-2 py-0.5 transition-colors"
          title="Upload document to this episode"
        >
          <Upload className="h-3 w-3" />
          Upload
        </button>
        <span>
          {open
            ? <ChevronDown className="h-4 w-4" />
            : <ChevronRight className="h-4 w-4" />}
        </span>
      </div>

      {open && (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500 border-b">
              <th className="px-4 py-2 font-semibold w-[38%]">Form / Document</th>
              <th className="px-4 py-2 font-semibold w-28">Date</th>
              <th className="px-4 py-2 font-semibold">User</th>
              <th className="px-4 py-2 font-semibold w-36">Status</th>
              <th className="px-4 py-2 font-semibold w-20 text-center">Marks</th>
              {isAdmin && <th className="px-2 py-2 font-semibold w-10" />}
            </tr>
          </thead>
          <tbody>
            {DOC_CATEGORIES.map(cat => {
              const catOrders = secOrders.get(cat) ?? [];
              const catVisits = secVisits.get(cat) ?? [];
              const catIrods  = secIrods.get(cat) ?? [];
              const catDocs   = secDocs.get(cat) ?? [];
              const hasContent = catOrders.length > 0 || catVisits.length > 0 || catIrods.length > 0 || catDocs.length > 0;

              return (
                <Category key={cat} label={cat} catKey={`${epKey}-${cat}`} defaultOpen={hasContent}>
                  {/* MD Orders */}
                  {catOrders.map(o => {
                    const s = MD_STATUS[o.status] ?? MD_STATUS.draft;
                    return (
                      <FormRow key={`order-${o.id}`}>
                        <td className="px-4 py-2 pl-8">
                          <Link href={`/patients/${patientId}/md-orders/${o.id}`} className="text-[#1a6fa5] hover:underline flex items-center gap-1.5">
                            🔗 Physician Order
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-gray-600">{fmtDate(o.date)}</td>
                        <td className="px-4 py-2 text-gray-700">{o.createdBy}</td>
                        <td className="px-4 py-2"><StatusBadge {...s} /></td>
                        <td className="px-4 py-2 text-center text-gray-400">—</td>
                        {isAdmin && (
                          <td className="px-2 py-2 text-center">
                            <button onClick={() => onDeleteOrder(o.id)} className="text-gray-300 hover:text-red-500 transition-colors" title="Delete order">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </FormRow>
                    );
                  })}

                  {/* Visits */}
                  {catVisits.map(v => {
                    const s = VISIT_STATUS[v.formStatus] ?? VISIT_STATUS.draft;
                    const isPosted = v.formStatus === "signed" || v.formStatus === "completed";
                    return (
                      <FormRow key={`visit-${v.id}`}>
                        <td className="px-4 py-2 pl-8">
                          <Link href={`/patients/${patientId}/visits/${v.id}`} className="text-[#1a6fa5] hover:underline flex items-center gap-1.5">
                            🔗 {v.visitType}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-gray-600">{fmtDate(v.date)}</td>
                        <td className="px-4 py-2 text-gray-700">{v.clinician}</td>
                        <td className="px-4 py-2"><StatusBadge {...s} /></td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isPosted && (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-[9px] font-bold">VP</span>
                            )}
                            {isAdmin && (
                              <input type="checkbox" checked={selectedVisits.has(v.id)} onChange={() => onToggleVisit(v.id)}
                                className="h-3.5 w-3.5 rounded border-gray-400 text-[#1a6fa5] cursor-pointer" title="Select for batch action" />
                            )}
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-2 py-2 text-center">
                            <button onClick={() => onDeleteVisit(v.id)} className="text-gray-300 hover:text-red-500 transition-colors" title="Delete visit">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </FormRow>
                    );
                  })}

                  {/* I-RODS Assessments */}
                  {catIrods.map(a => (
                    <FormRow key={`irods-${a.id}`}>
                      <td className="px-4 py-2 pl-8">
                        <Link href={`/patients/${patientId}/irods/${a.id}`} className="text-[#1a6fa5] hover:underline flex items-center gap-1.5">
                          🔗 I-RODS Disability Scale
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-gray-600">{fmtDate(a.date)}</td>
                      <td className="px-4 py-2 text-gray-700">{a.completedBy}</td>
                      <td className="px-4 py-2"><StatusBadge label="Completed" cls="bg-green-50 text-green-700 border-green-200" /></td>
                      <td className="px-4 py-2 text-center text-gray-400"><span className="text-xs font-mono">{a.rawScore}/48</span></td>
                      {isAdmin && (
                        <td className="px-2 py-2 text-center">
                          <button onClick={() => onDeleteIrods(a.id)} className="text-gray-300 hover:text-red-500 transition-colors" title="Delete assessment">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </FormRow>
                  ))}

                  {/* Uploaded Documents */}
                  {catDocs.map(doc => (
                    <FormRow key={`doc-${doc.id}`}>
                      <td className="px-4 py-2 pl-8">
                        <a href={`/api/patients/${patientId}/documents/${doc.id}`} target="_blank" rel="noopener noreferrer"
                          className="text-[#1a6fa5] hover:underline flex items-center gap-1.5" title={doc.originalName}>
                          <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                          {doc.displayName}
                        </a>
                        <span className="text-xs text-gray-400 ml-5">{fmtBytes(doc.fileSize)}</span>
                      </td>
                      <td className="px-4 py-2 text-gray-600">{fmtDate(doc.docDate)}</td>
                      <td className="px-4 py-2 text-gray-700">{doc.uploadedBy?.name ?? "—"}</td>
                      <td className="px-4 py-2"><StatusBadge label="Document" cls="bg-purple-50 text-purple-700 border-purple-200" /></td>
                      <td className="px-4 py-2 text-center text-gray-400">—</td>
                      {isAdmin && (
                        <td className="px-2 py-2 text-center">
                          <button onClick={() => onDeleteDoc(doc.id)} className="text-gray-300 hover:text-red-500 transition-colors" title="Delete document">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </FormRow>
                  ))}

                  {/* Empty section placeholder */}
                  {!hasContent && (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="px-4 py-2 text-center text-xs text-gray-300 italic">
                        No records
                      </td>
                    </tr>
                  )}
                </Category>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Main ChartView ───────────────────────────────────────────────────────────

export function ChartView({
  patientId,
  patientMrn,
  socDate,
  admissionStatus,
  episodes,
  mdOrders: initialOrders,
  visits:   initialVisits,
  irods:    initialIrods,
  isAdmin,
}: ChartViewProps) {
  const [mdOrderList,    setMdOrderList]    = useState<MdOrderRow[]>(initialOrders);
  const [visitList,      setVisitList]      = useState<VisitRow[]>(initialVisits);
  const [irodsList,      setIrodsList]      = useState<IrodsRow[]>(initialIrods);
  const [docList,        setDocList]        = useState<DocRow[]>([]);
  const [selectedVisits, setSelectedVisits] = useState<Set<number>>(new Set());
  const [actionPending,  setActionPending]  = useState(false);
  const [uploadEpId,     setUploadEpId]     = useState<number | null | undefined>(undefined); // undefined = closed

  // Fetch documents client-side
  useEffect(() => {
    fetch(`/api/patients/${patientId}/documents`)
      .then(r => r.json())
      .then((docs: DocRow[]) => setDocList(docs))
      .catch(() => {});
  }, [patientId]);

  async function handleDeleteOrder(id: number) {
    if (!confirm("Delete this MD Order? This cannot be undone.")) return;
    const res = await fetch(`/api/patients/${patientId}/md-orders/${id}`, { method: "DELETE" });
    if (res.ok) setMdOrderList(prev => prev.filter(o => o.id !== id));
    else alert("Failed to delete order.");
  }

  async function handleDeleteVisit(id: number) {
    if (!confirm("Delete this visit? This cannot be undone.")) return;
    const res = await fetch(`/api/patients/${patientId}/visits/${id}`, { method: "DELETE" });
    if (res.ok) setVisitList(prev => prev.filter(v => v.id !== id));
    else alert("Failed to delete visit.");
  }

  async function handleDeleteIrods(id: number) {
    if (!confirm("Delete this assessment? This cannot be undone.")) return;
    const res = await fetch(`/api/patients/${patientId}/irods/${id}`, { method: "DELETE" });
    if (res.ok) setIrodsList(prev => prev.filter(a => a.id !== id));
    else alert("Failed to delete assessment.");
  }

  async function handleDeleteDoc(id: number) {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    const res = await fetch(`/api/patients/${patientId}/documents/${id}`, { method: "DELETE" });
    if (res.ok) setDocList(prev => prev.filter(d => d.id !== id));
    else alert("Failed to delete document.");
  }

  function toggleVisit(id: number) {
    setSelectedVisits(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function applyVisitAction(formStatus: string) {
    if (selectedVisits.size === 0 || actionPending) return;
    setActionPending(true);
    try {
      const results = await Promise.all(
        Array.from(selectedVisits).map(id =>
          fetch(`/api/patients/${patientId}/visits/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ formStatus }),
          })
        )
      );
      if (results.every(r => r.ok)) {
        setVisitList(prev => prev.map(v =>
          selectedVisits.has(v.id) ? { ...v, formStatus } : v
        ));
        setSelectedVisits(new Set());
      } else {
        alert("One or more status updates failed.");
      }
    } finally {
      setActionPending(false);
    }
  }

  // Sort episodes newest first
  const sortedEps = [...episodes].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  // Assign each item to its episode (or null = unassigned)
  const mdByEp    = new Map<number | null, MdOrderRow[]>();
  const visByEp   = new Map<number | null, VisitRow[]>();
  const irodsByEp = new Map<number | null, IrodsRow[]>();
  const docsByEp  = new Map<number | null, DocRow[]>();

  mdOrderList.forEach(o => {
    const eid = findEpisodeId(o.date, episodes);
    mdByEp.set(eid, [...(mdByEp.get(eid) ?? []), o]);
  });
  visitList.forEach(v => {
    const eid = findEpisodeId(v.date, episodes);
    visByEp.set(eid, [...(visByEp.get(eid) ?? []), v]);
  });
  irodsList.forEach(a => {
    const eid = findEpisodeId(a.date, episodes);
    irodsByEp.set(eid, [...(irodsByEp.get(eid) ?? []), a]);
  });
  docList.forEach(d => {
    const eid = d.episodeId ?? null;
    docsByEp.set(eid, [...(docsByEp.get(eid) ?? []), d]);
  });

  const hasUnassigned =
    (mdByEp.get(null)?.length ?? 0) > 0 ||
    (visByEp.get(null)?.length ?? 0) > 0 ||
    (irodsByEp.get(null)?.length ?? 0) > 0 ||
    (docsByEp.get(null)?.length ?? 0) > 0;

  const firstEp = [...episodes].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )[0];
  const chartNum = firstEp?.chartNumber ?? "CHART #1";

  const statusCls =
    admissionStatus === "admitted"   ? "text-green-600 font-semibold" :
    admissionStatus === "discharged" ? "text-red-600 font-semibold"   :
    "text-yellow-600 font-semibold";

  const statusLabel =
    admissionStatus === "admitted"   ? "Admitted" :
    admissionStatus === "discharged" ? "Discharged" :
    "Pending";

  return (
    <div className="space-y-4">
      {/* Chart header bar */}
      <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-4 py-2.5">
        <div className="flex items-center gap-3 text-sm">
          <Folder className="h-4 w-4 text-gray-500" />
          <span className="font-bold text-gray-800">
            {chartNum} — {patientMrn}
          </span>
          {socDate && (
            <span className="text-gray-500">
              (Start Date: {fmtDate(socDate)})
            </span>
          )}
          <span className="text-gray-400">|</span>
          <span className={statusCls}>{statusLabel}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#1a6fa5]">
          {isAdmin && (
            <>
              <Link href={`/patients/${patientId}/md-orders/new`} className="hover:underline">
                + New MD Order
              </Link>
              <span className="text-gray-300">|</span>
              <Link href={`/patients/${patientId}/visits/new`} className="hover:underline">
                + Add Visit Note
              </Link>
              <span className="text-gray-300">|</span>
              <Link href={`/patients/${patientId}/irods/new`} className="hover:underline">
                + I-RODS Assessment
              </Link>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setUploadEpId(null)}
                className="hover:underline flex items-center gap-1"
              >
                <Upload className="h-3 w-3" />
                Upload Document
              </button>
              <span className="text-gray-300">|</span>
              {/* Batch action dropdown */}
              <select
                value=""
                disabled={selectedVisits.size === 0 || actionPending}
                onChange={e => { if (e.target.value) applyVisitAction(e.target.value); }}
                className={`rounded border px-2 py-1 font-medium transition-colors ${
                  selectedVisits.size > 0 && !actionPending
                    ? "border-[#1a6fa5] text-[#1a6fa5] bg-white cursor-pointer hover:bg-blue-50"
                    : "border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed"
                }`}
              >
                <option value="">Select an Action ▼</option>
                <option value="completed">Move to Completed</option>
                <option value="needs_correction">Needs Correction</option>
                <option value="signed">Post Visit</option>
              </select>
              {selectedVisits.size > 0 && (
                <span className="text-gray-500">
                  {selectedVisits.size} selected
                </span>
              )}
              <span className="text-gray-300">|</span>
            </>
          )}
          <Link href={`/patients/${patientId}/schedule`} className="hover:underline">
            Add / View Episode
          </Link>
        </div>
      </div>

      {/* No episodes */}
      {sortedEps.length === 0 && (
        <div className="rounded-md border border-dashed border-gray-300 p-8 text-center text-gray-500">
          No episodes found.
          <Link href={`/patients/${patientId}/schedule`} className="ml-1 text-[#1a6fa5] hover:underline">
            Create an episode on the Schedule page.
          </Link>
        </div>
      )}

      {/* Episode blocks */}
      {sortedEps.map(ep => (
        <EpisodeBlock
          key={ep.id}
          ep={ep}
          patientId={patientId}
          mdOrders={mdByEp.get(ep.id) ?? []}
          visits={visByEp.get(ep.id) ?? []}
          irods={irodsByEp.get(ep.id) ?? []}
          docs={docsByEp.get(ep.id) ?? []}
          isAdmin={isAdmin}
          selectedVisits={selectedVisits}
          onToggleVisit={toggleVisit}
          onDeleteOrder={handleDeleteOrder}
          onDeleteVisit={handleDeleteVisit}
          onDeleteIrods={handleDeleteIrods}
          onDeleteDoc={handleDeleteDoc}
          onUploadClick={eid => setUploadEpId(eid)}
        />
      ))}

      {/* Unassigned */}
      {hasUnassigned && (
        <EpisodeBlock
          key="unassigned"
          ep={{
            id: -1,
            episodeNumber: 0,
            chartNumber: "Unassigned",
            startDate: "",
            endDate: "",
            isActive: false,
          }}
          patientId={patientId}
          mdOrders={mdByEp.get(null) ?? []}
          visits={visByEp.get(null) ?? []}
          irods={irodsByEp.get(null) ?? []}
          docs={docsByEp.get(null) ?? []}
          isAdmin={isAdmin}
          selectedVisits={selectedVisits}
          onToggleVisit={toggleVisit}
          onDeleteOrder={handleDeleteOrder}
          onDeleteVisit={handleDeleteVisit}
          onDeleteIrods={handleDeleteIrods}
          onDeleteDoc={handleDeleteDoc}
          onUploadClick={eid => setUploadEpId(eid)}
        />
      )}

      {/* Upload dialog */}
      {uploadEpId !== undefined && (
        <UploadDialog
          patientId={patientId}
          episodes={episodes}
          initialEpisodeId={uploadEpId}
          onClose={() => setUploadEpId(undefined)}
          onUploaded={doc => setDocList(prev => [doc, ...prev])}
        />
      )}
    </div>
  );
}
