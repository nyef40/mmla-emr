import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { visits, patients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { auditContext } from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string; visitId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "admin" && role !== "staff") {
    return NextResponse.json({ error: "Forbidden — admin/staff only" }, { status: 403 });
  }

  const { id, visitId: visitIdStr } = await params;
  const patientId = parseInt(id, 10);
  const visitId = parseInt(visitIdStr, 10);

  const patient = await db.query.patients.findFirst({ where: eq(patients.id, patientId) });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const existing = await db.query.visits.findFirst({
    where: and(eq(visits.id, visitId), eq(visits.patientId, patientId)),
  });
  if (!existing) return NextResponse.json({ error: "Visit not found" }, { status: 404 });

  const { action } = await request.json() as { action: string };

  type FormStatus = "draft" | "signed" | "completed" | "needs_correction" | "locked";
  type VisitStatus = "scheduled" | "in_progress" | "completed";

  let newFormStatus: FormStatus;
  let newStatus: VisitStatus = (existing.status as VisitStatus) ?? "in_progress";

  if (action === "complete") {
    if (existing.formStatus !== "signed") {
      return NextResponse.json({ error: "Only signed visits can be completed" }, { status: 409 });
    }
    newFormStatus = "completed";
    newStatus = "completed";
  } else if (action === "needs_correction") {
    if (existing.formStatus !== "signed" && existing.formStatus !== "completed") {
      return NextResponse.json({ error: "Only signed or completed visits can be returned for correction" }, { status: 409 });
    }
    newFormStatus = "needs_correction";
    newStatus = "in_progress";
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const [updated] = await db
    .update(visits)
    .set({ formStatus: newFormStatus, status: newStatus, updatedAt: new Date() })
    .where(and(eq(visits.id, visitId), eq(visits.patientId, patientId)))
    .returning();

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "update",
    tableName: "visits",
    recordId: visitId,
    details: { action, newFormStatus },
    ip,
    userAgent,
  });

  return NextResponse.json(updated);
}
