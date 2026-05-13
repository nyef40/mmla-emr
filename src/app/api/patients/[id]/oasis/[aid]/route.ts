import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { oasisAssessments, patientLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { auditContext } from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string; aid: string }> };

// PATCH: update status, HIPPS code, iQIES fields, or export
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin" && session.user.role !== "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, aid } = await params;
  const patientId = parseInt(id, 10);
  const assessId  = parseInt(aid, 10);

  const existing = await db.query.oasisAssessments.findFirst({ where: eq(oasisAssessments.id, assessId) });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const { status, hippsCode, hhrgCode, exportFileName, iqiesSubmissionId, iqiesAsmtId, notes, action } = body;

  // Status transition guard
  if (status === "exported" && existing.status !== "locked_awaiting_export") {
    return NextResponse.json({ error: "Only locked assessments can be exported" }, { status: 409 });
  }
  if (status === "locked_awaiting_export" && existing.status === "exported") {
    return NextResponse.json({ error: "Exported assessments cannot be re-locked" }, { status: 409 });
  }

  const isExport = status === "exported" || action === "export";
  const now = new Date();

  const [updated] = await db.update(oasisAssessments).set({
    ...(status      !== undefined && { status: status as typeof oasisAssessments.status._.data }),
    ...(hippsCode   !== undefined && { hippsCode: hippsCode?.trim() || null }),
    ...(hhrgCode    !== undefined && { hhrgCode:  hhrgCode?.trim()  || null }),
    ...(exportFileName   !== undefined && { exportFileName }),
    ...(iqiesSubmissionId !== undefined && { iqiesSubmissionId }),
    ...(iqiesAsmtId !== undefined && { iqiesAsmtId }),
    ...(notes       !== undefined && { notes }),
    ...(isExport && { status: "exported", exportedAt: now }),
    updatedAt: now,
  }).where(eq(oasisAssessments.id, assessId)).returning();

  // Auto-log export event
  if (isExport) {
    const fileName = exportFileName ?? updated.exportFileName ?? "oasis_export.zip";
    await db.insert(patientLogs).values({
      patientId,
      userId: parseInt(session.user.id, 10),
      logDate: now.toISOString().slice(0, 10),
      entry: `OASIS exported: ${updated.assessmentReason} (${updated.assessDate}) → ${fileName}`,
    });
  }

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "update",
    tableName: "oasis_assessments",
    recordId: assessId,
    details: { status: updated.status, hippsCode: updated.hippsCode },
    ip,
    userAgent,
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { aid } = await params;
  const assessId = parseInt(aid, 10);
  const existing = await db.query.oasisAssessments.findFirst({ where: eq(oasisAssessments.id, assessId) });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status === "exported") {
    return NextResponse.json({ error: "Exported assessments cannot be deleted" }, { status: 409 });
  }

  await db.delete(oasisAssessments).where(eq(oasisAssessments.id, assessId));

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "delete",
    tableName: "oasis_assessments",
    recordId: assessId,
    details: { assessDate: existing.assessDate },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
