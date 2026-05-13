"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, PlusCircle, ShieldCheck } from "lucide-react";

type PecosStatus = "Enrolled" | "Not Enrolled" | "Unknown" | "Pending";

type Physician = {
  id: number;
  code: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  title: string | null;
  street: string | null;
  suite: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  upin: string | null;
  npi: string | null;
  pecosStatus: PecosStatus;
  partB: boolean;
  dme: boolean;
  hha: boolean;
  pmd: boolean;
  hospice: boolean;
  lastChecked: string | null;
  protocol: string | null;
  licenseNumber: string | null;
  licenseState: string | null;
  licenseExpiration: string | null;
  externalId: string | null;
  agencyId: string | null;
  physicianType: string | null;
  isActive: boolean;
};

const US_STATES: [string, string][] = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],
  ["CA","California"],["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],
  ["DC","District of Columbia"],["FL","Florida"],["GA","Georgia"],["HI","Hawaii"],
  ["ID","Idaho"],["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],
  ["KS","Kansas"],["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],
  ["MD","Maryland"],["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],
  ["MS","Mississippi"],["MO","Missouri"],["MT","Montana"],["NE","Nebraska"],
  ["NV","Nevada"],["NH","New Hampshire"],["NJ","New Jersey"],["NM","New Mexico"],
  ["NY","New York"],["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],
  ["OK","Oklahoma"],["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],
  ["SC","South Carolina"],["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],
  ["UT","Utah"],["VT","Vermont"],["VA","Virginia"],["WA","Washington"],
  ["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"],
];

const PHYSICIAN_TYPES = [
  "Cardiologist","Dentist","Dermatologist","Endocrinologist","Family Practice",
  "Gastroenterologist","Gerontologist","Hematologist","Internal Medicine",
  "Medical Director","Nephrologist","Neurologist","Oncologist","Orthopedist",
  "Physiatrist","Psychiatrist","Pulmonologist","Rheumatologist","Urologist","Other",
];

const PECOS_STATUSES: PecosStatus[] = ["Enrolled", "Not Enrolled", "Unknown", "Pending"];

type FormData = Omit<Physician, "id" | "isActive" | "code">;

const EMPTY: FormData = {
  firstName: "", middleName: "", lastName: "", title: "",
  street: "", suite: "", city: "", state: "CA", zipCode: "",
  phone: "", fax: "", email: "",
  upin: "", npi: "",
  pecosStatus: "Unknown",
  partB: false, dme: false, hha: false, pmd: false, hospice: false,
  lastChecked: null, protocol: "",
  licenseNumber: "", licenseState: "CA", licenseExpiration: "",
  externalId: "", agencyId: "", physicianType: "",
};

function yn(val: boolean) { return val ? "Y" : "N"; }

function licenseWarning(exp: string | null): "expired" | "soon" | null {
  if (!exp) return null;
  const expDate = new Date(exp + "T00:00:00");
  const now = new Date();
  const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return "expired";
  if (diffDays <= 14) return "soon";
  return null;
}

function YNSelect({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <select
      value={value ? "Y" : "N"}
      onChange={e => onChange(e.target.value === "Y")}
      className="w-full h-9 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]"
    >
      <option value="N">N</option>
      <option value="Y">Y</option>
    </select>
  );
}

function StateSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value ?? "CA"}
      onChange={e => onChange(e.target.value)}
      className="w-full h-9 rounded-md border border-input bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]"
    >
      {US_STATES.map(([abbr, name]) => (
        <option key={abbr} value={abbr}>{abbr} — {name}</option>
      ))}
    </select>
  );
}

function PhysicianForm({
  initial,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial: FormData;
  onSave: (data: FormData) => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [f, setF] = useState<FormData>(initial);
  const [npiStatus, setNpiStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [verifying, setVerifying] = useState(false);

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setF(prev => ({ ...prev, [k]: v }));

  async function verifyNpi() {
    if (!f.npi?.trim()) return;
    setVerifying(true); setNpiStatus(null);
    try {
      const res = await fetch(`/api/libraries/physicians/verify-npi?npi=${f.npi.trim()}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setNpiStatus({ ok: false, msg: data.error ?? "Verification failed" });
        return;
      }
      if (!data.found) {
        setNpiStatus({ ok: false, msg: "NPI not found in registry" });
        return;
      }
      setNpiStatus({ ok: true, msg: `${data.status} · ${data.specialty ?? "Unknown specialty"}` });
      if (data.checkedAt) set("lastChecked", data.checkedAt);
    } catch {
      setNpiStatus({ ok: false, msg: "Could not reach NPI Registry" });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(f); }} className="space-y-6">
      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">First Name <span className="text-red-500">*</span></Label>
          <Input value={f.firstName} onChange={e => set("firstName", e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Middle Name</Label>
          <Input value={f.middleName ?? ""} onChange={e => set("middleName", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Last Name <span className="text-red-500">*</span></Label>
          <Input value={f.lastName} onChange={e => set("lastName", e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Title</Label>
          <Input value={f.title ?? ""} onChange={e => set("title", e.target.value)} placeholder="MD" />
        </div>
      </div>

      {/* Address */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Street</Label>
          <Input value={f.street ?? ""} onChange={e => set("street", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Suite/Apt #</Label>
          <Input value={f.suite ?? ""} onChange={e => set("suite", e.target.value)} placeholder="Ste B" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">City</Label>
          <Input value={f.city ?? ""} onChange={e => set("city", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">State</Label>
          <StateSelect value={f.state ?? "CA"} onChange={v => set("state", v)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Zip Code</Label>
          <Input value={f.zipCode ?? ""} onChange={e => set("zipCode", e.target.value)} />
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Phone</Label>
          <Input type="tel" value={f.phone ?? ""} onChange={e => set("phone", e.target.value)} placeholder="310-474-9595" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Fax</Label>
          <Input type="tel" value={f.fax ?? ""} onChange={e => set("fax", e.target.value)} placeholder="866-882-1326" />
        </div>
        <div className="space-y-1 col-span-2">
          <Label className="text-xs font-semibold">Email</Label>
          <Input type="email" value={f.email ?? ""} onChange={e => set("email", e.target.value)} />
        </div>
      </div>

      {/* NPI + PECOS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">UPIN</Label>
          <Input value={f.upin ?? ""} onChange={e => set("upin", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">NPI</Label>
          <div className="flex gap-2">
            <Input
              value={f.npi ?? ""}
              onChange={e => { set("npi", e.target.value); setNpiStatus(null); }}
              placeholder="10-digit NPI"
              className="flex-1"
            />
            <button
              type="button"
              onClick={verifyNpi}
              disabled={verifying || !f.npi?.trim()}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md border border-[#1e5f8a] text-[#1e5f8a] hover:bg-[#1e5f8a] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {verifying ? "Checking…" : "Verify NPI"}
            </button>
          </div>
          {npiStatus && (
            <p className={`text-xs mt-1 ${npiStatus.ok ? "text-green-700" : "text-red-600"}`}>
              {npiStatus.ok ? "✓" : "✗"} {npiStatus.msg}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">PECOS Status</Label>
          <select
            value={f.pecosStatus}
            onChange={e => set("pecosStatus", e.target.value as PecosStatus)}
            className="w-full h-9 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]"
          >
            {PECOS_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Last Checked</Label>
          <Input
            type="date"
            value={f.lastChecked ?? ""}
            onChange={e => set("lastChecked", e.target.value || null)}
            className="bg-gray-50"
          />
        </div>
      </div>

      {/* Certifications */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">PARTB</Label>
          <YNSelect value={f.partB} onChange={v => set("partB", v)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">DME</Label>
          <YNSelect value={f.dme} onChange={v => set("dme", v)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">HHA</Label>
          <YNSelect value={f.hha} onChange={v => set("hha", v)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">PMD</Label>
          <YNSelect value={f.pmd} onChange={v => set("pmd", v)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">HOSPICE</Label>
          <YNSelect value={f.hospice} onChange={v => set("hospice", v)} />
        </div>
      </div>

      {/* Protocol */}
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Protocol</Label>
        <textarea
          value={f.protocol ?? ""}
          onChange={e => set("protocol", e.target.value)}
          rows={2}
          className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]"
        />
      </div>

      {/* License */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">License Number</Label>
          <Input value={f.licenseNumber ?? ""} onChange={e => set("licenseNumber", e.target.value)} placeholder="A 105154" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">License State</Label>
          <StateSelect value={f.licenseState ?? "CA"} onChange={v => set("licenseState", v)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">License Expiration</Label>
          <Input type="date" value={f.licenseExpiration ?? ""} onChange={e => set("licenseExpiration", e.target.value || null)} />
        </div>
      </div>

      {/* Other */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">External ID</Label>
          <Input value={f.externalId ?? ""} onChange={e => set("externalId", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Practice Management Agency ID</Label>
          <Input value={f.agencyId ?? ""} onChange={e => set("agencyId", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Physician Type</Label>
          <select
            value={f.physicianType ?? ""}
            onChange={e => set("physicianType", e.target.value || null)}
            className="w-full h-9 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]"
          >
            <option value="">(Select Physician Type)</option>
            {PHYSICIAN_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={saving} className="bg-[#1e5f8a] hover:bg-[#174f75] text-white">
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
      </div>
    </form>
  );
}

type View = "list" | "add" | "edit";

export default function PhysicianPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [editTarget, setEditTarget] = useState<Physician | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/libraries/physicians")
      .then(r => r.json())
      .then(setPhysicians)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(data: FormData) {
    setSaving(true); setSaveError(null);
    try {
      const res = await fetch("/api/libraries/physicians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { setSaveError((await res.json()).error ?? "Failed"); return; }
      const added: Physician = await res.json();
      setPhysicians(prev => [...prev, added].sort((a, b) => a.lastName.localeCompare(b.lastName)));
      setView("list");
    } catch { setSaveError("Network error"); }
    finally { setSaving(false); }
  }

  async function handleEdit(data: FormData) {
    if (!editTarget) return;
    setSaving(true); setSaveError(null);
    try {
      const res = await fetch(`/api/libraries/physicians/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { setSaveError((await res.json()).error ?? "Failed"); return; }
      const updated: Physician = await res.json();
      setPhysicians(prev =>
        prev.map(p => p.id === updated.id ? updated : p).sort((a, b) => a.lastName.localeCompare(b.lastName))
      );
      setView("list"); setEditTarget(null);
    } catch { setSaveError("Network error"); }
    finally { setSaving(false); }
  }

  async function handleToggleActive(ph: Physician) {
    const res = await fetch(`/api/libraries/physicians/${ph.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !ph.isActive }),
    });
    if (!res.ok) { alert("Failed"); return; }
    const updated: Physician = await res.json();
    setPhysicians(prev => prev.map(p => p.id === updated.id ? updated : p));
  }

  if (status === "loading" || loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e5f8a]" />
    </div>
  );

  const displayed = showInactive ? physicians : physicians.filter(p => p.isActive);

  if (view === "add") return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">Add Physician</h1>
      <div className="border rounded-md p-6 bg-white">
        <PhysicianForm
          initial={EMPTY}
          onSave={handleAdd}
          onCancel={() => { setView("list"); setSaveError(null); }}
          saving={saving}
          error={saveError}
        />
      </div>
    </div>
  );

  if (view === "edit" && editTarget) {
    // Exclude DB-managed fields so they don't get sent back in the PATCH body
    // (createdAt/updatedAt come from the API response at runtime but aren't in the TS type)
    const { id: _id, isActive: _ia, code: _code, ...withTimestamps } = editTarget as Physician & { createdAt?: unknown; updatedAt?: unknown };
    const { createdAt: _ca, updatedAt: _ua, ...rest } = withTimestamps;
    void _ca; void _ua;
    void _id; void _ia; void _code;
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-xl font-bold">Edit Physician — {editTarget.firstName} {editTarget.lastName}</h1>
        <div className="border rounded-md p-6 bg-white">
          <PhysicianForm
            initial={rest}
            onSave={handleEdit}
            onCancel={() => { setView("list"); setEditTarget(null); setSaveError(null); }}
            saving={saving}
            error={saveError}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Physicians</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ordering physicians and medical directors</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
            Show inactive
          </label>
          <Button variant="outline" size="sm" asChild>
            <Link href="/libraries">← Libraries</Link>
          </Button>
          {isAdmin && (
            <Button
              size="sm"
              className="bg-[#1e5f8a] hover:bg-[#174f75] text-white"
              onClick={() => { setSaveError(null); setView("add"); }}
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1" /> Add Physician
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-[#1e5f8a] text-white text-left">
              <th className="px-3 py-2.5 font-medium w-20">Code</th>
              <th className="px-3 py-2.5 font-medium">Last Name</th>
              <th className="px-3 py-2.5 font-medium">First Name</th>
              <th className="px-3 py-2.5 font-medium w-16">Title</th>
              <th className="px-3 py-2.5 font-medium w-28">NPI</th>
              <th className="px-3 py-2.5 font-medium w-28">PECOS</th>
              <th className="px-3 py-2.5 font-medium w-14">PARTB</th>
              <th className="px-3 py-2.5 font-medium w-14">DME</th>
              <th className="px-3 py-2.5 font-medium w-32">License Exp.</th>
              <th className="px-3 py-2.5 font-medium w-20">Status</th>
              {isAdmin && <th className="px-3 py-2.5 font-medium w-28">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 11 : 10} className="px-4 py-6 text-center text-gray-400">
                  No physicians found.
                </td>
              </tr>
            )}
            {displayed.map(ph => {
              const warn = licenseWarning(ph.licenseExpiration);
              return (
                <tr key={ph.id} className={`border-t hover:bg-gray-50 ${!ph.isActive ? "opacity-50" : ""}`}>
                  <td className="px-3 py-2.5 font-mono text-gray-600 text-xs">{ph.code ?? "—"}</td>
                  <td className="px-3 py-2.5 font-medium">{ph.lastName}</td>
                  <td className="px-3 py-2.5">{ph.firstName}</td>
                  <td className="px-3 py-2.5 text-gray-600">{ph.title ?? "—"}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{ph.npi ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${
                      ph.pecosStatus === "Enrolled"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : ph.pecosStatus === "Not Enrolled"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : ph.pecosStatus === "Pending"
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}>
                      {ph.pecosStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-600">{yn(ph.partB)}</td>
                  <td className="px-3 py-2.5 text-center text-gray-600">{yn(ph.dme)}</td>
                  <td className="px-3 py-2.5">
                    {ph.licenseExpiration ? (
                      <span className={`text-xs font-medium ${
                        warn === "expired" ? "text-red-700" : warn === "soon" ? "text-amber-700" : "text-gray-700"
                      }`}>
                        {warn === "expired" && "⚠ "}
                        {warn === "soon" && "⚠ "}
                        {ph.licenseExpiration}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${ph.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-300"}`}>
                      {ph.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditTarget(ph); setSaveError(null); setView("edit"); }}
                          className="text-[#1e5f8a] hover:text-[#174f75]"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(ph)}
                          className="text-xs text-gray-500 hover:text-gray-800 underline"
                        >
                          {ph.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
