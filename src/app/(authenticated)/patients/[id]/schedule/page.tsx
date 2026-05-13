"use client";

import { Fragment, useMemo, useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

type Patient = {
  id: number;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  socDate: string | null;
};

type Episode = {
  id: number;
  episodeNumber: number;
  chartNumber: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

type Visit = {
  id: number;
  visitDate: string;
  visitDateISO: string;  // "YYYY-MM-DD" computed server-side — use this for date comparisons
  visitType: string;
  formStatus: string | null;
  clinician: { id: number; name: string | null } | null;
};

type MdOrder = {
  id: number;
  status: string;
  effectiveDate: string | null;
  visitFrequency: { discipline: string; frequency: string }[] | null;
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Parse a date string as local midnight — always slices the YYYY-MM-DD prefix
// so it works whether the API sends "2026-04-15", "2026-04-15T00:00:00.000Z", etc.
function parseLocal(s: string): Date {
  const datePart = (s ?? "").slice(0, 10);
  const [y, m, d] = datePart.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysRemaining(endDate: string): number {
  const end = parseLocal(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86_400_000));
}

function episodeLabel(ep: Episode): string {
  const ch = ep.chartNumber ?? `Ch #${ep.episodeNumber}`;
  const fmt = (s: string) =>
    parseLocal(s).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
  return `${ch} Ep #${ep.episodeNumber}: ${fmt(ep.startDate)} – ${fmt(ep.endDate)}`;
}

function getMilestoneLabel(day: Date, ep: Episode): string | null {
  const start = parseLocal(ep.startDate);
  const end   = parseLocal(ep.endDate);
  const day30 = addDays(start, 30);
  if (sameDay(day, start)) return "Start of Episode";
  if (sameDay(day, day30)) return "Start of 2nd 30 Day";
  if (sameDay(day, end))   return "End of Episode";
  return null;
}

function isInEpisode(day: Date, ep: Episode): boolean {
  const d     = day.getTime();
  const start = parseLocal(ep.startDate).getTime();
  const end   = parseLocal(ep.endDate).getTime() + 86_399_999; // inclusive end-of-day
  return d >= start && d <= end;
}

// Local YYYY-MM-DD (avoids UTC shift on ISO string slice)
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// All week-start dates covering the episode (Sun–Sat windows)
function getEpisodeWeeks(ep: Episode): Date[] {
  const weeks: Date[] = [];
  const w0  = getWeekStart(parseLocal(ep.startDate));
  const end = parseLocal(ep.endDate);
  let w = w0;
  while (w <= end) {
    weeks.push(new Date(w));
    w = addDays(w, 7);
  }
  return weeks;
}

// ─── Frequency helpers ────────────────────────────────────────────────────────

type ParsedFreq = {
  visitsPerWeek:   number;   // how many visits in an active week
  everyNWeeks:     number;   // cycle length (1 = every week, 3 = every 3rd week)
  startWeekSunday: Date | null; // Sunday of the first active week
};

// Parse strings like "2 x week every 3 weeks for 8 weeks starting 04/20/2026 (week 2)"
function parseFrequency(freq: string): ParsedFreq {
  const visitsPerWeek = Math.min(
    7,
    parseInt(freq.match(/(\d+)\s*x\s*week/i)?.[1] ?? "1", 10)
  );
  const everyNWeeks = parseInt(
    freq.match(/every\s+(\d+)\s+weeks?/i)?.[1] ?? "1",
    10
  );
  // "starting MM/DD/YYYY"
  const sm = freq.match(/starting\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  const startWeekSunday = sm
    ? getWeekStart(new Date(parseInt(sm[3]), parseInt(sm[1]) - 1, parseInt(sm[2])))
    : null;
  return { visitsPerWeek, everyNWeeks, startWeekSunday };
}

// Returns true only if wkStart is one of the active weeks in the cycle
function isVisitWeek(wkStart: Date, parsed: ParsedFreq): boolean {
  if (!parsed.startWeekSunday) return true; // no start date → show every week
  const diffMs    = wkStart.getTime() - parsed.startWeekSunday.getTime();
  const diffWeeks = Math.round(diffMs / (7 * 86_400_000));
  if (diffWeeks < 0) return false; // before the first active week
  return diffWeeks % parsed.everyNWeeks === 0;
}

// Default day-of-week distribution per N visits/week (0=Sun … 6=Sat)
const FQ_DAYS: Record<number, number[]> = {
  1: [3],               // Wed
  2: [1, 4],            // Mon, Thu
  3: [1, 3, 5],         // Mon, Wed, Fri
  4: [1, 2, 4, 5],      // Mon, Tue, Thu, Fri
  5: [1, 2, 3, 4, 5],   // Mon–Fri
  6: [0, 1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
};

// ─── Display helpers ──────────────────────────────────────────────────────────

function fmtTime(_dateStr: string): string {
  return ""; // visit_date noon is a storage convention, not a real visit time
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Visit block colors by form status
const VISIT_CLS: Record<string, string> = {
  signed:           "bg-blue-600 text-white border-blue-700",
  completed:        "bg-blue-600 text-white border-blue-700",
  draft:            "bg-gray-100 text-gray-700 border-gray-300",
  needs_correction: "bg-orange-50 text-orange-700 border-orange-300",
  locked:           "bg-gray-200 text-gray-500 border-gray-400",
};

// ─── New Episode Form ─────────────────────────────────────────────────────────

function NewEpisodeForm({
  patientId,
  nextEpisodeNum,
  defaultStart,
  onCreated,
  onCancel,
}: {
  patientId: string;
  nextEpisodeNum: number;
  defaultStart: string;
  onCreated: (ep: Episode) => void;
  onCancel: () => void;
}) {
  const defaultEnd = defaultStart
    ? addDays(new Date(defaultStart), 60).toISOString().slice(0, 10)
    : "";

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate,   setEndDate]   = useState(defaultEnd);
  const [chartNum,  setChartNum]  = useState(`Ch #${nextEpisodeNum}`);
  const [saving,    setSaving]    = useState(false);
  const [err,       setErr]       = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      const res = await fetch(`/api/patients/${patientId}/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeNumber: nextEpisodeNum,
          chartNumber: chartNum,
          startDate,
          endDate,
        }),
      });
      if (!res.ok) { setErr((await res.json()).error ?? "Failed"); return; }
      onCreated(await res.json());
    } catch { setErr("Network error"); }
    finally { setSaving(false); }
  }

  const inp = "border rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-[#1e5f8a]";
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600">Chart #</label>
          <input className={inp} value={chartNum} onChange={e => setChartNum(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Start Date</label>
          <input type="date" className={inp} value={startDate} onChange={e => setStartDate(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">End Date</label>
          <input type="date" className={inp} value={endDate} onChange={e => setEndDate(e.target.value)} required />
        </div>
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="bg-[#1e5f8a] hover:bg-[#174f75] text-white text-sm h-8 px-4">
          {saving ? "Creating…" : "Create Episode"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} className="text-sm h-8">
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PatientSchedulePage() {
  const { data: session, status: authStatus } = useSession();
  const router   = useRouter();
  const params   = useParams();
  const patientId = params.id as string;

  const [patient,     setPatient]     = useState<Patient | null>(null);
  const [episodes,    setEpisodes]    = useState<Episode[]>([]);
  const [allVisits,   setAllVisits]   = useState<Visit[]>([]);
  const [latestOrder, setLatestOrder] = useState<MdOrder | null>(null);
  const [loading,     setLoading]     = useState(true);
  // day-index overrides: key = "discipline|YYYY-MM-DD" (week sunday)
  const [overrides, setOverrides] = useState<Map<string, number[]>>(new Map());

  const [selectedEpId, setSelectedEpId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [showNewEp,    setShowNewEp]    = useState(false);

  // Drag-and-drop state
  const [dragItem, setDragItem] = useState<{
    discipline: string; wkStartISO: string; dayIndex: number;
  } | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null); // "wkISO|dayIndex"

  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "staff";

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  const load = useCallback(async () => {
    try {
      const [pt, eps, vis, orders, ovrs] = await Promise.all([
        fetch(`/api/patients/${patientId}`).then(r => r.json()),
        fetch(`/api/patients/${patientId}/episodes`).then(r => r.json()),
        fetch(`/api/patients/${patientId}/visits`).then(r => r.json()),
        fetch(`/api/patients/${patientId}/md-orders`).then(r => r.json()),
        fetch(`/api/patients/${patientId}/schedule-overrides`).then(r => r.json()),
      ]);
      setPatient(pt);
      setEpisodes(eps);
      // Recompute visitDateISO client-side from the UTC ISO string so timezone
      // differences between server and browser never shift the calendar date.
      // visitDate is always serialized as "YYYY-MM-DDTHH:mm:ss.sssZ"; slicing
      // the first 10 chars gives the correct calendar date in any environment.
      // eslint-disable-next-line no-console
      console.log("RAW visits from API:", (vis as Visit[]).map(v => ({
        id: v.id,
        visitDate: v.visitDate,
        visitDateISO_client: v.visitDate ? String(v.visitDate).slice(0, 10) : "",
      })));
      setAllVisits(
        (vis as Visit[]).map(v => ({
          ...v,
          visitDateISO: v.visitDate ? String(v.visitDate).slice(0, 10) : "",
        }))
      );
      const order = (orders as MdOrder[]).find(
        o => (o.status === "signed" || o.status === "sent_to_md") &&
             (o.visitFrequency?.length ?? 0) > 0
      ) ?? orders[0] ?? null;
      setLatestOrder(order);
      const active = (eps as Episode[]).find(e => e.isActive) ?? eps[0] ?? null;
      if (active) setSelectedEpId(active.id);
      // Build override map
      const map = new Map<string, number[]>();
      (ovrs as Array<{ discipline: string; weekStart: string; dayIndices: number[] }>).forEach(o => {
        map.set(`${o.discipline}|${o.weekStart}`, o.dayIndices);
      });
      setOverrides(map);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (authStatus === "authenticated") load();
  }, [authStatus, load]);

  const selectedEp = episodes.find(e => e.id === selectedEpId) ?? null;

  // Status-filtered visits (used for calendar display)
  const filteredVisits = useMemo(() => allVisits.filter(v => {
    if (statusFilter === "pending")
      return v.formStatus === "draft" || v.formStatus === "needs_correction";
    if (statusFilter === "completed")
      return v.formStatus === "completed" || v.formStatus === "signed";
    return true;
  }), [allVisits, statusFilter]);

  // Pre-compute all week rendering data once so JSX is purely declarative
  const weekData = useMemo(() => {
    if (!selectedEp) return [];
    const fqDefs2 = (latestOrder?.visitFrequency ?? []).map(fq => {
      const parsed = parseFrequency(fq.frequency);
      return { discipline: fq.discipline, parsed, dayIndices: FQ_DAYS[parsed.visitsPerWeek] ?? FQ_DAYS[1] };
    });
    return getEpisodeWeeks(selectedEp).map(wkStart => {
      const wkISO = isoDate(wkStart);
      const y = wkStart.getFullYear();
      const mo = wkStart.getMonth();
      const d0 = wkStart.getDate();
      const days = [0,1,2,3,4,5,6].map(i => new Date(y, mo, d0 + i));
      const dayISOs = days.map(day => isoDate(day));

      const weekVisits = filteredVisits.filter(v => {
        if ((v.formStatus ?? "draft") === "draft") return false;
        return dayISOs.includes(v.visitDateISO);
      });

      const clinMap = new Map<string, Visit[]>();
      weekVisits.forEach(v => {
        const k = v.clinician?.name ?? "Unassigned";
        if (!clinMap.has(k)) clinMap.set(k, []);
        clinMap.get(k)!.push(v);
      });
      const clinRows = Array.from(clinMap.entries()).map(([clinName, clinVisits]) => ({
        clinName,
        cells: days.map((day, di) => ({
          day,
          dayISO: dayISOs[di],
          inEp: isInEpisode(day, selectedEp),
          dayVisits: clinVisits.filter(v => v.visitDateISO === dayISOs[di]),
        })),
      }));

      const fqRows = fqDefs2
        .filter(fq => isVisitWeek(wkStart, fq.parsed))
        .map(fq => {
          const effIndices = overrides.get(`${fq.discipline}|${wkISO}`) ?? fq.dayIndices;
          return {
            discipline:     fq.discipline,
            defaultIndices: fq.dayIndices,
            effIndices,
            expectedDays:   days.filter(d => effIndices.includes(d.getDay()) && isInEpisode(d, selectedEp)),
            cells: days.map((day, di) => ({
              day,
              dayISO: dayISOs[di],
              dayOfWeek: day.getDay(),
              isExpected: effIndices.includes(day.getDay()),
              hasVisit: allVisits.some(v =>
                v.visitDateISO === dayISOs[di] &&
                (v.formStatus === "signed" || v.formStatus === "completed")
              ),
              inEp: isInEpisode(day, selectedEp),
            })),
          };
        })
        .filter(fq => fq.expectedDays.length > 0);

      // eslint-disable-next-line no-console
      console.log(`WEEK ${wkISO}: clinRows=${clinRows.length} visits=[${weekVisits.map(v=>`${v.id}:${v.visitDateISO}`).join(',')}] days=[${dayISOs[0]},${dayISOs[1]}]`);

      return {
        wkISO, wkStart, days, dayISOs,
        clinRows, fqRows,
        hasContent: clinRows.length > 0 || fqRows.length > 0,
      };
    });
  }, [selectedEp, filteredVisits, latestOrder, overrides, allVisits]);

  if (loading || authStatus === "loading") return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e5f8a]" />
    </div>
  );

  if (!patient) return null;

  const patientName  = `${patient.firstName} ${patient.lastName}`;
  const nextEpNum    = (episodes[episodes.length - 1]?.episodeNumber ?? 0) + 1;
  const defaultStart = patient.socDate ?? new Date().toISOString().slice(0, 10);

  // ── Drag-and-drop handler ──────────────────────────────────────────────────
  function handleFqDrop(
    discipline: string,
    wkStartISO: string,
    fromDay: number,
    toDay: number,
    defaultDayIndices: number[]
  ) {
    if (fromDay === toDay) return;
    const key = `${discipline}|${wkStartISO}`;
    const current = overrides.get(key) ?? defaultDayIndices;
    const next = [...current];
    const fromPos = next.indexOf(fromDay);
    const toPos   = next.indexOf(toDay);
    if (fromPos === -1) return;
    if (toPos !== -1) {
      // Swap: both slots occupied — exchange their positions
      next[fromPos] = toDay;
      next[toPos]   = fromDay;
    } else {
      // Move: target slot is free
      next[fromPos] = toDay;
    }
    setOverrides(prev => new Map(prev).set(key, next));
    // Auto-save
    fetch(`/api/patients/${patientId}/schedule-overrides`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discipline, weekStart: wkStartISO, dayIndices: next }),
    }).catch(() => {}); // silent on network error; state already updated optimistically
  }

  return (
    <div className="space-y-4 pb-10">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/patients" className="hover:underline">Patients</Link>
            <span>/</span>
            <Link href={`/patients/${patientId}`} className="hover:underline">{patientName}</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">Patient Schedule</span>
          </div>
          <h1 className="text-xl font-bold">Patient Schedule</h1>
        </div>
        <Link
          href={`/patients/${patientId}`}
          className="text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          ← Patient Profile
        </Link>
      </div>

      {/* ── Visit Frequencies panel ───────────────────────────────────────────── */}
      {latestOrder && (latestOrder.visitFrequency?.length ?? 0) > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50 rounded-t-lg">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Visit Frequencies
            </p>
            <Link
              href={`/patients/${patientId}/md-orders/${latestOrder.id}`}
              className="text-xs text-[#1e5f8a] hover:underline"
            >
              View MD Order →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b">
                <th className="px-4 py-2 font-medium">Discipline</th>
                <th className="px-4 py-2 font-medium">Frequency</th>
                {latestOrder.effectiveDate && (
                  <th className="px-4 py-2 font-medium">Effective Date</th>
                )}
              </tr>
            </thead>
            <tbody>
              {latestOrder.visitFrequency!.map((row, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-800">{row.discipline}</td>
                  <td className="px-4 py-2 text-gray-700">{row.frequency}</td>
                  {latestOrder.effectiveDate && (
                    <td className="px-4 py-2 text-gray-500">
                      {parseLocal(latestOrder.effectiveDate).toLocaleDateString()}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── No episodes / New Episode form ───────────────────────────────────── */}
      {episodes.length === 0 && !showNewEp && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-gray-500 mb-3">No episodes found for this patient.</p>
          {isAdmin && (
            <Button
              onClick={() => setShowNewEp(true)}
              className="bg-[#1e5f8a] hover:bg-[#174f75] text-white"
            >
              + Create Episode
            </Button>
          )}
        </div>
      )}

      {showNewEp && (
        <div className="rounded-lg border border-[#1e5f8a] bg-white p-4">
          <p className="text-sm font-semibold mb-3">New Episode</p>
          <NewEpisodeForm
            patientId={patientId}
            nextEpisodeNum={nextEpNum}
            defaultStart={defaultStart}
            onCreated={ep => {
              setEpisodes(prev => [...prev, ep]);
              setSelectedEpId(ep.id);
              setShowNewEp(false);
            }}
            onCancel={() => setShowNewEp(false)}
          />
        </div>
      )}

      {/* ── Full-episode calendar ─────────────────────────────────────────────── */}
      {episodes.length > 0 && selectedEp && (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">

          {/* Episode selector bar */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[#2c6e9e] text-white flex-wrap">
            <span className="text-xs font-semibold">Episode:</span>
            <select
              value={selectedEpId ?? ""}
              onChange={e => setSelectedEpId(Number(e.target.value))}
              className="text-xs bg-white/10 border border-white/30 rounded px-2 py-1 text-white focus:outline-none"
            >
              {episodes.map(ep => (
                <option key={ep.id} value={ep.id} className="text-gray-800 bg-white">
                  {episodeLabel(ep)}
                </option>
              ))}
            </select>
            <span className="ml-auto text-xs opacity-90">
              {daysRemaining(selectedEp.endDate)} days remaining in episode {selectedEp.episodeNumber}
            </span>
            {isAdmin && !showNewEp && (
              <button
                onClick={() => setShowNewEp(true)}
                className="text-xs underline hover:no-underline opacity-80"
              >
                + New Episode
              </button>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2 border-b bg-gray-50 text-xs text-gray-600">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-5 h-3.5 rounded border border-gray-400 bg-gray-300" />
              = Made Visit
            </span>
            <span className="font-bold text-blue-700">VP</span>
            <span>= Visit Is Posted</span>
            <span className="text-gray-300 select-none">|</span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-5 h-3.5 rounded border-2 border-gray-400 bg-white" />
              = Scheduled Visit
            </span>
            <span className="font-bold text-red-600">FQ</span>
            <span>= Patient&apos;s Frequencies</span>
            <span className="text-gray-300 select-none">|</span>
            <span className="italic text-gray-500">Out Of Frequency</span>
            <span className="font-bold">*</span>
            <span>= PRN</span>
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-2 px-4 py-2 border-b text-xs flex-wrap">
            <span className="font-medium text-gray-600">Filter:</span>
            {(["all", "pending", "completed"] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-0.5 rounded-full border font-medium transition-colors ${
                  statusFilter === f
                    ? "bg-[#1e5f8a] text-white border-[#1e5f8a]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {f === "all" ? "All" : f === "pending" ? "Pending" : "Completed"}
              </button>
            ))}
          </div>

          {/* Calendar: all episode weeks stacked */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs" style={{ minWidth: "760px" }}>
              <tbody>
                {weekData.map(({ wkISO, days, clinRows, fqRows, hasContent }) => (
                  <Fragment key={wkISO}>

                    {/* ── Week date header ── */}
                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                      <td className="border-r border-b px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide w-32">
                        User
                      </td>
                      <td className="border-r border-b px-2 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide text-center w-10">
                        Freq.
                      </td>
                      {days.map((day, di) => {
                        const milestone = getMilestoneLabel(day, selectedEp!);
                        const inEp      = isInEpisode(day, selectedEp!);
                        const isToday   = sameDay(day, new Date());
                        return (
                          <td
                            key={di}
                            className={`border-r border-b px-2 py-1 text-center ${
                              !inEp   ? "opacity-30 bg-gray-50" :
                              isToday ? "bg-blue-50" : ""
                            }`}
                          >
                            <div className={`font-semibold text-[11px] ${isToday ? "text-[#1e5f8a]" : "text-gray-700"}`}>
                              {day.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" })}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {DAY_NAMES[day.getDay()]}
                            </div>
                            {milestone && (
                              <div className="text-[9px] text-red-600 font-bold leading-tight mt-0.5">
                                {milestone}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* ── Clinician rows (made visits) ── */}
                    {clinRows.map(({ clinName, cells }) => (
                      <tr key={clinName} className="border-b hover:bg-gray-50/50">
                        <td className="border-r px-3 py-1.5 align-top font-medium text-[#1e5f8a]">
                          {clinName}
                        </td>
                        <td className="border-r px-2 py-1 text-center" />
                        {cells.map(({ dayISO, inEp, dayVisits }, di) => (
                          <td
                            key={di}
                            className={`border-r px-1 py-1 align-top min-h-[36px] ${!inEp ? "opacity-30" : ""}`}
                          >
                            <div className="space-y-0.5">
                              {dayVisits.map(v => {
                                const fs       = v.formStatus ?? "draft";
                                const isPosted = fs === "signed" || fs === "completed";
                                const time     = fmtTime(v.visitDate);
                                return (
                                  <Link
                                    key={v.id}
                                    href={`/patients/${patientId}/visits/${v.id}`}
                                    className={`block rounded border px-1.5 py-0.5 text-[10px] leading-snug hover:opacity-80 transition-opacity ${
                                      VISIT_CLS[fs] ?? VISIT_CLS.draft
                                    }`}
                                  >
                                    {isPosted && (
                                      <span className="font-bold mr-0.5">VP</span>
                                    )}
                                    {time && (
                                      <span className="block text-[9px] opacity-80">{time}</span>
                                    )}
                                    {!isPosted && !time && (
                                      <span className="opacity-70">Pending</span>
                                    )}
                                  </Link>
                                );
                              })}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}

                    {/* ── FQ rows (scheduled / expected visits, draggable) ── */}
                    {fqRows.map((fq, fi) => (
                      <tr key={`${wkISO}-fq-${fi}`} className="border-b hover:bg-gray-50/50">
                        <td className="border-r px-3 py-1.5 text-gray-500">
                          Discipline: {fq.discipline}
                        </td>
                        <td className="border-r px-2 py-1 text-center">
                          <span className="font-bold text-red-600">FQ</span>
                        </td>
                        {fq.cells.map(({ dayOfWeek, isExpected, hasVisit, inEp }, di) => {
                          const cellKey = `${wkISO}|${dayOfWeek}`;
                          const isBeingDragged =
                            dragItem?.discipline === fq.discipline &&
                            dragItem?.wkStartISO === wkISO &&
                            dragItem?.dayIndex   === dayOfWeek;
                          const isDragTarget =
                            dragItem?.discipline === fq.discipline &&
                            dragItem?.wkStartISO === wkISO &&
                            dragOverKey === cellKey &&
                            !isBeingDragged;
                          return (
                            <td
                              key={di}
                              className={`border-r px-1 py-2 text-center transition-colors ${
                                !inEp         ? "opacity-30" :
                                isDragTarget  ? "bg-blue-50 ring-1 ring-inset ring-blue-400" : ""
                              }`}
                              onDragOver={e => {
                                if (dragItem?.wkStartISO === wkISO && dragItem?.discipline === fq.discipline && inEp) {
                                  e.preventDefault();
                                  setDragOverKey(cellKey);
                                }
                              }}
                              onDragLeave={() => setDragOverKey(null)}
                              onDrop={e => {
                                e.preventDefault();
                                setDragOverKey(null);
                                if (!dragItem || dragItem.wkStartISO !== wkISO || dragItem.discipline !== fq.discipline) return;
                                handleFqDrop(fq.discipline, wkISO, dragItem.dayIndex, dayOfWeek, fq.defaultIndices);
                              }}
                            >
                              {isExpected && !hasVisit && (
                                <span
                                  draggable
                                  onDragStart={e => {
                                    e.dataTransfer.effectAllowed = "move";
                                    e.dataTransfer.setData("text/plain", "fq-drag");
                                    setDragItem({ discipline: fq.discipline, wkStartISO: wkISO, dayIndex: dayOfWeek });
                                  }}
                                  onDragEnd={() => { setDragItem(null); setDragOverKey(null); }}
                                  className={`inline-block w-5 h-5 border-2 rounded-sm transition-opacity select-none ${
                                    isBeingDragged
                                      ? "border-blue-400 bg-blue-50 opacity-30 cursor-grabbing"
                                      : "border-gray-400 bg-white cursor-grab hover:border-blue-400"
                                  }`}
                                />
                              )}
                              {!isExpected && !hasVisit && isDragTarget && inEp && (
                                <span className="inline-block w-5 h-5 border-2 border-dashed border-blue-400 rounded-sm bg-blue-50" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* ── Empty week placeholder ── */}
                    {!hasContent && (
                      <tr>
                        <td colSpan={9} className="px-4 py-3 text-center text-gray-400 border-b">
                          No visits this week.{" "}
                          {isAdmin && (
                            <Link
                              href={`/patients/${patientId}/visits/new`}
                              className="text-[#1e5f8a] hover:underline"
                            >
                              Add a visit note
                            </Link>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
