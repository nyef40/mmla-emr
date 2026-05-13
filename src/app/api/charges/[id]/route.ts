import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { charges } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/authorize";
import { auditContext } from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "charges", "update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const chargeId = parseInt(id, 10);

  const existing = await db.query.charges.findFirst({ where: eq(charges.id, chargeId) });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const { chargeDate, chargeCode, quantity, visitTime, miles, payRate, verified, notes } = body;

  const [updated] = await db
    .update(charges)
    .set({
      ...(chargeDate  !== undefined && { chargeDate }),
      ...(chargeCode  !== undefined && { chargeCode }),
      ...(quantity    !== undefined && { quantity }),
      ...(visitTime   !== undefined && { visitTime: visitTime != null ? String(visitTime) : null }),
      ...(miles       !== undefined && { miles: miles != null ? String(miles) : null }),
      ...(payRate     !== undefined && { payRate }),
      ...(verified    !== undefined && { verified }),
      ...(notes       !== undefined && { notes }),
      updatedAt: new Date(),
    })
    .where(eq(charges.id, chargeId))
    .returning();

  // Re-fetch with joins
  const full = await db.query.charges.findFirst({
    where: eq(charges.id, chargeId),
    with: {
      patient:   { columns: { id: true, patientId: true, firstName: true, lastName: true } },
      clinician: { columns: { id: true, name: true } },
      visit:     { columns: { id: true, visitType: true, visitDate: true } },
    },
  });

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "update",
    tableName: "charges",
    recordId: chargeId,
    details: { chargeCode: updated.chargeCode, verified: updated.verified },
    ip,
    userAgent,
  });

  return NextResponse.json(full);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "charges", "delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const chargeId = parseInt(id, 10);

  const [deleted] = await db.delete(charges).where(eq(charges.id, chargeId)).returning();
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "delete",
    tableName: "charges",
    recordId: chargeId,
    details: { chargeCode: deleted.chargeCode, patientId: deleted.patientId },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
