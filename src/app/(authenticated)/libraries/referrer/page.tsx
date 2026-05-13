"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, PlusCircle } from "lucide-react";

type Referrer = {
  id: number;
  code: string | null;
  firstName: string;
  lastName: string;
  companyName: string | null;
  title: string | null;
  street: string | null;
  suite: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  externalId: string | null;
  protocol: string | null;
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

type FormData = Omit<Referrer, "id" | "isActive" | "code">;

const EMPTY: FormData = {
  firstName: "", lastName: "", companyName: "", title: "",
  street: "", suite: "", city: "", state: "CA", zipCode: "",
  phone: "", fax: "", email: "", externalId: "", protocol: "",
};

function ReferrerForm({
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
      {/* Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">First Name <span className="text-red-500">*</span></Label>
          <Input value={f.firstName} onChange={e => set("firstName", e.target.value)} required placeholder="Mary" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Last Name <span className="text-red-500">*</span></Label>
          <Input value={f.lastName} onChange={e => set("lastName", e.target.value)} required placeholder="Bebawi" />
        </div>
      </div>

      {/* Company + Title */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Company Name</Label>
          <Input value={f.companyName ?? ""} onChange={e => set("companyName", e.target.value)} placeholder="Specialty Care Rx Orange" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Title</Label>
          <Input value={f.title ?? ""} onChange={e => set("title", e.target.value)} placeholder="Care Coordinator" />
        </div>
      </div>

      {/* Address */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1 md:col-span-2">
          <Label className="text-xs font-semibold">Street</Label>
          <Input value={f.street ?? ""} onChange={e => set("street", e.target.value)} placeholder="200 E Katella Ave" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Suite / Apt #</Label>
          <Input value={f.suite ?? ""} onChange={e => set("suite", e.target.value)} placeholder="A" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">City</Label>
          <Input value={f.city ?? ""} onChange={e => set("city", e.target.value)} placeholder="Orange" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1 md:col-span-2">
          <Label className="text-xs font-semibold">State</Label>
          <select value={f.state ?? "CA"} onChange={e => set("state", e.target.value)} className={sel}>
            {US_STATES.map(([abbr, name]) => (
              <option key={abbr} value={abbr}>{abbr} — {name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Zip Code</Label>
          <Input value={f.zipCode ?? ""} onChange={e => set("zipCode", e.target.value)} placeholder="92867" />
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Phone</Label>
          <Input type="tel" value={f.phone ?? ""} onChange={e => set("phone", e.target.value)} placeholder="(714) 941-6177" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Fax</Label>
          <Input type="tel" value={f.fax ?? ""} onChange={e => set("fax", e.target.value)} placeholder="(714) 941-6178" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Email</Label>
          <Input type="email" value={f.email ?? ""} onChange={e => set("email", e.target.value)} placeholder="mbebawi@myscrx.com" />
        </div>
      </div>

      {/* External ID + Protocol */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">External ID</Label>
          <Input value={f.externalId ?? ""} onChange={e => set("externalId", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Protocol</Label>
          <textarea
            value={f.protocol ?? ""}
            onChange={e => set("protocol", e.target.value)}
            rows={2}
            className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a] resize-y"
          />
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

export default function ReferrerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [editTarget, setEditTarget] = useState<Referrer | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");

  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/libraries/referrers")
      .then(r => r.json())
      .then(setReferrers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(data: FormData) {
    setSaving(true); setSaveError(null);
    try {
      const res = await fetch("/api/libraries/referrers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { setSaveError((await res.json()).error ?? "Failed"); return; }
      const added: Referrer = await res.json();
      setReferrers(prev =>
        [...prev, added].sort((a, b) => a.lastName.localeCompare(b.lastName))
      );
      setView("list");
    } catch { setSaveError("Network error"); }
    finally { setSaving(false); }
  }

  async function handleEdit(data: FormData) {
    if (!editTarget) return;
    setSaving(true); setSaveError(null);
    try {
      const res = await fetch(`/api/libraries/referrers/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { setSaveError((await res.json()).error ?? "Failed"); return; }
      const updated: Referrer = await res.json();
      setReferrers(prev =>
        prev.map(r => r.id === updated.id ? updated : r)
          .sort((a, b) => a.lastName.localeCompare(b.lastName))
      );
      setView("list"); setEditTarget(null);
    } catch { setSaveError("Network error"); }
    finally { setSaving(false); }
  }

  async function handleToggleActive(r: Referrer) {
    const res = await fetch(`/api/libraries/referrers/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !r.isActive }),
    });
    if (!res.ok) { alert("Failed"); return; }
    const updated: Referrer = await res.json();
    setReferrers(prev => prev.map(x => x.id === updated.id ? updated : x));
  }

  if (status === "loading" || loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e5f8a]" />
    </div>
  );

  const q = search.toLowerCase();
  const displayed = referrers
    .filter(r => showInactive ? true : r.isActive)
    .filter(r =>
      !q ||
      r.firstName.toLowerCase().includes(q) ||
      r.lastName.toLowerCase().includes(q) ||
      (r.companyName ?? "").toLowerCase().includes(q) ||
      (r.code ?? "").includes(q)
    );

  if (view === "add") return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">Add Referrer</h1>
      <div className="border rounded-md p-6 bg-white">
        <ReferrerForm
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
        <h1 className="text-xl font-bold">Edit — {editTarget.firstName} {editTarget.lastName}</h1>
        <div className="border rounded-md p-6 bg-white">
          <ReferrerForm
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
          <h1 className="text-2xl font-bold">Referrers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Care coordinators and referring contacts</p>
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

      {/* Search */}
      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, company, or code…"
        className="w-full max-w-sm h-9 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5f8a]"
      />

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#1e5f8a] text-white text-left">
              <th className="px-4 py-2.5 font-medium w-20">Code</th>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Company</th>
              <th className="px-4 py-2.5 font-medium w-32">Title</th>
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
                <td colSpan={isAdmin ? 9 : 8} className="px-4 py-6 text-center text-gray-400">
                  No referrers found.
                </td>
              </tr>
            )}
            {displayed.map(r => (
              <tr key={r.id} className={`border-t hover:bg-gray-50 ${!r.isActive ? "opacity-50" : ""}`}>
                <td className="px-4 py-2.5 font-mono text-gray-600 text-xs">{r.code ?? "—"}</td>
                <td className="px-4 py-2.5 font-medium">{r.lastName}, {r.firstName}</td>
                <td className="px-4 py-2.5 text-gray-600">{r.companyName ?? "—"}</td>
                <td className="px-4 py-2.5 text-gray-600">{r.title ?? "—"}</td>
                <td className="px-4 py-2.5 text-gray-600">{r.city ?? "—"}</td>
                <td className="px-4 py-2.5 text-gray-600">{r.state ?? "—"}</td>
                <td className="px-4 py-2.5 text-gray-600">{r.phone ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${r.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-300"}`}>
                    {r.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditTarget(r); setSaveError(null); setView("edit"); }}
                        className="text-[#1e5f8a] hover:text-[#174f75]"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(r)}
                        className="text-xs text-gray-500 hover:text-gray-800 underline"
                      >
                        {r.isActive ? "Deactivate" : "Activate"}
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
