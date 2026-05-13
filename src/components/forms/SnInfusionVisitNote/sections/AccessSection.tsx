"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AccessData } from "../types";

type Props = { data: AccessData; onChange: (u: Partial<AccessData>) => void };

function CB({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded border-gray-300 h-3.5 w-3.5" />
      <span>{label}</span>
    </label>
  );
}

function RG({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map(o => (
        <label key={o} className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="radio" checked={value === o} onChange={() => onChange(o)} className="h-3.5 w-3.5" />
          <span>{o}</span>
        </label>
      ))}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold uppercase tracking-wide text-gray-600">{label}</Label>
      <div className="flex flex-wrap gap-3">{children}</div>
    </div>
  );
}

export function AccessSection({ data, onChange }: Props) {
  return (
    <div className="border rounded-md p-4 space-y-4">
      <h3 className="font-bold text-sm uppercase tracking-wide border-b pb-1">Access</h3>

      <Row label="Type">
        <CB checked={data.typePort} onChange={v => onChange({ typePort: v })} label="Port" />
        <CB checked={data.typePeripheralIV} onChange={v => onChange({ typePeripheralIV: v })} label="Peripheral IV" />
        <CB checked={data.typePICC} onChange={v => onChange({ typePICC: v })} label="PICC" />
        {data.typePICC && (
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1"><span className="text-sm">Arm Circ</span><Input className="w-20 h-7 text-sm" value={data.piccArmCirc} onChange={e => onChange({ piccArmCirc: e.target.value })} /><span className="text-sm">cm</span></div>
            <div className="flex items-center gap-1"><span className="text-sm">Length</span><Input className="w-20 h-7 text-sm" value={data.piccLength} onChange={e => onChange({ piccLength: e.target.value })} /><span className="text-sm">cm</span></div>
            <div className="flex items-center gap-1"><span className="text-sm"># Lumens</span><Input className="w-16 h-7 text-sm" value={data.piccLumens} onChange={e => onChange({ piccLumens: e.target.value })} /></div>
          </div>
        )}
        <div className="flex items-center gap-1"><span className="text-sm">VAD Flush:</span><Input className="w-16 h-7 text-sm" value={data.vadFlush} onChange={e => onChange({ vadFlush: e.target.value })} /><span className="text-sm">ml</span></div>
      </Row>

      <Row label="NS Flush">
        <CB checked={data.nsPreInfusion} onChange={v => onChange({ nsPreInfusion: v })} label="Pre infusion" />
        <CB checked={data.postLabDraw} onChange={v => onChange({ postLabDraw: v })} label="Post lab draw" />
        <CB checked={data.postInfusion} onChange={v => onChange({ postInfusion: v })} label="Post Infusion" />
        {data.postInfusion && (
          <div className="flex items-center gap-1">
            <Input className="w-14 h-7 text-sm" value={data.postInfusionMl} onChange={e => onChange({ postInfusionMl: e.target.value })} /><span className="text-sm">ml</span>
            <Input className="w-14 h-7 text-sm" value={data.postInfusionPercent} onChange={e => onChange({ postInfusionPercent: e.target.value })} /><span className="text-sm">%</span>
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-sm">Heparin post infusion per VAD protocol</Label>
          <RG value={data.heparinPostVAD} onChange={v => onChange({ heparinPostVAD: v })} options={["Yes", "No"]} />
        </div>
      </Row>

      <Row label="Location of Access">
        {(["locationL", "locationR", "locationH", "locationW", "locationFA", "locationAC", "locationUA", "locationChest", "locationABD", "locationThigh", "locationBack"] as const).map(k => (
          <CB key={k} checked={data[k]} onChange={v => onChange({ [k]: v })} label={k.replace("location", "")} />
        ))}
      </Row>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label className="text-sm">Date Accessed</Label>
          <Input type="date" value={data.dateAccessed} onChange={e => onChange({ dateAccessed: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Date De-accessed</Label>
          <Input type="date" value={data.dateDeaccessed} onChange={e => onChange({ dateDeaccessed: e.target.value })} />
        </div>
      </div>

      <Row label="Dressing">
        <CB checked={data.dressingTransparent} onChange={v => onChange({ dressingTransparent: v })} label="Transparent" />
        <CB checked={data.dressingGauze} onChange={v => onChange({ dressingGauze: v })} label="Gauze" />
        <CB checked={data.dressingMedImpregnated} onChange={v => onChange({ dressingMedImpregnated: v })} label="Med impregnated" />
      </Row>

      <Row label="Needle Type">
        <CB checked={data.needleTypeAngiocath} onChange={v => onChange({ needleTypeAngiocath: v })} label="Angiocath" />
        <CB checked={data.needleTypeSubcutaneous} onChange={v => onChange({ needleTypeSubcutaneous: v })} label="Subcutaneous" />
        <CB checked={data.needleTypeHuber} onChange={v => onChange({ needleTypeHuber: v })} label="Huber" />
        <div className="space-y-1">
          <Label className="text-sm">Sterile access*</Label>
          <RG value={data.sterileAccess} onChange={v => onChange({ sterileAccess: v })} options={["Yes", "No"]} />
          <p className="text-xs text-gray-500">*All sterile access performed with Chlorhexidine HCL</p>
        </div>
      </Row>

      <Row label="Needle Length">
        {(["needleLength4mm", "needleLength6mm", "needleLength9mm", "needleLength12mm", "needleLength14mm", "needleLengthThreeQuarter", "needleLengthOneInch"] as const).map((k, i) => (
          <CB key={k} checked={data[k]} onChange={v => onChange({ [k]: v })} label={["4mm","6mm","9mm","12mm","14mm","3/4 inch","1 inch"][i]} />
        ))}
      </Row>

      <Row label="Needle Gauge">
        {(["gauge27","gauge25","gauge24","gauge23","gauge22","gauge20"] as const).map((k, i) => (
          <CB key={k} checked={data[k]} onChange={v => onChange({ [k]: v })} label={["27","25","24","23","22","20"][i]} />
        ))}
      </Row>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label className="text-sm">IV: Number of Attempts</Label>
          <Input value={data.attempts} onChange={e => onChange({ attempts: e.target.value })} placeholder="1" />
          <p className="text-xs text-gray-500">≥ 3 attempts: notify pharmacy</p>
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Date and Time</Label>
          <Input value={data.attemptDateTime} onChange={e => onChange({ attemptDateTime: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Name/Title of Pharm staff</Label>
          <Input value={data.pharmStaffName} onChange={e => onChange({ pharmStaffName: e.target.value })} />
        </div>
      </div>

      <Row label="Stabilizing Device">
        <CB checked={data.stablingStatlock} onChange={v => onChange({ stablingStatlock: v })} label="Statlock" />
        <CB checked={data.stablingCoban} onChange={v => onChange({ stablingCoban: v })} label="Coban" />
        <CB checked={data.stablingGauzeNetting} onChange={v => onChange({ stablingGauzeNetting: v })} label="Gauze netting" />
        <CB checked={data.stablingSterilePatch} onChange={v => onChange({ stablingSterilePatch: v })} label="Sterile patch" />
        <CB checked={data.stablingOther} onChange={v => onChange({ stablingOther: v })} label="Other" />
      </Row>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-sm">Subcutaneous: Number of Sites</Label>
          <div className="flex gap-2">
            {["1","2","3","4","5","6"].map(n => (
              <label key={n} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" checked={data.subcutaneousSites === n} onChange={() => onChange({ subcutaneousSites: n })} className="h-3.5 w-3.5" />
                {n}
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Subcutaneous Education Completed</Label>
          <RG value={data.subcutaneousEducation} onChange={v => onChange({ subcutaneousEducation: v })} options={["Yes", "No"]} />
        </div>
      </div>
    </div>
  );
}
