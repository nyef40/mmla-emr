import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { patients, patientStaffAssignments, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { can } from "@/lib/authorize";
import { auditContext } from "@/lib/api-utils";
import { logAudit } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const patientId = parseInt(id, 10);
  const patient = await db.query.patients.findFirst({ where: eq(patients.id, patientId) });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const assignments = await db.query.patientStaffAssignments.findMany({
    where: and(
      eq(patientStaffAssignments.patientId, patientId),
      eq(patientStaffAssignments.isActive, true)
    ),
    with: { staff: true, assignedBy: true },
  });

  return NextResponse.json(assignments);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "patients", "update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const patientId = parseInt(id, 10);
  const patient = await db.query.patients.findFirst({ where: eq(patients.id, patientId) });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const { staffId } = await request.json();
  if (!staffId) return NextResponse.json({ error: "staffId required" }, { status: 400 });

  const staff = await db.query.users.findFirst({ where: eq(users.id, staffId) });
  if (!staff) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const existing = await db.query.patientStaffAssignments.findFirst({
    where: and(
      eq(patientStaffAssignments.patientId, patientId),
      eq(patientStaffAssignments.staffId, staffId),
      eq(patientStaffAssignments.isActive, true)
    ),
  });
  if (existing) return NextResponse.json({ error: "Already assigned" }, { status: 409 });

  const [assignment] = await db
    .insert(patientStaffAssignments)
    .values({
      patientId,
      staffId,
      assignedById: parseInt(session.user.id, 10),
    })
    .returning();

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "create",
    tableName: "patient_staff_assignments",
    recordId: assignment.id,
    details: { patientId, staffId },
    ip,
    userAgent,
  });

  return NextResponse.json(assignment, { status: 201 });
}
