import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { db } from "@/db";
import { patients, patientStaffAssignments, visits } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PatientSummary } from "@/components/patients/PatientSummary";
import { AssignStaffPanel } from "@/components/patients/AssignStaffPanel";
import { VisitsTable } from "@/components/visits/VisitsTable";
import { PatientBillingLog } from "@/components/patients/PatientBillingLog";
import { CertifyTab } from "@/components/patients/CertifyTab";

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
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
        eq(patientStaffAssignments.staffId, parseInt(session.user.id, 10)),
        eq(patientStaffAssignments.isActive, true)
      ),
    });
    if (!assignment) notFound();
  }

  const patientVisits = await db.query.visits.findMany({
    where: eq(visits.patientId, patientId),
    orderBy: desc(visits.visitDate),
    limit: 50,
    with: {
      clinician: { columns: { name: true } },
    },
  });

  const canEditStaff = session?.user.role === "admin" || session?.user.role === "staff";

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{patient.firstName} {patient.lastName}</h1>
          <p className="text-sm text-gray-500">MRN: {patient.patientId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/patients/${patientId}/edit`}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Edit
          </Link>
          <Link
            href={`/patients/${patientId}/chart`}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-[#1e5f8a] text-white hover:bg-[#174f75] transition-colors"
          >
            Patient Chart →
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visits">
            Visits
            {patientVisits.length > 0 && (
              <span className="ml-1.5 text-xs bg-white/30 rounded-full px-1.5 py-0.5 tabular-nums">
                {patientVisits.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          {(session?.user.role === "admin" || session?.user.role === "staff") && (
            <TabsTrigger value="certify">Certify</TabsTrigger>
          )}
          {(session?.user.role === "admin" || session?.user.role === "staff") && (
            <TabsTrigger value="billing-log">Billing Log</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <PatientSummary patient={patient} />
        </TabsContent>

        <TabsContent value="visits" className="mt-4">
          <div className="border rounded-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Visit History</h3>
              <Link
                href={`/patients/${patientId}/visits/new`}
                className="text-xs px-2.5 py-1.5 rounded-md bg-[#1e5f8a] text-white hover:bg-[#174f75]"
              >
                + New Visit
              </Link>
            </div>
            <VisitsTable visits={patientVisits} patientId={patientId} userRole={session?.user.role} />
          </div>
        </TabsContent>

        <TabsContent value="staff" className="mt-4">
          <div className="border rounded-md p-4">
            <AssignStaffPanel patientId={patientId} canEdit={canEditStaff} />
          </div>
        </TabsContent>

        {(session?.user.role === "admin" || session?.user.role === "staff") && (
          <TabsContent value="certify" className="mt-4">
            <CertifyTab patientId={patientId} canEdit={canEditStaff} />
          </TabsContent>
        )}

        {(session?.user.role === "admin" || session?.user.role === "staff") && (
          <TabsContent value="billing-log" className="mt-4">
            <div className="border rounded-md p-4">
              <PatientBillingLog patientId={patientId} canEdit={canEditStaff} />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
