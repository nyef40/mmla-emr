"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { OasisSignatures } from "../types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold uppercase tracking-wide text-gray-600">{label}</Label>
      {children}
    </div>
  );
}

function CB({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded border-gray-300 h-3.5 w-3.5" />
      <span>{label}</span>
    </label>
  );
}

type Props = {
  signatures: OasisSignatures;
  formStatus: string;
  isAdmin: boolean;
  onChange: (u: Partial<OasisSignatures>) => void;
  onSign: () => void;
  onComplete?: () => void;
  completing?: boolean;
};

export function SignaturesSection({ signatures, formStatus, isAdmin, onChange, onSign, onComplete, completing }: Props) {
  const sig = signatures;
  const isLocked = formStatus !== "draft" && formStatus !== "needs_correction";

  return (
    <div className="space-y-6">
      {/* Verbal Order */}
      <div className="border border-gray-200 rounded p-4 space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-wide text-gray-700">Verbal Order</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Verbal Order From (MD)">
            <Input value={sig.verbalOrderFrom} onChange={e => onChange({ verbalOrderFrom: e.target.value })} disabled={isLocked} />
          </Field>
          <Field label="Order Date">
            <Input type="date" value={sig.verbalOrderDate} onChange={e => onChange({ verbalOrderDate: e.target.value })} disabled={isLocked} />
          </Field>
          <Field label="Order Time">
            <Input type="time" value={sig.verbalOrderTime} onChange={e => onChange({ verbalOrderTime: e.target.value })} disabled={isLocked} />
          </Field>
        </div>
        <CB
          checked={sig.supervisoryVisit}
          onChange={v => onChange({ supervisoryVisit: v })}
          label="Supervisory Visit"
        />
        {sig.supervisoryVisit && (
          <Field label="Supervisor Name">
            <Input value={sig.supervisorName} onChange={e => onChange({ supervisorName: e.target.value })} disabled={isLocked} />
          </Field>
        )}
      </div>

      {/* RN Signature */}
      <div className="border border-gray-200 rounded p-4 space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-wide text-gray-700">RN Signature</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="RN Print Name">
            <Input value={sig.rnPrintName} onChange={e => onChange({ rnPrintName: e.target.value })} disabled={isLocked} />
          </Field>
          <Field label="Credential">
            <Input value={sig.rnCredential} onChange={e => onChange({ rnCredential: e.target.value })} placeholder="RN" disabled={isLocked} />
          </Field>
        </div>

        {sig.rnSignedAt ? (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
            <span className="font-semibold">✓ Signed by {sig.rnPrintName}</span>
            <span className="text-gray-500 text-xs">at {new Date(sig.rnSignedAt).toLocaleString()}</span>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded px-4 py-3 text-sm text-gray-400 italic">
            Not yet signed
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 items-center">
        {!isLocked && (
          <Button
            type="button"
            className="bg-[#1e5f8a] hover:bg-[#174f75] text-white"
            onClick={onSign}
          >
            Sign &amp; Submit
          </Button>
        )}

        {isAdmin && formStatus === "signed" && (
          <Button
            type="button"
            variant="outline"
            className="border-green-600 text-green-700 hover:bg-green-50"
            onClick={onComplete}
            disabled={completing}
          >
            {completing ? "Completing…" : "Mark as Completed"}
          </Button>
        )}

        {formStatus === "signed" && (
          <span className="text-sm text-blue-700 font-medium">
            Submitted — awaiting office review
          </span>
        )}
        {formStatus === "completed" && (
          <span className="text-sm text-green-700 font-medium">
            ✓ Assessment completed
          </span>
        )}
      </div>

      {/* Patient acknowledgment */}
      <div className="border border-gray-200 rounded p-4 space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-wide text-gray-700">Patient / Representative Acknowledgment</h4>
        <p className="text-xs text-gray-500">
          The patient or their representative acknowledges participation in this recertification assessment.
        </p>
        {sig.patientSignedAt ? (
          <div className="text-sm text-green-700">
            ✓ Acknowledged at {new Date(sig.patientSignedAt).toLocaleString()}
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded px-4 py-3 text-sm text-gray-300 italic">
            Not yet acknowledged
          </div>
        )}
      </div>
    </div>
  );
}
