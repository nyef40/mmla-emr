"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MedicationData } from "../types";

type Props = { data: MedicationData; onChange: (u: Partial<MedicationData>) => void };

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

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold uppercase tracking-wide text-gray-600">{label}</Label>
      {children}
    </div>
  );
}

export function MedicationSection({ data, onChange }: Props) {
  return (
    <div className="border rounded-md p-4 space-y-5">
      <h3 className="font-bold text-sm uppercase tracking-wide border-b pb-1">Medication to Infuse</h3>

      {/* Medication identification */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <F label="Brand Name">
          <Input value={data.brand} onChange={e => onChange({ brand: e.target.value })} placeholder="e.g. Gamunex c" />
        </F>
        <F label="Today's Dose (g)">
          <Input value={data.todayDose} onChange={e => onChange({ todayDose: e.target.value })} placeholder="e.g. 40g" />
        </F>
        <F label="Volume (ml)">
          <Input value={data.volume} onChange={e => onChange({ volume: e.target.value })} placeholder="e.g. 400ml" />
        </F>
        <F label="Frequency">
          <Input value={data.frequency} onChange={e => onChange({ frequency: e.target.value })} placeholder="e.g. X2DQ3WKS" />
        </F>
        <F label="Lot #">
          <Input value={data.lot} onChange={e => onChange({ lot: e.target.value })} />
        </F>
        <F label="Expiration">
          <Input type="date" value={data.expiration} onChange={e => onChange({ expiration: e.target.value })} />
        </F>
        <F label="Lot # (2nd)">
          <Input value={data.lot2} onChange={e => onChange({ lot2: e.target.value })} />
        </F>
        <F label="Expiration (2nd)">
          <Input type="date" value={data.expiration2} onChange={e => onChange({ expiration2: e.target.value })} />
        </F>
      </div>

      {/* Hydration */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <Label className="text-sm font-semibold">Hydration:</Label>
          <RG value={data.hydration} onChange={v => onChange({ hydration: v })} options={["Yes", "No"]} />
        </div>
        {data.hydration === "Yes" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pl-4">
            <F label="Type"><RG value={data.hydrationType} onChange={v => onChange({ hydrationType: v })} options={["NS", "D5W", "Other"]} /></F>
            <F label="Hang Time"><Input value={data.hangTime} onChange={e => onChange({ hangTime: e.target.value })} /></F>
            <F label="Amount"><Input value={data.hydrationAmount} onChange={e => onChange({ hydrationAmount: e.target.value })} /></F>
            <F label="Timing"><RG value={data.hydrationTiming} onChange={v => onChange({ hydrationTiming: v })} options={["Prior to", "Post", "Both"]} /></F>
          </div>
        )}
      </div>

      {/* Equipment */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Equipment</Label>
        <div className="flex flex-wrap gap-3">
          <CB checked={data.equipmentPump} onChange={v => onChange({ equipmentPump: v })} label="Pump" />
          <CB checked={data.equipmentGravity} onChange={v => onChange({ equipmentGravity: v })} label="Gravity Dial Flow" />
          <CB checked={data.equipmentRollerClamp} onChange={v => onChange({ equipmentRollerClamp: v })} label="Roller Clamp" />
          <div className="flex items-center gap-1">
            <span className="text-sm">Other:</span>
            <Input className="w-32 h-7" value={data.equipmentOther} onChange={e => onChange({ equipmentOther: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Pump settings */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-1">
            <Label className="text-sm font-semibold">Pump Name:</Label>
            <Input className="w-32 h-7" value={data.pumpName} onChange={e => onChange({ pumpName: e.target.value })} />
          </div>
          <CB checked={data.pumpRamp} onChange={v => onChange({ pumpRamp: v })} label="Ramp" />
          <CB checked={data.pumpTaper} onChange={v => onChange({ pumpTaper: v })} label="Taper" />
          <CB checked={data.pumpBolus} onChange={v => onChange({ pumpBolus: v })} label="Bolus" />
          <CB checked={data.pumpContinuous} onChange={v => onChange({ pumpContinuous: v })} label="Continuous" />
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-1"><span className="text-sm"># Titration ramps per pharmacy label:</span><Input className="w-14 h-7" value={data.titrationRamps} onChange={e => onChange({ titrationRamps: e.target.value })} /></div>
          <div className="flex items-center gap-1"><span className="text-sm">Max rate per label:</span><Input className="w-20 h-7" value={data.maxRate} onChange={e => onChange({ maxRate: e.target.value })} /><span className="text-sm">ml/hour</span></div>
          <div className="flex items-center gap-2"><span className="text-sm">Label rate followed?</span><RG value={data.labelRateFollowed} onChange={v => onChange({ labelRateFollowed: v })} options={["Y", "N"]} /></div>
        </div>
      </div>

      {/* Pharmacy / anaphylaxis */}
      <div className="flex flex-wrap gap-6 items-start">
        <div className="flex items-center gap-2">
          <CB checked={data.pharmacyNotified} onChange={v => onChange({ pharmacyNotified: v })} label="Pharmacy notified" />
          {data.pharmacyNotified && (
            <div className="flex items-center gap-1"><span className="text-sm">Name:</span><Input className="w-40 h-7" value={data.pharmacyNotifiedName} onChange={e => onChange({ pharmacyNotifiedName: e.target.value })} /></div>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2"><span className="text-sm font-semibold">Anaphylaxis Kit:</span><RG value={data.anaphylaxisKit} onChange={v => onChange({ anaphylaxisKit: v })} options={["Yes", "No"]} /></div>
          {data.anaphylaxisKit === "Yes" && (
            <div className="flex items-center gap-1"><span className="text-sm">Expiration:</span><Input type="date" className="w-40 h-7" value={data.anaphylaxisExpiration} onChange={e => onChange({ anaphylaxisExpiration: e.target.value })} /></div>
          )}
        </div>
      </div>

      {/* Premeds */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Premeds</Label>
        <div className="flex flex-wrap gap-4">
          <CB checked={data.premedNA} onChange={v => onChange({ premedNA: v })} label="N/A" />
          <div className="flex items-center gap-1">
            <CB checked={data.premedAcetaminophen} onChange={v => onChange({ premedAcetaminophen: v })} label="Acetaminophen" />
            {data.premedAcetaminophen && <><span className="text-sm">dose</span><Input className="w-24 h-7" value={data.premedAcetaminophenDose} onChange={e => onChange({ premedAcetaminophenDose: e.target.value })} placeholder="650mg po" /></>}
          </div>
          <div className="flex items-center gap-1">
            <CB checked={data.premedDiphenhydramine} onChange={v => onChange({ premedDiphenhydramine: v })} label="Diphenhydramine" />
            {data.premedDiphenhydramine && <><span className="text-sm">dose</span><Input className="w-24 h-7" value={data.premedDiphenhydramineDose} onChange={e => onChange({ premedDiphenhydramineDose: e.target.value })} placeholder="25mg po" /></>}
          </div>
          <div className="flex items-center gap-1">
            <CB checked={data.premedIbuprofen} onChange={v => onChange({ premedIbuprofen: v })} label="Ibuprofen" />
            {data.premedIbuprofen && <><span className="text-sm">dose</span><Input className="w-24 h-7" value={data.premedIbuprofenDose} onChange={e => onChange({ premedIbuprofenDose: e.target.value })} /></>}
          </div>
          <div className="flex items-center gap-1">
            <CB checked={data.premedAspirin} onChange={v => onChange({ premedAspirin: v })} label="Aspirin" />
            {data.premedAspirin && <><span className="text-sm">dose</span><Input className="w-24 h-7" value={data.premedAspirinDose} onChange={e => onChange({ premedAspirinDose: e.target.value })} /></>}
          </div>
          <div className="flex items-center gap-1">
            <CB checked={data.lidocaineCream} onChange={v => onChange({ lidocaineCream: v })} label="Lidocaine Cream" />
            {data.lidocaineCream && <><span className="text-sm">Time applied:</span><Input className="w-28 h-7" value={data.lidocaineTimeApplied} onChange={e => onChange({ lidocaineTimeApplied: e.target.value })} /></>}
          </div>
        </div>
      </div>

      {/* Antiemetic / Steroids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 border rounded p-3">
          <Label className="text-sm font-semibold">Antiemetic</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><Label className="text-xs">Dose</Label><Input value={data.antiemeticDose} onChange={e => onChange({ antiemeticDose: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Route</Label><Input value={data.antiemeticRoute} onChange={e => onChange({ antiemeticRoute: e.target.value })} placeholder="PO IVP" /></div>
            <div className="space-y-1"><Label className="text-xs">Start time</Label><Input type="time" value={data.antiemeticStart} onChange={e => onChange({ antiemeticStart: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Stop time</Label><Input type="time" value={data.antiemeticStop} onChange={e => onChange({ antiemeticStop: e.target.value })} /></div>
          </div>
        </div>
        <div className="space-y-2 border rounded p-3">
          <Label className="text-sm font-semibold">Steroids</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><Label className="text-xs">Dose</Label><Input value={data.steroidsDose} onChange={e => onChange({ steroidsDose: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Route</Label><Input value={data.steroidsRoute} onChange={e => onChange({ steroidsRoute: e.target.value })} placeholder="PO IVP" /></div>
            <div className="space-y-1"><Label className="text-xs">Start time</Label><Input type="time" value={data.steroidsStart} onChange={e => onChange({ steroidsStart: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Stop time</Label><Input type="time" value={data.steroidsStop} onChange={e => onChange({ steroidsStop: e.target.value })} /></div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm font-semibold">IV Dilution Amount:</Label>
        <Input className="w-40" value={data.ivDilutionAmount} onChange={e => onChange({ ivDilutionAmount: e.target.value })} />
      </div>
    </div>
  );
}
