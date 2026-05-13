"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, PlusCircle } from "lucide-react";

type Insurance = {
  id: number;
  name: string;
  category: string;
  code: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  // billing identity
  billType: string;
  insuranceType: string | null;
  financialClass: string | null;
  payorSubmitterId: string | null;
  providerNumber: string | null;
  payorType: string | null;
  // billing behavior
  billMethod: string;
  ppsBilling: boolean;
  ewRequired: boolean;
  timelyFilingDays: number | null;
  // billing requirements
  authRequired: boolean;
  requiresPlanOfCare: boolean;
  requiresHippsCode: boolean;
  vbpPpsAdjust: boolean;
  // EDI
  ediReceiverId: string | null;
  ediReceiverQualifier: string | null;
  ediReceiverName: string | null;
  sbrPayorQualifier: string | null;
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

const CATEGORIES = [
  "Medicare","MedicareAdvantagePFFS","MedicareAdvantagePPOHMO","MedicareEpisodic",
  "Medicaid","MedicaidHMO","Commercial","PrivatePay","Other",
];

const INSURANCE_TYPES = [
  "","MedicareRevType","MedicaidRevType","CommercialRevType","CommercialProfessional","OtherRevType",
];

const FINANCIAL_CLASSES = [
  "","MedicareClass","MedicaidClass","CommercialClass","PrivatePayClass",
];

const PAYOR_TYPES = [
  "","1-Medicare","2-Medicaid","3-TRICARE","4-ChampVA",
  "5-GroupHealthPlan","6-FECABlackLung","7-WorkersComp","8-PrivateInsurance",
];

const SBR_QUALIFIERS = [
  { value: "", label: "—" },
  { value: "MA", label: "MA — Medicare Part A" },
  { value: "MB", label: "MB — Medicare Part B" },
  { value: "MC", label: "MC — Medicaid" },
  { value: "BL", label: "BL — Blue Cross Blue Shield" },
  { value: "CI", label: "CI — Commercial Insurance" },
  { value: "HM", label: "HM — HMO" },
  { value: "OF", label: "OF — Other Federal Program" },
  { value: "TV", label: "TV — Title V" },
  { value: "CH", label: "CH — TRICARE" },
];

type FormData = Omit<Insurance, "id" | "isActive" | "code">;

const EMPTY: FormData = {
  name: "", category: "Other", phone: "",
  street: "", city: "", state: "CA", zipCode: "",
  billType: "UB04", insuranceType: "", financialClass: "",
  payorSubmitterId: "", providerNumber: "", payorType: "",
  billMethod: "Normal", ppsBilling: false, ewRequired: false, timelyFilingDays: null,
  authRequired: false, requiresPlanOfCare: false, requiresHippsCode: false, vbpPpsAdjust: false,
  ediReceiverId: "", ediReceiverQualifier: "ZZ", ediReceiverName: "", sbrPayorQualifier: "",
};

type FormTab = "address" | "billing" | "edi";

function Sel({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[] | { value: string; label: string }[]; required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-9 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]"
        required={required}
      >
        {(options as (string | { value: string; label: string })[]).map(o =>
          typeof o === "string"
            ? <option key={o} value={o}>{o || "—"}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>
        )}
      </select>
    </div>
  );
}

function Chk({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded" />
      {label}
    </label>
  );
}

function InsuranceForm({
  initial, onSave, onCancel, saving, error,
}: {
  initial: FormData;
  onSave: (data: FormData) => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [f, setF] = useState<FormData>(initial);
  const [tab, setTab] = useState<FormTab>("address");
  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => setF(prev => ({ ...prev, [k]: v }));

  const tabCls = (t: FormTab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t
      ? "border-[#1e5f8a] text-[#1e5f8a]"
      : "border-transparent text-gray-500 hover:text-gray-700"}`;

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(f); }} className="space-y-0">
      {/* Tab bar */}
      <div className="flex border-b mb-5">
        <button type="button" className={tabCls("address")} onClick={() => setTab("address")}>Name / Address</button>
        <button type="button" className={tabCls("billing")} onClick={() => setTab("billing")}>Insurance / Billing</button>
        <button type="button" className={tabCls("edi")} onClick={() => setTab("edi")}>EDI Configuration</button>
      </div>

      {/* ── Tab 1: Name / Address ── */}
      {tab === "address" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Name <span className="text-red-500">*</span></Label>
              <Input value={f.name} onChange={e => set("name", e.target.value)} required placeholder="e.g. Blue Shield of California" />
            </div>
            <Sel label="Category" value={f.category} onChange={v => set("category", v)} options={CATEGORIES} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Phone</Label>
              <Input type="tel" value={f.phone ?? ""} onChange={e => set("phone", e.target.value)} placeholder="8005416652" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs font-semibold">Street</Label>
              <Input value={f.street ?? ""} onChange={e => set("street", e.target.value)} placeholder="PO Box 272540" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">City</Label>
              <Input value={f.city ?? ""} onChange={e => set("city", e.target.value)} placeholder="Chico" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">State</Label>
                <select
                  value={f.state ?? "CA"}
                  onChange={e => set("state", e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]"
                >
                  {US_STATES.map(([abbr, name]) => (
                    <option key={abbr} value={abbr}>{abbr} — {name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Zip</Label>
                <Input value={f.zipCode ?? ""} onChange={e => set("zipCode", e.target.value)} placeholder="95927" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Insurance / Billing ── */}
      {tab === "billing" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Sel label="Bill Type" value={f.billType} onChange={v => set("billType", v)} options={["UB04", "CMS1500"]} />
            <Sel label="Bill Method" value={f.billMethod} onChange={v => set("billMethod", v)} options={["Normal", "PPS", "Episodic"]} />
            <Sel label="Insurance Type" value={f.insuranceType ?? ""} onChange={v => set("insuranceType", v)} options={INSURANCE_TYPES} />
            <Sel label="Financial Class" value={f.financialClass ?? ""} onChange={v => set("financialClass", v)} options={FINANCIAL_CLASSES} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Payor / Submitter #</Label>
              <Input value={f.payorSubmitterId ?? ""} onChange={e => set("payorSubmitterId", e.target.value)} placeholder="06014" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Provider #</Label>
              <Input value={f.providerNumber ?? ""} onChange={e => set("providerNumber", e.target.value)} placeholder="Our provider # with payer" />
            </div>
            <Sel label="Payor Type" value={f.payorType ?? ""} onChange={v => set("payorType", v)} options={PAYOR_TYPES} />
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Timely Filing (days)</Label>
              <Input
                type="number" min={0} max={365}
                value={f.timelyFilingDays ?? ""}
                onChange={e => set("timelyFilingDays", e.target.value ? parseInt(e.target.value, 10) : null)}
                placeholder="365"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
            <Chk label="PPS Billing" checked={f.ppsBilling} onChange={v => set("ppsBilling", v)} />
            <Chk label="EW Required" checked={f.ewRequired} onChange={v => set("ewRequired", v)} />
          </div>

          <div className="border rounded-md p-4 bg-gray-50 space-y-3">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Billing Requirements</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Chk label="Plan of Care" checked={f.requiresPlanOfCare} onChange={v => set("requiresPlanOfCare", v)} />
              <Chk label="Authorization" checked={f.authRequired} onChange={v => set("authRequired", v)} />
              <Chk label="HIPPS Code" checked={f.requiresHippsCode} onChange={v => set("requiresHippsCode", v)} />
              <Chk label="VBP PPS Adjust" checked={f.vbpPpsAdjust} onChange={v => set("vbpPpsAdjust", v)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 3: EDI Configuration ── */}
      {tab === "edi" && (
        <div className="space-y-5">
          <p className="text-xs text-gray-500">
            These fields configure the 837i/837p envelope for this payer. They replace the "option set" concept —
            each insurance record carries its own EDI parameters used when generating X12 claim files.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">EDI Receiver ID <span className="text-gray-400 font-normal">(ISA*08 / NM1*40*09)</span></Label>
              <Input value={f.ediReceiverId ?? ""} onChange={e => set("ediReceiverId", e.target.value)} placeholder="06014" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">EDI Receiver Qualifier <span className="text-gray-400 font-normal">(ISA*07)</span></Label>
              <select
                value={f.ediReceiverQualifier ?? "ZZ"}
                onChange={e => set("ediReceiverQualifier", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]"
              >
                <option value="ZZ">ZZ — Mutually Defined</option>
                <option value="01">01 — DUNS</option>
                <option value="30">30 — U.S. Federal TIN</option>
                <option value="NPI">NPI</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">EDI Receiver Name <span className="text-gray-400 font-normal">(NM1*40*03)</span></Label>
              <Input value={f.ediReceiverName ?? ""} onChange={e => set("ediReceiverName", e.target.value)} placeholder="MEDICARE" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Sel
              label="SBR Payor Qualifier (SBR*09)"
              value={f.sbrPayorQualifier ?? ""}
              onChange={v => set("sbrPayorQualifier", v)}
              options={SBR_QUALIFIERS}
            />
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-400">Equivalent Netsmart Option Set</Label>
              <Input
                disabled
                value={
                  f.category === "Medicare" ? "0155 - Medicare MMLA"
                  : f.billType === "CMS1500" ? "0223 - NonPPS 837P"
                  : f.category === "Commercial" ? "0200 - Commercial HH 837I (UB04)"
                  : f.category.startsWith("Medicaid") ? "Medicaid 837I"
                  : "—"
                }
                className="bg-gray-100 text-gray-500"
              />
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600 pt-2">{error}</p>}

      <div className="flex gap-2 pt-5 border-t mt-5">
        <Button type="submit" disabled={saving} className="bg-[#1e5f8a] hover:bg-[#174f75] text-white">
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
      </div>
    </form>
  );
}

type View = "list" | "add" | "edit";

export default function InsurancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [editTarget, setEditTarget] = useState<Insurance | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/libraries/insurances")
      .then(r => r.json())
      .then(setInsurances)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(data: FormData) {
    setSaving(true); setSaveError(null);
    try {
      const res = await fetch("/api/libraries/insurances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { setSaveError((await res.json()).error ?? "Failed"); return; }
      const added: Insurance = await res.json();
      setInsurances(prev => [...prev, added].sort((a, b) => a.name.localeCompare(b.name)));
      setView("list");
    } catch { setSaveError("Network error"); }
    finally { setSaving(false); }
  }

  async function handleEdit(data: FormData) {
    if (!editTarget) return;
    setSaving(true); setSaveError(null);
    try {
      const res = await fetch(`/api/libraries/insurances/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { setSaveError((await res.json()).error ?? "Failed"); return; }
      const updated: Insurance = await res.json();
      setInsurances(prev => prev.map(i => i.id === updated.id ? updated : i).sort((a, b) => a.name.localeCompare(b.name)));
      setView("list"); setEditTarget(null);
    } catch { setSaveError("Network error"); }
    finally { setSaving(false); }
  }

  async function handleToggleActive(ins: Insurance) {
    const res = await fetch(`/api/libraries/insurances/${ins.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !ins.isActive }),
    });
    if (!res.ok) { alert("Failed"); return; }
    const updated: Insurance = await res.json();
    setInsurances(prev => prev.map(i => i.id === updated.id ? updated : i));
  }

  if (status === "loading" || loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e5f8a]" />
    </div>
  );

  const displayed = insurances.filter(i => showInactive ? true : i.isActive);

  function formInitial(ins: Insurance): FormData {
    const { id, isActive, code, ...rest } = ins;
    void id; void isActive; void code;
    return rest;
  }

  if (view === "add") return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">Add Insurance</h1>
      <div className="border rounded-md p-6 bg-white">
        <InsuranceForm initial={EMPTY} onSave={handleAdd} onCancel={() => { setView("list"); setSaveError(null); }} saving={saving} error={saveError} />
      </div>
    </div>
  );

  if (view === "edit" && editTarget) return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">Edit Insurance — {editTarget.name}</h1>
      <div className="border rounded-md p-6 bg-white">
        <InsuranceForm initial={formInitial(editTarget)} onSave={handleEdit} onCancel={() => { setView("list"); setEditTarget(null); setSaveError(null); }} saving={saving} error={saveError} />
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Insurance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Payers available for patient intake and billing</p>
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
            <Button size="sm" className="bg-[#1e5f8a] hover:bg-[#174f75] text-white" onClick={() => { setSaveError(null); setView("add"); }}>
              <PlusCircle className="h-3.5 w-3.5 mr-1" /> Add Insurance
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#1e5f8a] text-white text-left">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">Code</th>
              <th className="px-4 py-2.5 font-medium">Bill Type</th>
              <th className="px-4 py-2.5 font-medium">Payor ID</th>
              <th className="px-4 py-2.5 font-medium">SBR</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              {isAdmin && <th className="px-4 py-2.5 font-medium w-28">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-4 py-6 text-center text-gray-400">
                  No insurance records.
                </td>
              </tr>
            )}
            {displayed.map(ins => (
              <tr key={ins.id} className={`border-t hover:bg-gray-50 ${!ins.isActive ? "opacity-50" : ""}`}>
                <td className="px-4 py-2.5 font-medium">{ins.name}</td>
                <td className="px-4 py-2.5 text-gray-600">{ins.category}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{ins.code ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${ins.billType === "UB04" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-orange-50 text-orange-700 border-orange-200"}`}>
                    {ins.billType}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{ins.payorSubmitterId ?? "—"}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{ins.sbrPayorQualifier ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ins.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-300"}`}>
                    {ins.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditTarget(ins); setSaveError(null); setView("edit"); }}
                        className="text-[#1e5f8a] hover:text-[#174f75]"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(ins)}
                        className="text-xs text-gray-500 hover:text-gray-800 underline"
                      >
                        {ins.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
