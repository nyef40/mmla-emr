"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createDefaultFormData } from "./types";
import type { SnInfusionFormData, InfusionRow } from "./types";
import { HeaderSection } from "./sections/HeaderSection";
import { TolerationsSection } from "./sections/TolerationsSection";
import { BodySystemsSection } from "./sections/BodySystemsSection";
import { AccessSection } from "./sections/AccessSection";
import { LabsSection } from "./sections/LabsSection";
import { MedicationSection } from "./sections/MedicationSection";
import { InfusionRecordSection } from "./sections/InfusionRecordSection";
import { PostInfusionSection } from "./sections/PostInfusionSection";

type FormStatus = "draft" | "signed" | "completed" | "needs_correction" | "locked";

type Props = {
  visitId: number;
  patientId: number;
  patientName: string;
  patientMRN: string;
  patientDOB: string;
  rnName: string;
  visitDate: string;
  initialData?: SnInfusionFormData;
  initialStatus?: FormStatus;
};

const STATUS_BADGE: Record<string, string> = {
  draft:            "bg-yellow-100 text-yellow-800 border-yellow-200",
  signed:           "bg-blue-100 text-blue-800 border-blue-200",
  completed:        "bg-green-100 text-green-800 border-green-200",
  needs_correction: "bg-orange-100 text-orange-800 border-orange-200",
  locked:           "bg-gray-100 text-gray-700 border-gray-300",
};

const STATUS_LABEL: Record<string, string> = {
  draft:            "Pending",
  signed:           "Sent to Office",
  completed:        "Completed",
  needs_correction: "Needs Correction",
  locked:           "Locked",
};

export function SnInfusionVisitNote({
  visitId,
  patientId,
  patientName,
  patientMRN,
  patientDOB,
  rnName,
  visitDate,
  initialData,
  initialStatus = "draft",
}: Props) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "staff";

  const [formData, setFormData] = useState<SnInfusionFormData>(
    initialData ?? createDefaultFormData(patientName, rnName)
  );
  const [formStatus, setFormStatus] = useState<FormStatus>(initialStatus);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const updateSection = useCallback(
    <K extends keyof SnInfusionFormData>(key: K, patch: Partial<SnInfusionFormData[K]>) => {
      setFormData(prev => ({
        ...prev,
        [key]: typeof prev[key] === "object" && !Array.isArray(prev[key])
          ? { ...(prev[key] as object), ...(patch as object) }
          : patch,
      }));
    },
    []
  );

  async function saveDraft() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/patients/${patientId}/visits/${visitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, formStatus: "draft" }),
      });
      if (!res.ok) throw new Error(await res.text());
      setLastSaved(new Date());
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSign() {
    const now = new Date().toISOString();
    const signed: SnInfusionFormData = {
      ...formData,
      signatures: {
        ...formData.signatures,
        patientSignedAt: now,
        rnSignedAt: now,
      },
    };
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/patients/${patientId}/visits/${visitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: signed, formStatus: "signed" }),
      });
      if (!res.ok) throw new Error(await res.text());
      setFormData(signed);
      setFormStatus("signed");
      setLastSaved(new Date());
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Sign failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/patients/${patientId}/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formStatus: "completed" }),
      });
      if (!res.ok) throw new Error(await res.text());
      setFormStatus("completed");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to mark complete");
    } finally {
      setSaving(false);
    }
  }

  // RN can edit in draft or needs_correction; all other states are read-only
  const isLocked = formStatus !== "draft" && formStatus !== "needs_correction";

  return (
    <div className="max-w-5xl mx-auto pb-16">
      {/* Sticky header bar */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-semibold text-sm truncate">{patientName}</span>
          <span className="text-gray-400 text-xs hidden sm:inline">MRN {patientMRN}</span>
          <Badge
            variant="outline"
            className={`text-xs ${STATUS_BADGE[formStatus] ?? ""}`}
          >
            {STATUS_LABEL[formStatus] ?? formStatus}
          </Badge>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {saveError && <span className="text-xs text-red-600">{saveError}</span>}
          {lastSaved && !saveError && (
            <span className="text-xs text-gray-400">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {!isLocked && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={saveDraft}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Draft"}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="patient-info" className="mt-4 px-4">
        <TabsList className="grid w-full grid-cols-5 text-xs h-auto">
          <TabsTrigger value="patient-info" className="py-2 text-xs">Patient Info</TabsTrigger>
          <TabsTrigger value="body-systems" className="py-2 text-xs">Body Systems</TabsTrigger>
          <TabsTrigger value="infusion-setup" className="py-2 text-xs">Infusion Setup</TabsTrigger>
          <TabsTrigger value="infusion-record" className="py-2 text-xs">Infusion Record</TabsTrigger>
          <TabsTrigger value="post-infusion" className="py-2 text-xs">Post-Infusion &amp; Sign</TabsTrigger>
        </TabsList>

        {/* Tab 1 — Patient Info */}
        <TabsContent value="patient-info" className="space-y-6 mt-6">
          <HeaderSection
            data={formData.header}
            patientName={patientName}
            patientMRN={patientMRN}
            patientDOB={patientDOB}
            rnName={rnName}
            visitDate={visitDate}
            onChange={patch => updateSection("header", patch)}
          />
          <TolerationsSection
            data={formData.tolerationOfInfusion}
            onChange={patch => updateSection("tolerationOfInfusion", patch)}
          />
        </TabsContent>

        {/* Tab 2 — Body Systems */}
        <TabsContent value="body-systems" className="mt-6">
          <BodySystemsSection
            data={formData.bodySystemsAssessment}
            onChange={patch => updateSection("bodySystemsAssessment", patch)}
          />
        </TabsContent>

        {/* Tab 3 — Infusion Setup */}
        <TabsContent value="infusion-setup" className="space-y-6 mt-6">
          <AccessSection
            data={formData.access}
            onChange={patch => updateSection("access", patch)}
          />
          <LabsSection
            data={formData.labs}
            onChange={patch => updateSection("labs", patch)}
          />
          <MedicationSection
            data={formData.medication}
            onChange={patch => updateSection("medication", patch)}
          />
        </TabsContent>

        {/* Tab 4 — Infusion Record */}
        <TabsContent value="infusion-record" className="mt-6">
          <InfusionRecordSection
            rows={formData.infusionRecord}
            onChange={(rows: InfusionRow[]) =>
              setFormData(prev => ({ ...prev, infusionRecord: rows }))
            }
          />
        </TabsContent>

        {/* Tab 5 — Post-Infusion & Sign */}
        <TabsContent value="post-infusion" className="mt-6">
          <PostInfusionSection
            postInfusion={formData.postInfusion}
            signatures={formData.signatures}
            formStatus={formStatus}
            onPostInfusionChange={patch => updateSection("postInfusion", patch)}
            onSignaturesChange={patch => updateSection("signatures", patch)}
            onSign={handleSign}
            onComplete={isAdmin ? handleComplete : undefined}
            completing={saving && formStatus === "signed"}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
