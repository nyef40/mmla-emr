"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PostInfusionData, SignaturesData } from "../types";

type FormStatus = "draft" | "signed" | "completed" | "needs_correction" | "locked";

type Props = {
  postInfusion: PostInfusionData;
  signatures: SignaturesData;
  formStatus: FormStatus;
  onPostInfusionChange: (u: Partial<PostInfusionData>) => void;
  onSignaturesChange: (u: Partial<SignaturesData>) => void;
  onSign: () => void;
  onComplete?: () => void;
  completing?: boolean;
};

function CB({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded border-gray-300 h-3.5 w-3.5" />
      <span>{label}</span>
    </label>
  );
}

const STATUS_BANNER: Record<string, { cls: string; text: string }> = {
  signed:           { cls: "bg-blue-50 border-blue-200 text-blue-800",    text: "This note has been signed and sent to office. Awaiting review." },
  completed:        { cls: "bg-green-50 border-green-200 text-green-800",  text: "This note has been reviewed and marked Completed." },
  needs_correction: { cls: "bg-orange-50 border-orange-200 text-orange-800", text: "Office returned this note for correction. Please revise and re-sign." },
  locked:           { cls: "bg-gray-100 border-gray-300 text-gray-700",   text: "This form is locked." },
};

export function PostInfusionSection({ postInfusion: p, signatures: s, formStatus, onPostInfusionChange, onSignaturesChange, onSign, onComplete, completing }: Props) {
  const isEditable = formStatus === "draft" || formStatus === "needs_correction";
  const banner = STATUS_BANNER[formStatus];

  return (
    <div className="space-y-6">
      {/* Post-infusion interventions */}
      <div className="border rounded-md p-4 space-y-4">
        <h3 className="font-bold text-sm uppercase tracking-wide border-b pb-1">Post-Infusion Interventions</h3>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Interventions</Label>
          <div className="flex flex-wrap gap-4">
            <CB checked={p.voidPostInfusion} onChange={v => onPostInfusionChange({ voidPostInfusion: v })} label="Void post infusion" />
            <CB checked={p.vadDiscontinued} onChange={v => onPostInfusionChange({ vadDiscontinued: v })} label="VAD discontinued / de-accessed" />
            <CB checked={p.interventionNA} onChange={v => onPostInfusionChange({ interventionNA: v })} label="N/A" />
            <CB checked={p.vadSecured} onChange={v => onPostInfusionChange({ vadSecured: v })} label="VAD Secured" />
            <CB checked={p.capChange} onChange={v => onPostInfusionChange({ capChange: v })} label="Cap Change" />
            <CB checked={p.dressingChange} onChange={v => onPostInfusionChange({ dressingChange: v })} label="Dressing change" />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Site Appearance</Label>
          <div className="flex flex-wrap gap-4">
            <CB checked={p.noPhlebitis} onChange={v => onPostInfusionChange({ noPhlebitis: v })} label="No clinical signs of phlebitis" />
            <CB checked={p.pain} onChange={v => onPostInfusionChange({ pain: v })} label="Pain" />
            <CB checked={p.redness} onChange={v => onPostInfusionChange({ redness: v })} label="Redness" />
            <CB checked={p.warmth} onChange={v => onPostInfusionChange({ warmth: v })} label="Warmth" />
            <CB checked={p.edema} onChange={v => onPostInfusionChange({ edema: v })} label="Edema" />
            <CB checked={p.drainage} onChange={v => onPostInfusionChange({ drainage: v })} label="Drainage" />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <CB checked={p.mdPharmacyNotified} onChange={v => onPostInfusionChange({ mdPharmacyNotified: v })} label="MD/Pharmacy notified (include name) about:" />
          {p.mdPharmacyNotified && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input className="w-48" value={p.mdPharmacyNotifiedName} onChange={e => onPostInfusionChange({ mdPharmacyNotifiedName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input type="date" className="w-40" value={p.mdPharmacyNotifiedDate} onChange={e => onPostInfusionChange({ mdPharmacyNotifiedDate: e.target.value })} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Signatures */}
      <div className="border rounded-md p-4 space-y-6">
        <h3 className="font-bold text-sm uppercase tracking-wide border-b pb-1">Signatures</h3>

        {banner && (
          <div className={`rounded-md border px-4 py-2 text-sm font-medium ${banner.cls}`}>
            {banner.text}
          </div>
        )}

        {formStatus === "signed" && onComplete && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-3">
              Review complete? Mark this note as <strong>Completed</strong> to close it out.
            </p>
            <Button
              type="button"
              onClick={onComplete}
              disabled={completing}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              {completing ? "Saving…" : "Mark as Completed"}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient signature */}
          <div className="border rounded p-4 space-y-3">
            <Label className="text-sm font-semibold">Patient Signature</Label>
            <div className="space-y-1">
              <Label className="text-xs">Print Name</Label>
              <Input
                value={s.patientPrintName}
                onChange={e => onSignaturesChange({ patientPrintName: e.target.value })}
                disabled={!isEditable}
              />
            </div>
            {s.patientSignedAt ? (
              <p className="text-sm text-gray-600">Signed on {new Date(s.patientSignedAt).toLocaleString()}</p>
            ) : (
              <p className="text-xs text-gray-400">Not yet signed</p>
            )}
          </div>

          {/* RN signature */}
          <div className="border rounded p-4 space-y-3">
            <Label className="text-sm font-semibold">RN Signature</Label>
            <div className="space-y-1">
              <Label className="text-xs">Print Name</Label>
              <Input
                value={s.rnPrintName}
                onChange={e => onSignaturesChange({ rnPrintName: e.target.value })}
                disabled={!isEditable}
              />
            </div>
            {s.rnSignedAt ? (
              <p className="text-sm text-gray-600">Signed on {new Date(s.rnSignedAt).toLocaleString()}</p>
            ) : (
              <p className="text-xs text-gray-400">Not yet signed</p>
            )}
          </div>
        </div>

        {isEditable && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-3">
              By clicking &ldquo;Sign &amp; Send to Office&rdquo;, both the patient and RN confirm the information is accurate.
              The note will be submitted for office review.
            </p>
            <Button
              type="button"
              onClick={onSign}
              disabled={!s.patientPrintName || !s.rnPrintName}
              className="bg-[#1e5f8a] hover:bg-[#174f75] text-white"
            >
              Sign &amp; Send to Office
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
