"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Check, X, AlertCircle, Plus, Scissors } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ChargeRow = {
  id: number;
  visitId: number | null;
  patientId: number;
  clinicianId: number | null;
  chargeDate: string;
  chargeCode: string;
  quantity: number;
  visitTime: string | null;
  miles: string | null;
  payRate: string | null;
  verified: boolean;
  notes: string | null;
  patient: { id: number; patientId: string; firstName: string; lastName: string };
  clinician: { id: number; name: string | null } | null;
  visit: { id: number; visitType: string; visitDate: string } | null;
};

type PatientOption = { id: number; firstName: string; lastName: string; patientId: string };
type UserOption    = { id: number; name: string | null; role: string };
type CodeOption    = { id: number; code: string; description: string };

type EditDraft = {
  chargeDate: string;
  chargeCode: string;
  quantity: string;
  visitTime: string;
  miles: string;
  payRate: string;
};

type NewDraft = EditDraft & { patientId: string; clinicianId: string };

const today = new Date().toISOString().slice(0, 10);
const sixMonthsAgo = (() => {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return d.toISOString().slice(0, 10);
})();

function emptyNew(): NewDraft {
  return { chargeDate: today, chargeCode: "", quantity: "1", visitTime: "", miles: "", payRate: "", patientId: "", clinicianId: "" };
}

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

// ── Alert banner ──────────────────────────────────────────────────────────────

function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md px-4 py-3 text-sm text-red-800">
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-red-400 hover:text-red-600 ml-2"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}

// ── Code input shared between EditRow and NewRow ───────────────────────────────

function CodeInput({ value, onChange, codes, id }: {
  value: string;
  onChange: (v: string) => void;
  codes: CodeOption[];
  id: string;
}) {
  return (
    <>
      <datalist id={id}>
        {codes.map(c => <option key={c.id} value={c.code}>{c.description}</option>)}
      </datalist>
      <input
        list={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g. 99601"
        className="border rounded px-1.5 py-1 text-xs w-full max-w-[140px]"
      />
    </>
  );
}

// ── Edit row (existing charge being edited) ───────────────────────────────────

function EditRow({ charge, draft, codes, onChange, onSave, onCancel, saving }: {
  charge: ChargeRow;
  draft: EditDraft;
  codes: CodeOption[];
  onChange: (f: keyof EditDraft, v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <tr className="bg-blue-50 border-t">
      <td className="px-2 py-1">
        <Input type="date" value={draft.chargeDate} onChange={e => onChange("chargeDate", e.target.value)} className="h-7 text-xs w-32" />
      </td>
      <td className="px-2 py-1">
        <CodeInput value={draft.chargeCode} onChange={v => onChange("chargeCode", v)} codes={codes} id={`edit-codes-${charge.id}`} />
      </td>
      <td className="px-2 py-1">
        <Input type="number" min={1} value={draft.quantity} onChange={e => onChange("quantity", e.target.value)} className="h-7 text-xs w-14 text-right" />
      </td>
      <td className="px-2 py-1">
        <Input type="number" min={0} step="0.25" value={draft.visitTime} onChange={e => onChange("visitTime", e.target.value)} className="h-7 text-xs w-16 text-right" placeholder="hrs" />
      </td>
      <td className="px-2 py-1">
        <Input type="number" min={0} step="0.1" value={draft.miles} onChange={e => onChange("miles", e.target.value)} className="h-7 text-xs w-16 text-right" placeholder="mi" />
      </td>
      <td className="px-2 py-1 text-xs text-gray-500 font-mono">{charge.patient.patientId}</td>
      <td className="px-2 py-1 text-xs">{charge.patient.lastName}, {charge.patient.firstName}</td>
      <td className="px-2 py-1 text-xs text-gray-500 font-mono">{charge.clinician?.id ?? "—"}</td>
      <td className="px-2 py-1 text-xs">{charge.clinician?.name ?? "—"}</td>
      <td className="px-2 py-1">
        <Input value={draft.payRate} onChange={e => onChange("payRate", e.target.value)} className="h-7 text-xs w-24" placeholder="rate" />
      </td>
      <td className="px-2 py-1 text-center text-gray-400 text-xs">—</td>
      <td className="px-2 py-1">
        <div className="flex gap-1">
          <button onClick={onSave} disabled={saving} title="Save" className="text-green-600 hover:text-green-800 disabled:opacity-40"><Check className="h-4 w-4" /></button>
          <button onClick={onCancel} title="Cancel" className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>
      </td>
    </tr>
  );
}

// ── New row ───────────────────────────────────────────────────────────────────

function NewRow({ draft, patients, users, codes, onChange, onSave, onCancel, saving }: {
  draft: NewDraft;
  patients: PatientOption[];
  users: UserOption[];
  codes: CodeOption[];
  onChange: (f: keyof NewDraft, v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <tr className="bg-yellow-50 border-t">
      <td className="px-2 py-1">
        <Input type="date" value={draft.chargeDate} max={today} onChange={e => onChange("chargeDate", e.target.value)} className="h-7 text-xs w-32" />
      </td>
      <td className="px-2 py-1">
        <CodeInput value={draft.chargeCode} onChange={v => onChange("chargeCode", v)} codes={codes} id="new-row-codes" />
      </td>
      <td className="px-2 py-1">
        <Input type="number" min={1} value={draft.quantity} onChange={e => onChange("quantity", e.target.value)} className="h-7 text-xs w-14 text-right" />
      </td>
      <td className="px-2 py-1">
        <Input type="number" min={0} step="0.25" value={draft.visitTime} onChange={e => onChange("visitTime", e.target.value)} className="h-7 text-xs w-16 text-right" placeholder="hrs" />
      </td>
      <td className="px-2 py-1">
        <Input type="number" min={0} step="0.1" value={draft.miles} onChange={e => onChange("miles", e.target.value)} className="h-7 text-xs w-16 text-right" placeholder="mi" />
      </td>
      {/* Patient spans Pat-Code + Pat-Name columns */}
      <td className="px-2 py-1" colSpan={2}>
        <select value={draft.patientId} onChange={e => onChange("patientId", e.target.value)}
          className="border rounded px-1.5 py-1 text-xs w-full">
          <option value="">— select patient —</option>
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.patientId} — {p.lastName}, {p.firstName}</option>
          ))}
        </select>
      </td>
      {/* Employee spans Emp-Code + Emp-Name columns */}
      <td className="px-2 py-1" colSpan={2}>
        <select value={draft.clinicianId} onChange={e => onChange("clinicianId", e.target.value)}
          className="border rounded px-1.5 py-1 text-xs w-full">
          <option value="">— select employee —</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.id} — {u.name}</option>
          ))}
        </select>
      </td>
      <td className="px-2 py-1">
        <Input value={draft.payRate} onChange={e => onChange("payRate", e.target.value)} className="h-7 text-xs w-24" placeholder="rate" />
      </td>
      <td className="px-2 py-1 text-center text-gray-300 text-xs">—</td>
      <td className="px-2 py-1">
        <div className="flex gap-1">
          <button type="button" onClick={onSave} disabled={saving} title="Save"
            className="text-green-600 hover:text-green-800 disabled:opacity-40">
            {saving ? <span className="text-xs">…</span> : <Check className="h-4 w-4" />}
          </button>
          <button type="button" onClick={onCancel} title="Cancel" className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ChargesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Reference data
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [empList,  setEmpList]  = useState<UserOption[]>([]);
  const [codes,    setCodes]    = useState<CodeOption[]>([]);
  const [refError, setRefError] = useState<string | null>(null);

  // Charge list
  const [chargeList, setChargeList] = useState<ChargeRow[]>([]);
  const [loading,    setLoading]    = useState(true);

  // Filters — stored in state for inputs, mirrored in a ref so doLoad() always reads latest values
  const [fPatient, setFPatient] = useState("");
  const [fEmp,     setFEmp]     = useState("");
  const [fFrom,    setFFrom]    = useState(sixMonthsAgo);
  const [fTo,      setFTo]      = useState(today);
  const filterRef = useRef({ fPatient, fEmp, fFrom, fTo });

  // Keep ref in sync with state (synchronous, before render)
  filterRef.current = { fPatient, fEmp, fFrom, fTo };

  // Edit state
  const [editId,     setEditId]     = useState<number | null>(null);
  const [editDraft,  setEditDraft]  = useState<EditDraft | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // New row state
  const [addingNew, setAddingNew] = useState(false);
  const [newDraft,  setNewDraft]  = useState<NewDraft>(emptyNew());
  const [newSaving, setNewSaving] = useState(false);

  // Page-level error banner (replaces in-table error row)
  const [pageError,   setPageError]   = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);

  // Ref to scroll the table into view when the new-row form opens
  const tableRef = useRef<HTMLDivElement>(null);

  const isBilling = session?.user?.role === "admin" || session?.user?.role === "staff";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && !isBilling) router.push("/home");
  }, [status, isBilling, router]);

  // Load reference data once — show error if any ref data fails
  useEffect(() => {
    if (!isBilling) return;
    Promise.all([
      fetch("/api/patients?limit=500").then(r => { if (!r.ok) throw new Error("patients"); return r.json(); }),
      fetch("/api/users").then(r => { if (!r.ok) throw new Error("users"); return r.json(); }),
      fetch("/api/libraries/billing-codes").then(r => { if (!r.ok) throw new Error("codes"); return r.json(); }),
    ]).then(([pts, emps, cds]) => {
      setPatients(pts.data ?? []);
      setEmpList(Array.isArray(emps) ? emps : []);
      setCodes(Array.isArray(cds) ? cds : []);
    }).catch((e) => {
      setRefError(`Failed to load reference data (${e.message}). Reload the page.`);
    });
  }, [isBilling]);

  // doLoad always reads the latest filter values through filterRef
  function doLoad() {
    const { fPatient, fEmp, fFrom, fTo } = filterRef.current;
    // Validate date range
    if (fFrom && fTo && fFrom > fTo) {
      setPageError("'From' date must be before 'To' date.");
      return;
    }
    setLoading(true);
    setPageError(null);
    const qs = new URLSearchParams();
    if (fPatient) qs.set("patientId", fPatient);
    if (fEmp)     qs.set("clinicianId", fEmp);
    if (fFrom)    qs.set("from", fFrom);
    if (fTo)      qs.set("to", fTo);
    fetch(`/api/charges?${qs}`)
      .then(r => r.json())
      .then(setChargeList)
      .catch(() => setPageError("Failed to load charges. Check your connection."))
      .finally(() => setLoading(false));
  }

  // Initial load — runs once when billing access is confirmed
  const loadedOnce = useRef(false);
  useEffect(() => {
    if (isBilling && !loadedOnce.current) {
      loadedOnce.current = true;
      doLoad();
    }
  }, [isBilling]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll table into view when a new row opens (it appears at the top)
  useEffect(() => {
    if (addingNew && tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [addingNew]);

  // Open new-row pre-filled from an existing charge (companion / split charge)
  function startCompanion(charge: ChargeRow) {
    setEditId(null); setEditDraft(null);
    setNewDraft({
      chargeDate:  charge.chargeDate,
      chargeCode:  "",
      quantity:    "1",
      visitTime:   "",
      miles:       "",
      payRate:     charge.payRate ?? "",
      patientId:   String(charge.patientId),
      clinicianId: charge.clinicianId ? String(charge.clinicianId) : "",
    });
    setPageError(null); setPageSuccess(null);
    setAddingNew(true);
  }

  // ── Verified toggle ────────────────────────────────────────────────────────
  async function toggleVerified(charge: ChargeRow) {
    const res = await fetch(`/api/charges/${charge.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified: !charge.verified }),
    });
    if (res.ok) {
      const updated: ChargeRow = await res.json();
      setChargeList(prev => prev.map(c => c.id === charge.id ? updated : c));
    }
  }

  // ── Start / save / cancel edit ─────────────────────────────────────────────
  function startEdit(charge: ChargeRow) {
    setAddingNew(false);
    setPageError(null);
    setEditId(charge.id);
    setEditDraft({
      chargeDate: charge.chargeDate,
      chargeCode: charge.chargeCode,
      quantity:   String(charge.quantity),
      visitTime:  charge.visitTime ?? "",
      miles:      charge.miles ?? "",
      payRate:    charge.payRate ?? "",
    });
  }

  async function saveEdit() {
    if (!editId || !editDraft) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/charges/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chargeDate: editDraft.chargeDate,
          chargeCode: editDraft.chargeCode,
          quantity:   parseInt(editDraft.quantity, 10) || 1,
          visitTime:  editDraft.visitTime || null,
          miles:      editDraft.miles || null,
          payRate:    editDraft.payRate || null,
        }),
      });
      if (res.ok) {
        const updated: ChargeRow = await res.json();
        setChargeList(prev => prev.map(c => c.id === editId ? updated : c));
        setEditId(null); setEditDraft(null);
      } else {
        const body = await res.json().catch(() => ({}));
        setPageError(body.error ?? `Save failed (${res.status})`);
      }
    } catch {
      setPageError("Network error — could not save edit");
    } finally {
      setEditSaving(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(charge: ChargeRow) {
    if (!confirm(`Delete charge ${charge.chargeCode} for ${charge.patient.lastName}, ${charge.patient.firstName}?`)) return;
    const res = await fetch(`/api/charges/${charge.id}`, { method: "DELETE" });
    if (res.ok) setChargeList(prev => prev.filter(c => c.id !== charge.id));
  }

  // ── Split SN Infusion charge into 99601 + 99602 ───────────────────────────
  function needsSplit(charge: ChargeRow): boolean {
    if (charge.visit?.visitType !== "SN Infusion" || !charge.visitId) return false;
    // Already split if a companion exists for the same visit
    const sameVisit = chargeList.filter(c => c.visitId === charge.visitId && c.id !== charge.id);
    return sameVisit.length === 0;
  }

  async function handleSplit(charge: ChargeRow) {
    setPageError(null); setPageSuccess(null);
    const res = await fetch(`/api/charges/${charge.id}/split`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPageError(body.error ?? `Split failed (${res.status})`);
      return;
    }
    const { primary, additional } = body as { primary: ChargeRow; additional: ChargeRow };
    setChargeList(prev => {
      const without = prev.filter(c => c.id !== charge.id);
      return [primary, additional, ...without].sort((a, b) => b.chargeDate.localeCompare(a.chargeDate));
    });
    setPageSuccess(`Split into 99601 (1hr) + 99602 (${additional.visitTime}hr) for ${charge.patient.lastName}, ${charge.patient.firstName}.`);
    setTimeout(() => setPageSuccess(null), 5000);
  }

  // ── Save new row ──────────────────────────────────────────────────────────
  async function saveNew() {
    setPageError(null);
    setPageSuccess(null);
    if (!newDraft.patientId)  { setPageError("Patient is required — select a patient from the dropdown.");  return; }
    if (!newDraft.chargeCode) { setPageError("Charge code is required."); return; }
    if (!newDraft.chargeDate) { setPageError("Charge date is required."); return; }
    if (newDraft.chargeDate > today) { setPageError("Charge date cannot be in the future."); return; }
    setNewSaving(true);
    try {
      const res = await fetch("/api/charges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId:   parseInt(newDraft.patientId, 10),
          clinicianId: newDraft.clinicianId ? parseInt(newDraft.clinicianId, 10) : null,
          chargeDate:  newDraft.chargeDate,
          chargeCode:  newDraft.chargeCode,
          quantity:    parseInt(newDraft.quantity, 10) || 1,
          visitTime:   newDraft.visitTime || null,
          miles:       newDraft.miles || null,
          payRate:     newDraft.payRate || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setPageError(body.error ?? `Server error (${res.status}) — charge not saved`);
        return;
      }
      const created: ChargeRow = await res.json();
      setChargeList(prev => [created, ...prev]);
      setAddingNew(false);
      setNewDraft(emptyNew());
      setPageSuccess(`Charge ${created.chargeCode} added for ${created.patient.lastName}, ${created.patient.firstName}.`);
      setTimeout(() => setPageSuccess(null), 4000);
    } catch (e) {
      console.error("saveNew error:", e);
      setPageError("Network error — charge not saved. Check browser console.");
    } finally {
      setNewSaving(false);
    }
  }

  if (status === "loading" || (status === "authenticated" && !isBilling)) return null;

  const th = "px-3 py-2 text-left text-xs font-semibold text-white whitespace-nowrap";

  // "To" date: clamp to today
  function handleToChange(val: string) {
    if (val > today) { setPageError(`'To' date ${val} is in the future — clamped to today.`); setFTo(today); }
    else { setPageError(null); setFTo(val); }
  }

  return (
    <div className="space-y-3">
      <BillingSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Charge Load</h1>
          <p className="text-xs text-gray-500 mt-0.5">Review and verify billable charges before claim submission</p>
        </div>
        <span className="text-xs text-gray-400">{chargeList.length} charge{chargeList.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Reference data error */}
      {refError && <ErrorBanner message={refError} onClose={() => setRefError(null)} />}

      {/* Page-level error/success banners */}
      {pageError   && <ErrorBanner message={pageError}   onClose={() => setPageError(null)} />}
      {pageSuccess && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-md px-4 py-3 text-sm text-green-800">
          <Check className="h-4 w-4 shrink-0 text-green-500" />
          {pageSuccess}
        </div>
      )}

      {/* Filter bar */}
      <div className="border rounded-md p-3 bg-gray-50 flex flex-wrap gap-3 items-end text-sm">
        <div className="space-y-0.5">
          <label className="text-xs text-gray-500 block">Employee</label>
          <select value={fEmp} onChange={e => setFEmp(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
            <option value="">All Employees</option>
            {empList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="space-y-0.5">
          <label className="text-xs text-gray-500 block">Patient</label>
          <select value={fPatient} onChange={e => setFPatient(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
            <option value="">All Patients</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.patientId} — {p.lastName}, {p.firstName}</option>
            ))}
          </select>
        </div>
        <div className="space-y-0.5">
          <label className="text-xs text-gray-500 block">From</label>
          <Input type="date" value={fFrom} onChange={e => setFFrom(e.target.value)} className="h-8 text-sm w-36" />
        </div>
        <div className="space-y-0.5">
          <label className="text-xs text-gray-500 block">To</label>
          <Input type="date" value={fTo} max={today} onChange={e => handleToChange(e.target.value)} className="h-8 text-sm w-36" />
        </div>
        <Button onClick={doLoad} size="sm" className="bg-[#1e5f8a] hover:bg-[#174f75] text-white h-8">Apply</Button>
      </div>

      {/* Charge grid */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e5f8a]" />
        </div>
      ) : (
        <div ref={tableRef} className="border rounded-md overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#1e5f8a]">
                <th className={th}>Chg-Date</th>
                <th className={th}>Chg-Code</th>
                <th className={`${th} text-right`}>Qty</th>
                <th className={`${th} text-right`}>Vis-Time</th>
                <th className={`${th} text-right`}>Miles</th>
                <th className={th}>Pat-Code</th>
                <th className={th}>Pat-Name</th>
                <th className={th}>Emp-Code</th>
                <th className={th}>Emp-Name</th>
                <th className={th}>Pay-Rate</th>
                <th className={`${th} text-center`}>Verified</th>
                <th className={th} title="Actions" />
              </tr>
            </thead>
            <tbody>
              {/* New row at top */}
              {addingNew && (
                <NewRow
                  draft={newDraft}
                  patients={patients}
                  users={empList}
                  codes={codes}
                  onChange={(f, v) => setNewDraft(prev => ({ ...prev, [f]: v }))}
                  onSave={saveNew}
                  onCancel={() => { setAddingNew(false); setNewDraft(emptyNew()); setPageError(null); }}
                  saving={newSaving}
                />
              )}

              {chargeList.length === 0 && !addingNew && (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No charges found. Adjust filters and click <strong>Apply</strong>, or click <strong>+ Add</strong>.
                  </td>
                </tr>
              )}

              {chargeList.map(charge =>
                editId === charge.id && editDraft ? (
                  <EditRow
                    key={charge.id}
                    charge={charge}
                    draft={editDraft}
                    codes={codes}
                    onChange={(f, v) => setEditDraft(prev => prev ? { ...prev, [f]: v } : null)}
                    onSave={saveEdit}
                    onCancel={() => { setEditId(null); setEditDraft(null); }}
                    saving={editSaving}
                  />
                ) : (
                  <tr
                    key={charge.id}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => startEdit(charge)}
                  >
                    <td className="px-3 py-2 text-xs tabular-nums">{charge.chargeDate}</td>
                    <td className="px-3 py-2 font-mono text-xs font-semibold text-[#1e5f8a]">{charge.chargeCode || <span className="text-amber-500 font-normal italic">assign code</span>}</td>
                    <td className="px-3 py-2 text-xs text-right tabular-nums">{charge.quantity}</td>
                    <td className="px-3 py-2 text-xs text-right tabular-nums">{charge.visitTime ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 text-xs text-right tabular-nums">{charge.miles ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 text-xs text-gray-500 font-mono">{charge.patient.patientId}</td>
                    <td className="px-3 py-2 text-xs">{charge.patient.lastName}, {charge.patient.firstName}</td>
                    <td className="px-3 py-2 text-xs text-gray-500 font-mono">{charge.clinician?.id ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 text-xs">{charge.clinician?.name ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{charge.payRate ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={charge.verified}
                        onChange={() => toggleVerified(charge)}
                        className="h-4 w-4 accent-[#1e5f8a] cursor-pointer"
                      />
                    </td>
                    <td className="px-2 py-2" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1 justify-center">
                        {needsSplit(charge) && (
                          <button
                            onClick={() => handleSplit(charge)}
                            title="Split into 99601 (1hr) + 99602 (remaining hrs)"
                            className="text-amber-500 hover:text-amber-700"
                          >
                            <Scissors className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => startCompanion(charge)}
                          title="Add companion charge (same date / patient)"
                          className="text-blue-400 hover:text-blue-700"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(charge)} className="text-red-400 hover:text-red-600" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 border-t pt-3">
        <Button
          size="sm"
          onClick={() => {
            setEditId(null); setEditDraft(null);
            setAddingNew(true); setNewDraft(emptyNew()); setPageError(null); setPageSuccess(null);
          }}
          className="bg-[#1e5f8a] hover:bg-[#174f75] text-white gap-1"
        >
          + Add
        </Button>
        <span className="text-xs text-gray-400">
          Click a row to edit · <Scissors className="inline h-3 w-3 text-amber-500" /> splits SN Infusion into 99601+99602 · <Plus className="inline h-3 w-3 text-blue-400" /> adds companion charge · Verified checkbox saves immediately
        </span>
      </div>
    </div>
  );
}
