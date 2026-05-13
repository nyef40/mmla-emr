"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, X } from "lucide-react";

type StaffUser = { id: number; name: string | null; email: string; role: string | null };
type Assignment = { id: number; staff: StaffUser; assignedBy: { name: string | null } };

const ROLE_LABELS: Record<string, string> = { admin: "Admin", staff: "Staff", rn: "RN", pt: "Patient" };

export function AssignStaffPanel({ patientId, canEdit }: { patientId: number; canEdit: boolean }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableStaff, setAvailableStaff] = useState<StaffUser[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/patients/${patientId}/assignments`)
      .then(r => r.json())
      .then(setAssignments)
      .finally(() => setLoading(false));
  }, [patientId]);

  function openPicker() {
    fetch("/api/admin/users")
      .then(r => r.json())
      .then((all: StaffUser[]) => {
        const assignedIds = new Set(assignments.map(a => a.staff.id));
        setAvailableStaff(all.filter(u => !assignedIds.has(u.id) && u.role !== "pt"));
      });
    setShowPicker(true);
  }

  async function assign(staffId: number) {
    setSaving(true);
    const res = await fetch(`/api/patients/${patientId}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId }),
    });
    if (res.ok) {
      const newA = await res.json();
      const staff = availableStaff.find(u => u.id === staffId)!;
      setAssignments(prev => [...prev, { ...newA, staff, assignedBy: { name: null } }]);
      setAvailableStaff(prev => prev.filter(u => u.id !== staffId));
    }
    setSaving(false);
    setShowPicker(false);
  }

  async function remove(assignmentId: number) {
    await fetch(`/api/patients/${patientId}/assignments/${assignmentId}`, { method: "DELETE" });
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
  }

  if (loading) return <p className="text-sm text-gray-400">Loading staff…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Assigned Staff</h3>
        {canEdit && (
          <Button type="button" size="sm" variant="outline" onClick={openPicker}>
            <UserPlus className="h-3.5 w-3.5 mr-1" /> Assign
          </Button>
        )}
      </div>

      {assignments.length === 0 ? (
        <p className="text-sm text-gray-500">No staff assigned yet.</p>
      ) : (
        <ul className="space-y-2">
          {assignments.map(a => (
            <li key={a.id} className="flex items-center justify-between border rounded-md px-3 py-2">
              <div>
                <span className="text-sm font-medium">{a.staff.name ?? a.staff.email}</span>
                <Badge variant="outline" className="ml-2 text-xs">{ROLE_LABELS[a.staff.role ?? ""] ?? a.staff.role}</Badge>
              </div>
              {canEdit && (
                <button onClick={() => remove(a.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {showPicker && (
        <div className="border rounded-md p-3 space-y-2 bg-gray-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Select staff to assign</p>
          {availableStaff.length === 0 ? (
            <p className="text-sm text-gray-400">All eligible staff already assigned.</p>
          ) : (
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {availableStaff.map(u => (
                <li key={u.id}>
                  <button
                    disabled={saving}
                    onClick={() => assign(u.id)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-white hover:shadow-sm text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <span className="font-medium">{u.name ?? u.email}</span>
                    <Badge variant="outline" className="text-xs">{ROLE_LABELS[u.role ?? ""] ?? u.role}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Button type="button" size="sm" variant="ghost" onClick={() => setShowPicker(false)}>Cancel</Button>
        </div>
      )}
    </div>
  );
}
