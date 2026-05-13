"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2 } from "lucide-react";
import type { InfusionRow } from "../types";
import { v4 as uuidv4 } from "uuid";

type Props = {
  rows: InfusionRow[];
  onChange: (rows: InfusionRow[]) => void;
};

function addRow(rows: InfusionRow[]): InfusionRow[] {
  return [...rows, { id: uuidv4(), time: "", temp: "", hr: "", rr: "", bp: "", rate: "", stop: "", resume: "", notes: "" }];
}

function updateRow(rows: InfusionRow[], id: string, patch: Partial<InfusionRow>): InfusionRow[] {
  return rows.map(r => r.id === id ? { ...r, ...patch } : r);
}

function removeRow(rows: InfusionRow[], id: string): InfusionRow[] {
  return rows.filter(r => r.id !== id);
}

const TH = ({ children }: { children?: React.ReactNode }) => (
  <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-semibold text-left whitespace-nowrap">{children}</th>
);

export function InfusionRecordSection({ rows, onChange }: Props) {
  return (
    <div className="border rounded-md p-4 space-y-4">
      <div className="flex items-center justify-between border-b pb-1">
        <h3 className="font-bold text-sm uppercase tracking-wide">Infusion Record</h3>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange(addRow(rows))}>
          <PlusCircle className="h-4 w-4 mr-1" /> Add Row
        </Button>
      </div>

      <p className="text-xs text-gray-500">Add a row at arrival, then every monitoring interval, and at completion.</p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm min-w-[900px]">
          <thead>
            <tr>
              <TH>Time</TH>
              <TH>Temp</TH>
              <TH>HR</TH>
              <TH>RR</TH>
              <TH>BP</TH>
              <TH>Rate (ml/hr)</TH>
              <TH>Stop</TH>
              <TH>Resume</TH>
              <TH>Intervention / Notes</TH>
              <TH></TH>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="border border-gray-300 px-3 py-4 text-center text-gray-400 text-sm">
                  No rows yet — click &ldquo;Add Row&rdquo; when the infusion begins.
                </td>
              </tr>
            )}
            {rows.map(row => (
              <tr key={row.id}>
                <td className="border border-gray-300 p-1">
                  <Input type="time" value={row.time} onChange={e => onChange(updateRow(rows, row.id, { time: e.target.value }))} className="h-7 w-24 text-xs" />
                </td>
                <td className="border border-gray-300 p-1">
                  <Input value={row.temp} onChange={e => onChange(updateRow(rows, row.id, { temp: e.target.value }))} placeholder="98.6" className="h-7 w-16 text-xs" />
                </td>
                <td className="border border-gray-300 p-1">
                  <Input value={row.hr} onChange={e => onChange(updateRow(rows, row.id, { hr: e.target.value }))} placeholder="72" className="h-7 w-14 text-xs" />
                </td>
                <td className="border border-gray-300 p-1">
                  <Input value={row.rr} onChange={e => onChange(updateRow(rows, row.id, { rr: e.target.value }))} placeholder="18" className="h-7 w-14 text-xs" />
                </td>
                <td className="border border-gray-300 p-1">
                  <Input value={row.bp} onChange={e => onChange(updateRow(rows, row.id, { bp: e.target.value }))} placeholder="120/80" className="h-7 w-20 text-xs" />
                </td>
                <td className="border border-gray-300 p-1">
                  <Input value={row.rate} onChange={e => onChange(updateRow(rows, row.id, { rate: e.target.value }))} placeholder="25" className="h-7 w-20 text-xs" />
                </td>
                <td className="border border-gray-300 p-1">
                  <Input type="time" value={row.stop} onChange={e => onChange(updateRow(rows, row.id, { stop: e.target.value }))} className="h-7 w-24 text-xs" />
                </td>
                <td className="border border-gray-300 p-1">
                  <Input type="time" value={row.resume} onChange={e => onChange(updateRow(rows, row.id, { resume: e.target.value }))} className="h-7 w-24 text-xs" />
                </td>
                <td className="border border-gray-300 p-1">
                  <textarea
                    value={row.notes}
                    onChange={e => onChange(updateRow(rows, row.id, { notes: e.target.value }))}
                    rows={2}
                    className="w-full min-w-[240px] text-xs border-0 focus:ring-0 resize-y p-1"
                    placeholder="Describe patient status, interventions, observations..."
                  />
                </td>
                <td className="border border-gray-300 p-1">
                  <Button type="button" size="icon" variant="ghost" onClick={() => onChange(removeRow(rows, row.id))} className="h-7 w-7 text-red-500 hover:text-red-700">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
