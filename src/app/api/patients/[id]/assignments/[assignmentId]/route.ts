import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { patientStaffAssignments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { can } from "@/lib/authorize";
import { auditContext } from "@/lib/api-utils";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "patients", "update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, assignmentId: assignmentIdStr } = await params;
  const patientId = parseInt(id, 10);
  const assignmentId = parseInt(assignmentIdStr, 10);

  const existing = await db.query.patientStaffAssignments.findFirst({
    where: and(
      eq(patientStaffAssignments.id, assignmentId),
      eq(patientStaffAssignments.patientId, patientId)
    ),
  });
  if (!existing) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  await db
    .update(patientStaffAssignments)
    .set({ isActive: false })
    .where(eq(patientStaffAssignments.id, assignmentId));

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "delete",
    tableName: "patient_staff_assignments",
    recordId: assignmentId,
    details: { patientId },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
