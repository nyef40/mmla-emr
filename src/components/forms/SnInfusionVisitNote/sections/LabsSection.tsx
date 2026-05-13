"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LabsData } from "../types";

type Props = { data: LabsData; onChange: (u: Partial<LabsData>) => void };

function CB({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded border-gray-300 h-3.5 w-3.5" />
      <span>{label}</span>
    </label>
  );
}

export function LabsSection({ data, onChange }: Props) {
  return (
    <div className="border rounded-md p-4 space-y-4">
      <h3 className="font-bold text-sm uppercase tracking-wide border-b pb-1">Labs</h3>

      <div className="flex flex-wrap gap-3">
        <CB checked={data.na} onChange={v => onChange({ na: v })} label="N/A" />
        <CB checked={data.cbc} onChange={v => onChange({ cbc: v })} label="CBC" />
        <CB checked={data.bmp} onChange={v => onChange({ bmp: v })} label="BMP" />
        <CB checked={data.cmp} onChange={v => onChange({ cmp: v })} label="CMP" />
        <CB checked={data.bun} onChange={v => onChange({ bun: v })} label="BUN" />
        <CB checked={data.creat} onChange={v => onChange({ creat: v })} label="Creat." />
        <CB checked={data.igLevels} onChange={v => onChange({ igLevels: v })} label="Ig Levels" />
        <CB checked={data.serumViscosity} onChange={v => onChange({ serumViscosity: v })} label="Serum viscosity" />
        <CB checked={data.igSubclasses} onChange={v => onChange({ igSubclasses: v })} label="Ig Subclasses" />
      </div>

      <div className="space-y-1">
        <Label className="text-sm">Other</Label>
        <Input value={data.other} onChange={e => onChange({ other: e.target.value })} placeholder="Specify..." />
      </div>

      <div className="flex flex-wrap gap-4">
        <CB checked={data.fedexPickup} onChange={v => onChange({ fedexPickup: v })} label="Picked up by Fedex" />
        <CB checked={data.droppedOff} onChange={v => onChange({ droppedOff: v })} label="Dropped off" />
        <div className="space-y-1">
          <Label className="text-sm">Time &amp; Date</Label>
          <Input value={data.collectionDateTime} onChange={e => onChange({ collectionDateTime: e.target.value })} className="w-48" />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <CB checked={data.drawnAtLab} onChange={v => onChange({ drawnAtLab: v })} label="Drawn @ lab/MDO" />
        <CB checked={data.drawnFromIV} onChange={v => onChange({ drawnFromIV: v })} label="Drawn from IV line" />
        <CB checked={data.separatePeripheralStick} onChange={v => onChange({ separatePeripheralStick: v })} label="Separate peripheral stick" />
      </div>
    </div>
  );
}
