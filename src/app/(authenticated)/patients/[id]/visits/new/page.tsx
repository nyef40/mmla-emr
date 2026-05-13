import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { db } from "@/db";
import { patients, visits } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function NewVisitPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const patientId = parseInt(id, 10);
  const patient = await db.query.patients.findFirst({ where: eq(patients.id, patientId) });
  if (!patient) return <div className="p-6">Patient not found.</div>;

  // Create the draft visit row now so we have a visitId before rendering the form
  // Store as UTC noon of today so the date is stable across all timezones
  const now = new Date();
  const utcNoon = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0));
  const [visit] = await db
    .insert(visits)
    .values({
      patientId,
      clinicianId: parseInt(session.user.id, 10),
      visitDate: utcNoon,
      visitType: "SKILLED NURSE INFUSION VISIT NOTE",
      status: "in_progress",
      formData: null,
      formStatus: "draft",
    })
    .returning();

  redirect(`/patients/${patientId}/visits/${visit.id}`);
}
