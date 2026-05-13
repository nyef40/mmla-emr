"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, PlusCircle } from "lucide-react";

type IcdCode = {
  id: number;
  code: string;
  description: string;
  category: string;
  displayOrder: number;
  isActive: boolean;
};

const CATEGORIES = [
  "Neurological", "Immunological", "Hematological", "Rheumatological",
  "Gastrointestinal", "Infectious", "Oncological", "Encounter", "Other",
];

const EMPTY_FORM = { code: "", description: "", category: "Other", displayOrder: "99" };

export default function IcdCodesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [codes, setCodes] = useState<IcdCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState("");

  const isAdmin = session?.user?.role === "admin";
  const sel = "flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/libraries/icd-codes")
      .then(r => r.json())
      .then(setCodes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayed = codes
    .filter(c => showInactive ? true : c.isActive)
    .filter(c =>
      !search.trim() ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
    );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setAddError("");
    try {
      const res = await fetch("/api/libraries/icd-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          description: form.description,
          category: form.category,
          displayOrder: parseInt(form.displayOrder, 10) || 99,
        }),
      });
      if (!res.ok) { setAddError((await res.json()).error ?? "Failed"); return; }
      const added: IcdCode = await res.json();
      setCodes(prev => [...prev, added].sort((a, b) => a.displayOrder - b.displayOrder || a.code.localeCompare(b.code)));
      setForm(EMPTY_FORM);
      setShowAdd(false);
    } catch { setAddError("Network error"); }
    finally { setSaving(false); }
  }

  async function handleToggle(c: IcdCode) {
    const res = await fetch(`/api/libraries/icd-codes/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    if (!res.ok) { alert("Failed"); return; }
    const updated: IcdCode = await res.json();
    setCodes(prev => prev.map(x => x.id === updated.id ? updated : x));
  }

  if (status === "loading" || loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e5f8a]" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ICD-10 Codes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Curated diagnosis codes for patient intake</p>
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
              onClick={() => { setShowAdd(a => !a); setAddError(""); }}
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1" />
              {showAdd ? "Cancel" : "Add Code"}
            </Button>
          )}
        </div>
      </div>

      {/* Add form */}
      {showAdd && isAdmin && (
        <form onSubmit={handleAdd} className="border rounded-md p-4 bg-white space-y-3">
          <p className="text-sm font-semibold text-gray-700">New ICD-10 Code</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Code <span className="text-red-500">*</span></Label>
              <Input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="G61.81"
                required
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs font-semibold">Description <span className="text-red-500">*</span></Label>
              <Input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Chronic inflammatory demyelinating polyneuritis"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Category</Label>
              <select
                className={sel}
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-24 space-y-1">
              <Label className="text-xs font-semibold">Order</Label>
              <Input
                type="number"
                value={form.displayOrder}
                onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))}
                min={0}
              />
            </div>
            {addError && <p className="text-xs text-red-600">{addError}</p>}
            <Button type="submit" disabled={saving} className="mt-5 bg-[#1e5f8a] hover:bg-[#174f75] text-white">
              {saving ? "Adding…" : "Add"}
            </Button>
          </div>
        </form>
      )}

      {/* Search */}
      <Input
        placeholder="Search by code, description, or category…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Table */}
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#1e5f8a] text-white text-left">
              <th className="px-4 py-2.5 font-medium w-16">Order</th>
              <th className="px-4 py-2.5 font-medium w-28">Code</th>
              <th className="px-4 py-2.5 font-medium">Description</th>
              <th className="px-4 py-2.5 font-medium w-32">Category</th>
              <th className="px-4 py-2.5 font-medium w-20">Status</th>
              {isAdmin && <th className="px-4 py-2.5 font-medium w-28">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-4 py-6 text-center text-gray-400">
                  {search ? "No codes match your search." : "No ICD codes found."}
                </td>
              </tr>
            )}
            {displayed.map(c => (
              <tr key={c.id} className={`border-t hover:bg-gray-50 ${!c.isActive ? "opacity-50" : ""}`}>
                <td className="px-4 py-2.5 text-gray-400 text-center">{c.displayOrder}</td>
                <td className="px-4 py-2.5 font-mono font-semibold text-[#1e5f8a]">{c.code}</td>
                <td className="px-4 py-2.5">{c.description}</td>
                <td className="px-4 py-2.5">
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-50 text-gray-600 border-gray-200">
                    {c.category}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${c.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-300"}`}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(c)}
                        className="text-xs text-gray-500 hover:text-gray-800 underline"
                      >
                        {c.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleToggle({ ...c, isActive: true })}
                        title="Deactivate"
                        className="text-gray-300 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">{displayed.length} code{displayed.length !== 1 ? "s" : ""} shown</p>
    </div>
  );
}
