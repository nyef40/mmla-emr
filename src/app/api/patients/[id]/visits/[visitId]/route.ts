import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { visits, patients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { can, mustMatchOwner } from "@/lib/authorize";
import { auditContext } from "@/lib/api-utils";


type RouteParams = { params: Promise<{ id: string; visitId: string }> };

// Admin-only status update (bypasses editable-state guard)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "admin" && role !== "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, visitId: visitIdStr } = await params;
  const patientId = parseInt(id, 10);
  const visitId   = parseInt(visitIdStr, 10);
  const body      = await request.json();
  const { formStatus } = body as { formStatus?: string };

  const allowedStatuses = ["draft", "signed", "completed", "needs_correction", "locked"] as const;
  type FormStatus = typeof allowedStatuses[number];
  if (!formStatus || !allowedStatuses.includes(formStatus as FormStatus)) {
    return NextResponse.json({ error: "Invalid formStatus" }, { status: 400 });
  }

  const [updated] = await db
    .update(visits)
    .set({ formStatus: formStatus as FormStatus, updatedAt: new Date() })
    .where(and(eq(visits.id, visitId), eq(visits.patientId, patientId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "update",
    tableName: "visits",
    recordId: visitId,
    details: { formStatus },
    ip,
    userAgent,
  });

  return NextResponse.json(updated);
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, visitId: visitIdStr } = await params;
  const patientId = parseInt(id, 10);
  const visitId = parseInt(visitIdStr, 10);

  const patient = await db.query.patients.findFirst({ where: eq(patients.id, patientId) });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  if (!mustMatchOwner(session.user.role, patient.ownerId, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const visit = await db.query.visits.findFirst({
    where: and(eq(visits.id, visitId), eq(visits.patientId, patientId)),
    with: { clinician: true },
  });
  if (!visit) return NextResponse.json({ error: "Visit not found" }, { status: 404 });

  return NextResponse.json(visit);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "visits", "update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, visitId: visitIdStr } = await params;
  const patientId = parseInt(id, 10);
  const visitId = parseInt(visitIdStr, 10);

  const patient = await db.query.patients.findFirst({ where: eq(patients.id, patientId) });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  if (!mustMatchOwner(session.user.role, patient.ownerId, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await db.query.visits.findFirst({
    where: and(eq(visits.id, visitId), eq(visits.patientId, patientId)),
  });
  if (!existing) return NextResponse.json({ error: "Visit not found" }, { status: 404 });

  // RN can save/sign only when the form is in an editable state
  const editableStates = ["draft", "needs_correction"];
  if (!editableStates.includes(existing.formStatus ?? "draft")) {
    return NextResponse.json({ error: "Visit cannot be edited in its current state" }, { status: 409 });
  }

  const body = await request.json();
  const newFormStatus = body.formStatus ?? existing.formStatus ?? "draft";

  const [updated] = await db
    .update(visits)
    .set({
      formData: body.formData ?? existing.formData,
      formStatus: newFormStatus,
      status: newFormStatus === "signed" ? "in_progress" : existing.status,
      notes: body.notes ?? existing.notes,
      updatedAt: new Date(),
    })
    .where(and(eq(visits.id, visitId), eq(visits.patientId, patientId)))
    .returning();

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "update",
    tableName: "visits",
    recordId: visitId,
    details: { formStatus: newFormStatus },
    ip,
    userAgent,
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "admin" && role !== "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, visitId: visitIdStr } = await params;
  const patientId = parseInt(id, 10);
  const visitId   = parseInt(visitIdStr, 10);

  const [deleted] = await db
    .delete(visits)
    .where(and(eq(visits.id, visitId), eq(visits.patientId, patientId)))
    .returning();

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "delete",
    tableName: "visits",
    recordId: visitId,
    details: { patientId },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
