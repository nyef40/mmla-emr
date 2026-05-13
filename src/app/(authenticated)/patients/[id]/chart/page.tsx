import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { db } from "@/db";
import { patients, visits, mdOrders, irodsAssessments, episodes, patientStaffAssignments } from "@/db/schema";
import { eq, desc, asc, and } from "drizzle-orm";
import Link from "next/link";

import { ChartView } from "./ChartView";
import type { EpisodeRow, MdOrderRow, VisitRow, IrodsRow } from "./ChartView";

export default async function PatientChartPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const patientId = Number(id);

  const patient = await db.query.patients.findFirst({
    where: eq(patients.id, patientId),
  });
  if (!patient) notFound();

  if (session?.user.role === "rn") {
    const assignment = await db.query.patientStaffAssignments.findFirst({
      where: and(
        eq(patientStaffAssignments.patientId, patientId),
        eq(patientStaffAssignments.staffId, parseInt(session!.user.id, 10)),
        eq(patientStaffAssignments.isActive, true)
      ),
    });
    if (!assignment) notFound();
  }

  const [episodesList, visitsList, ordersList, irodsList] = await Promise.all([
    db.query.episodes.findMany({
      where: eq(episodes.patientId, patientId),
      orderBy: asc(episodes.episodeNumber),
    }),
    db.query.visits.findMany({
      where: eq(visits.patientId, patientId),
      orderBy: desc(visits.visitDate),
      with: { clinician: true },
    }),
    db.query.mdOrders.findMany({
      where: eq(mdOrders.patientId, patientId),
      orderBy: desc(mdOrders.createdAt),
      with: { createdBy: true },
    }),
    db.query.irodsAssessments.findMany({
      where: eq(irodsAssessments.patientId, patientId),
      orderBy: desc(irodsAssessments.assessmentDate),
      with: { completedBy: true },
    }),
  ]);

  const isAdmin = session?.user.role === "admin" || session?.user.role === "staff";

  // Serialize episodes
  const serializedEpisodes: EpisodeRow[] = episodesList.map(ep => ({
    id: ep.id,
    episodeNumber: ep.episodeNumber,
    chartNumber: ep.chartNumber ?? null,
    startDate: String(ep.startDate),
    endDate: String(ep.endDate),
    isActive: ep.isActive,
  }));

  // Serialize MD orders — use effectiveDate if available, else createdAt
  const serializedOrders: MdOrderRow[] = ordersList.map(o => ({
    id: o.id,
    date: o.effectiveDate
      ? String(o.effectiveDate)
      : (o.createdAt ? o.createdAt.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)),
    createdBy: o.createdBy?.name ?? "Unknown",
    status: o.status,
    orderType: o.orderType,
  }));

  // Serialize visits
  const serializedVisits: VisitRow[] = visitsList.map(v => ({
    id: v.id,
    date: v.visitDate instanceof Date
      ? v.visitDate.toISOString().slice(0, 10)
      : String(v.visitDate).slice(0, 10),
    visitType: v.visitType,
    clinician: v.clinician?.name ?? "Unknown",
    formStatus: v.formStatus ?? "draft",
  }));

  // Serialize I-RODS assessments
  const serializedIrods: IrodsRow[] = irodsList.map(a => ({
    id: a.id,
    date: String(a.assessmentDate),
    completedBy: a.completedBy?.name ?? "Unknown",
    rawScore: a.rawScore ?? 0,
  }));

  const patientName = `${patient.firstName} ${patient.lastName}`;
  const socDate = patient.socDate ? String(patient.socDate) : null;

  return (
    <div className="space-y-4">
      {/* Breadcrumb + page title */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/patients" className="hover:underline">Patients</Link>
            <span>/</span>
            <Link href={`/patients/${patientId}`} className="hover:underline">{patientName}</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">Patient Chart</span>
          </div>
          <h1 className="text-2xl font-bold">{patientName}</h1>
          <p className="text-sm text-gray-500">MRN: {patient.patientId} · Patient Chart</p>
        </div>
        <Link
          href={`/patients/${patientId}`}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          ← Patient Profile
        </Link>
      </div>

      <ChartView
        patientId={patientId}
        patientMrn={patient.patientId}
        socDate={socDate}
        admissionStatus={patient.admissionStatus ?? "pending"}
        episodes={serializedEpisodes}
        mdOrders={serializedOrders}
        visits={serializedVisits}
        irods={serializedIrods}
        isAdmin={isAdmin}
      />
    </div>
  );
}
