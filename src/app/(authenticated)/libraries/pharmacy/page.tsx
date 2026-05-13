"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, PlusCircle } from "lucide-react";

type VendorType = "Pharmacy" | "DME/Supply" | "Both";

type Pharmacy = {
  id: number;
  code: string | null;
  name: string;
  vendorType: VendorType;
  street: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  phone: string | null;
  fax: string | null;
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

const VENDOR_TYPES: VendorType[] = ["Both", "Pharmacy", "DME/Supply"];

const TYPE_BADGE: Record<VendorType, string> = {
  "Both":       "bg-blue-50 text-blue-700 border-blue-200",
  "Pharmacy":   "bg-green-50 text-green-700 border-green-200",
  "DME/Supply": "bg-orange-50 text-orange-700 border-orange-200",
};

type FormData = Omit<Pharmacy, "id" | "isActive" | "code">;

const EMPTY: FormData = {
  name: "", vendorType: "Both", street: "", city: "",
  state: "CA", zipCode: "", phone: "", fax: "",
};

function PharmacyForm({
  initial, onSave, onCancel, saving, error,
}: {
  initial: FormData;
  onSave: (data: FormData) => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [f, setF] = useState(initial);
  const set = (k: keyof FormData, v: string) => setF(prev => ({ ...prev, [k]: v }));
  const sel = "w-full h-9 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]";

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(f); }} className="space-y-5">
      {/* Name + Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Name <span className="text-red-500">*</span></Label>
          <Input value={f.name} onChange={e => set("name", e.target.value)} required placeholder="e.g. Kroger Specialty Infusion" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Vendor Type</Label>
          <select value={f.vendorType} onChange={e => set("vendorType", e.target.value)} className={sel}>
            {VENDOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Phone + Fax */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Phone</Label>
          <Input type="tel" value={f.phone ?? ""} onChange={e => set("phone", e.target.value)} placeholder="(310)755-2197" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Fax</Label>
          <Input type="tel" value={f.fax ?? ""} onChange={e => set("fax", e.target.value)} placeholder="(844)306-0202" />
        </div>
      </div>

      {/* Address */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1 md:col-span-2">
          <Label className="text-xs font-semibold">Address</Label>
          <Input value={f.street ?? ""} onChange={e => set("street", e.target.value)} placeholder="19110 Van Ness Ave" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">City</Label>
          <Input value={f.city ?? ""} onChange={e => set("city", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">State</Label>
            <select value={f.state ?? "CA"} onChange={e => set("state", e.target.value)} className={sel}>
              {US_STATES.map(([abbr, name]) => (
                <option key={abbr} value={abbr}>{abbr} — {name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Zip</Label>
            <Input value={f.zipCode ?? ""} onChange={e => set("zipCode", e.target.value)} />
          </div>
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

export default function PharmacyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [editTarget, setEditTarget] = useState<Pharmacy | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | VendorType>("all");

  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/libraries/pharmacies")
      .then(r => r.json())
      .then(setPharmacies)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(data: FormData) {
    setSaving(true); setSaveError(null);
    try {
      const res = await fetch("/api/libraries/pharmacies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { setSaveError((await res.json()).error ?? "Failed"); return; }
      const added: Pharmacy = await res.json();
      setPharmacies(prev => [...prev, added].sort((a, b) => a.name.localeCompare(b.name)));
      setView("list");
    } catch { setSaveError("Network error"); }
    finally { setSaving(false); }
  }

  async function handleEdit(data: FormData) {
    if (!editTarget) return;
    setSaving(true); setSaveError(null);
    try {
      const res = await fetch(`/api/libraries/pharmacies/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { setSaveError((await res.json()).error ?? "Failed"); return; }
      const updated: Pharmacy = await res.json();
      setPharmacies(prev =>
        prev.map(p => p.id === updated.id ? updated : p).sort((a, b) => a.name.localeCompare(b.name))
      );
      setView("list"); setEditTarget(null);
    } catch { setSaveError("Network error"); }
    finally { setSaving(false); }
  }

  async function handleToggleActive(p: Pharmacy) {
    const res = await fetch(`/api/libraries/pharmacies/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    if (!res.ok) { alert("Failed"); return; }
    const updated: Pharmacy = await res.json();
    setPharmacies(prev => prev.map(x => x.id === updated.id ? updated : x));
  }

  if (status === "loading" || loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e5f8a]" />
    </div>
  );

  const displayed = pharmacies
    .filter(p => showInactive ? true : p.isActive)
    .filter(p => typeFilter === "all" ? true : p.vendorType === typeFilter || p.vendorType === "Both");

  if (view === "add") return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">Add Pharmacy / DME Vendor</h1>
      <div className="border rounded-md p-6 bg-white">
        <PharmacyForm
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
    const { id: _id, isActive: _ia, code: _code, ...rest } = editTarget;
    void _id; void _ia; void _code;
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-xl font-bold">Edit — {editTarget.name}</h1>
        <div className="border rounded-md p-6 bg-white">
          <PharmacyForm
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
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pharmacies & DME Vendors</h1>
          <p className="text-sm text-gray-500 mt-0.5">Dispensing pharmacies and DME/supply vendors</p>
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
              <PlusCircle className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          )}
        </div>
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-1 border-b">
        {(["all", "Both", "Pharmacy", "DME/Supply"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
              typeFilter === t
                ? "border-[#1e5f8a] text-[#1e5f8a]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "all" ? "All" : t}
            <span className="ml-1.5 text-xs text-gray-400">
              ({t === "all"
                ? pharmacies.filter(p => showInactive ? true : p.isActive).length
                : pharmacies.filter(p => (showInactive ? true : p.isActive) && (p.vendorType === t || p.vendorType === "Both")).length
              })
            </span>
          </button>
        ))}
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#1e5f8a] text-white text-left">
              <th className="px-4 py-2.5 font-medium w-20">Code</th>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium w-28">Type</th>
              <th className="px-4 py-2.5 font-medium">City</th>
              <th className="px-4 py-2.5 font-medium w-16">State</th>
              <th className="px-4 py-2.5 font-medium">Phone</th>
              <th className="px-4 py-2.5 font-medium w-20">Status</th>
              {isAdmin && <th className="px-4 py-2.5 font-medium w-28">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-4 py-6 text-center text-gray-400">
                  No vendors found.
                </td>
              </tr>
            )}
            {displayed.map(p => (
              <tr key={p.id} className={`border-t hover:bg-gray-50 ${!p.isActive ? "opacity-50" : ""}`}>
                <td className="px-4 py-2.5 font-mono text-gray-600 text-xs">{p.code ?? "—"}</td>
                <td className="px-4 py-2.5 font-medium">{p.name}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_BADGE[p.vendorType ?? "Both"]}`}>
                    {p.vendorType ?? "Both"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-600">{p.city ?? "—"}</td>
                <td className="px-4 py-2.5 text-gray-600">{p.state ?? "—"}</td>
                <td className="px-4 py-2.5 text-gray-600">{p.phone ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${p.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-300"}`}>
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditTarget(p); setSaveError(null); setView("edit"); }}
                        className="text-[#1e5f8a] hover:text-[#174f75]"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(p)}
                        className="text-xs text-gray-500 hover:text-gray-800 underline"
                      >
                        {p.isActive ? "Deactivate" : "Activate"}
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
