"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";

type LogEntry = {
  id: number;
  logDate: string;
  entry: string;
  createdAt: string;
  user: { name: string | null } | null;
};

export function PatientBillingLog({ patientId, canEdit }: { patientId: number; canEdit: boolean }) {
  const [logs,    setLogs]    = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [draft,   setDraft]   = useState({ logDate: new Date().toISOString().slice(0, 10), entry: "" });

  useEffect(() => {
    fetch(`/api/patients/${patientId}/logs`)
      .then(r => r.json())
      .then(setLogs)
      .finally(() => setLoading(false));
  }, [patientId]);

  async function save() {
    if (!draft.entry.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/patients/${patientId}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (res.ok) {
      const row = await res.json();
      setLogs(prev => [row, ...prev]);
      setDraft({ logDate: new Date().toISOString().slice(0, 10), entry: "" });
      setAdding(false);
    }
    setSaving(false);
  }

  async function remove(logId: number) {
    await fetch(`/api/patients/${patientId}/logs`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logId }),
    });
    setLogs(prev => prev.filter(l => l.id !== logId));
  }

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Billing Log</h3>
        {canEdit && !adding && (
          <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Entry
          </Button>
        )}
      </div>

      {adding && (
        <div className="border rounded-md p-3 bg-gray-50 space-y-2">
          <div className="flex gap-2">
            <Input
              type="date"
              value={draft.logDate}
              onChange={e => setDraft(d => ({ ...d, logDate: e.target.value }))}
              className="w-36 text-sm"
            />
            <Input
              value={draft.entry}
              onChange={e => setDraft(d => ({ ...d, entry: e.target.value }))}
              placeholder="e.g. 03/16-04/14, TOB=329, submitted 22612401244507CAR"
              className="flex-1 text-sm"
              onKeyDown={e => { if (e.key === "Enter") save(); }}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving || !draft.entry.trim()}
              className="bg-[#1e5f8a] hover:bg-[#174f75] text-white">
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setDraft({ logDate: new Date().toISOString().slice(0, 10), entry: "" }); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {logs.length === 0 && !adding && (
        <p className="text-sm text-gray-500">No billing log entries yet.</p>
      )}

      <ul className="space-y-1">
        {logs.map(log => (
          <li key={log.id} className="flex items-start gap-3 text-sm py-1.5 border-b last:border-0">
            <span className="font-mono text-xs text-gray-500 shrink-0 pt-0.5 w-24">{log.logDate}</span>
            <span className="flex-1 text-gray-800">{log.entry}</span>
            {log.user?.name && (
              <span className="text-xs text-gray-400 shrink-0">{log.user.name}</span>
            )}
            {canEdit && (
              <button onClick={() => remove(log.id)} className="text-gray-300 hover:text-red-500 shrink-0 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
