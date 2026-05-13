import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { db } from "@/db";
import { patients, visits } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { SnInfusionVisitNote } from "@/components/forms/SnInfusionVisitNote";
import type { SnInfusionFormData } from "@/components/forms/SnInfusionVisitNote/types";
import { OasisRecertNote } from "@/components/forms/OasisRecertNote";
import type { OasisRecertFormData } from "@/components/forms/OasisRecertNote/types";
import Link from "next/link";

// Use local date parts so UTC offset doesn't shift the displayed calendar date
function localDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export default async function VisitPage({
  params,
}: {
  params: Promise<{ id: string; visitId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id, visitId: visitIdStr } = await params;
  const patientId = parseInt(id, 10);
  const visitId = parseInt(visitIdStr, 10);

  const patient = await db.query.patients.findFirst({ where: eq(patients.id, patientId) });
  if (!patient) notFound();

  const visit = await db.query.visits.findFirst({
    where: and(eq(visits.id, visitId), eq(visits.patientId, patientId)),
    with: { clinician: true },
  });
  if (!visit) notFound();

  const patientName = `${patient.firstName} ${patient.lastName}`;
  const rnName = visit.clinician?.name ?? session.user.name ?? "";
  const visitDate = localDateStr(visit.visitDate);
  const patientDOB = localDateStr(patient.dateOfBirth);

  return (
    <div>
      <div className="px-4 pt-4 pb-2 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/patients" className="hover:underline">Patients</Link>
        <span>/</span>
        <Link href={`/patients/${patientId}`} className="hover:underline">{patientName}</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Visit #{visitId}</span>
      </div>

      {visit.visitType === "SN Recert Visit" ? (
        <OasisRecertNote
          visitId={visitId}
          patientId={patientId}
          patientName={patientName}
          patientMRN={patient.patientId}
          patientDOB={patientDOB}
          rnName={rnName}
          visitDate={visitDate}
          initialData={visit.formData as OasisRecertFormData | undefined}
          initialStatus={(visit.formStatus ?? "draft") as "draft" | "signed" | "completed" | "needs_correction" | "locked"}
        />
      ) : (
        <SnInfusionVisitNote
          visitId={visitId}
          patientId={patientId}
          patientName={patientName}
          patientMRN={patient.patientId}
          patientDOB={patientDOB}
          rnName={rnName}
          visitDate={visitDate}
          initialData={visit.formData as SnInfusionFormData | undefined}
          initialStatus={(visit.formStatus ?? "draft") as "draft" | "signed" | "completed" | "needs_correction" | "locked"}
        />
      )}
    </div>
  );
}
