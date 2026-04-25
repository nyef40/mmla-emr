import { db } from "@/db";
import { patients, visits } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default async function PatientPage({ params }: { params: { id: string } }) {
  const patientId = Number(params.id);

  // 🔹 fetch patient
  const patient = await db.query.patients.findFirst({
    where: eq(patients.id, patientId),
  });

  if (!patient) {
    return <div>Patient not found</div>;
  }

  const visitsList = await db.query.visits.findMany({
    where: eq(visits.patientId, patientId),
    orderBy: desc(visits.visitDate),
    with: {
      clinician: true,
    },
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        {patient.firstName} {patient.lastName}
      </h1>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visits">Visits</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="p-4 space-y-2">
            <p><strong>Patient ID:</strong> {patient.patientId}</p>
            <p><strong>Date of Birth:</strong> {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
            <p><strong>Gender:</strong> {patient.gender}</p>
            {patient.phone && <p><strong>Phone:</strong> {patient.phone}</p>}
            {patient.email && <p><strong>Email:</strong> {patient.email}</p>}
            {patient.address && <p><strong>Address:</strong> {patient.address}</p>}
          </Card>
        </TabsContent>

        <TabsContent value="visits">
          <Card className="p-4">
            {visitsList.length === 0 ? (
              <p>No visits found.</p>
            ) : (
              <div className="space-y-3">
                {visitsList.map((visit) => (
                  <div key={visit.id} className="border rounded-md p-3">
                    <p><strong>ID:</strong> {visit.id}</p>
                    <p><strong>Type:</strong> {visit.visitType}</p>
                    <p><strong>Status:</strong> {visit.status}</p>
                    <p><strong>Date:</strong> {new Date(visit.visitDate).toLocaleString()}</p>
                    {visit.clinician?.name && <p><strong>Clinician:</strong> {visit.clinician.name}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}