"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createDefaultOasisData } from "./types";
import type { OasisRecertFormData } from "./types";
import { PatientInfoSection } from "./sections/PatientInfoSection";
import { DiagnosesSection } from "./sections/DiagnosesSection";
import { BodySystemsSection } from "./sections/BodySystemsSection";
import { FunctionalSection } from "./sections/FunctionalSection";
import { CarePlanSection } from "./sections/CarePlanSection";
import { SignaturesSection } from "./sections/SignaturesSection";

type FormStatus = "draft" | "signed" | "completed" | "needs_correction" | "locked";

type Props = {
  visitId: number;
  patientId: number;
  patientName: string;
  patientMRN: string;
  patientDOB: string;
  rnName: string;
  visitDate: string;
  initialData?: OasisRecertFormData;
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

export function OasisRecertNote({
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

  const [formData, setFormData] = useState<OasisRecertFormData>(
    initialData ?? createDefaultOasisData(rnName)
  );
  const [formStatus, setFormStatus] = useState<FormStatus>(initialStatus);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const updateSection = useCallback(
    <K extends keyof OasisRecertFormData>(key: K, patch: Partial<OasisRecertFormData[K]>) => {
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
    const signed: OasisRecertFormData = {
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

  const isLocked = formStatus !== "draft" && formStatus !== "needs_correction";

  return (
    <div className="max-w-5xl mx-auto pb-16">
      {/* Sticky header bar */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-semibold text-sm truncate">{patientName}</span>
          <span className="text-gray-400 text-xs hidden sm:inline">MRN {patientMRN}</span>
          <Badge variant="outline" className={`text-xs ${STATUS_BADGE[formStatus] ?? ""}`}>
            {STATUS_LABEL[formStatus] ?? formStatus}
          </Badge>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {saveError && <span className="text-xs text-red-600">{saveError}</span>}
          {lastSaved && !saveError && (
            <span className="text-xs text-gray-400">Saved {lastSaved.toLocaleTimeString()}</span>
          )}
          {!isLocked && (
            <Button type="button" size="sm" variant="outline" onClick={saveDraft} disabled={saving}>
              {saving ? "Saving…" : "Save Draft"}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="patient-info" className="mt-4 px-4">
        <TabsList className="grid w-full grid-cols-6 text-xs h-auto">
          <TabsTrigger value="patient-info"   className="py-2 text-xs">Patient Info</TabsTrigger>
          <TabsTrigger value="diagnoses"      className="py-2 text-xs">Dx &amp; Safety</TabsTrigger>
          <TabsTrigger value="body-systems"   className="py-2 text-xs">Body Systems</TabsTrigger>
          <TabsTrigger value="functional"     className="py-2 text-xs">Functional</TabsTrigger>
          <TabsTrigger value="care-plan"      className="py-2 text-xs">Care Plan</TabsTrigger>
          <TabsTrigger value="sign"           className="py-2 text-xs">Sign &amp; Submit</TabsTrigger>
        </TabsList>

        {/* Tab 1 — Patient Info */}
        <TabsContent value="patient-info" className="space-y-4 mt-6">
          <PatientInfoSection
            header={formData.header}
            patientTracking={formData.patientTracking}
            clinicalRecord={formData.clinicalRecord}
            patientName={patientName}
            patientMRN={patientMRN}
            patientDOB={patientDOB}
            visitDate={visitDate}
            onHeaderChange={patch => updateSection("header", patch)}
            onTrackingChange={patch => updateSection("patientTracking", patch)}
            onClinicalChange={patch => updateSection("clinicalRecord", patch)}
          />
        </TabsContent>

        {/* Tab 2 — Diagnoses & Safety */}
        <TabsContent value="diagnoses" className="space-y-4 mt-6">
          <DiagnosesSection
            diagnoses={formData.diagnoses}
            immunization={formData.immunization}
            safety={formData.safety}
            onDiagnosesChange={patch => updateSection("diagnoses", patch)}
            onImmunizationChange={patch => updateSection("immunization", patch)}
            onSafetyChange={patch => updateSection("safety", patch)}
          />
        </TabsContent>

        {/* Tab 3 — Body Systems */}
        <TabsContent value="body-systems" className="space-y-4 mt-6">
          <BodySystemsSection
            vitalSigns={formData.vitalSigns}
            neuroCognitive={formData.neuroCognitive}
            respiratory={formData.respiratory}
            cardiovascular={formData.cardiovascular}
            urinary={formData.urinary}
            gastrointestinal={formData.gastrointestinal}
            nutritional={formData.nutritional}
            infusion={formData.infusion}
            onVitalSignsChange={patch => updateSection("vitalSigns", patch)}
            onNeuroChange={patch => updateSection("neuroCognitive", patch)}
            onRespiratoryChange={patch => updateSection("respiratory", patch)}
            onCardiovascularChange={patch => updateSection("cardiovascular", patch)}
            onUrinaryChange={patch => updateSection("urinary", patch)}
            onGIChange={patch => updateSection("gastrointestinal", patch)}
            onNutritionalChange={patch => updateSection("nutritional", patch)}
            onInfusionChange={patch => updateSection("infusion", patch)}
          />
        </TabsContent>

        {/* Tab 4 — Functional */}
        <TabsContent value="functional" className="space-y-4 mt-6">
          <FunctionalSection
            functionalStatus={formData.functionalStatus}
            functionalAbilities={formData.functionalAbilities}
            fallRisk={formData.fallRisk}
            skinIntegumentary={formData.skinIntegumentary}
            onFunctionalStatusChange={patch => updateSection("functionalStatus", patch)}
            onFunctionalAbilitiesChange={patch => updateSection("functionalAbilities", patch)}
            onFallRiskChange={patch => updateSection("fallRisk", patch)}
            onSkinChange={patch => updateSection("skinIntegumentary", patch)}
          />
        </TabsContent>

        {/* Tab 5 — Care Plan */}
        <TabsContent value="care-plan" className="space-y-4 mt-6">
          <CarePlanSection
            medications={formData.medications}
            careManagement={formData.careManagement}
            assessmentSummary={formData.assessmentSummary}
            planOfCare={formData.planOfCare}
            onMedicationsChange={patch => updateSection("medications", patch)}
            onCareManagementChange={patch => updateSection("careManagement", patch)}
            onAssessmentSummaryChange={patch => updateSection("assessmentSummary", patch)}
            onPlanOfCareChange={patch => updateSection("planOfCare", patch)}
          />
        </TabsContent>

        {/* Tab 6 — Sign & Submit */}
        <TabsContent value="sign" className="mt-6">
          <SignaturesSection
            signatures={formData.signatures}
            formStatus={formStatus}
            isAdmin={isAdmin}
            onChange={patch => updateSection("signatures", patch)}
            onSign={handleSign}
            onComplete={isAdmin ? handleComplete : undefined}
            completing={saving && formStatus === "signed"}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
