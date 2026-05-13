import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payroll } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { can } from "@/lib/authorize";
import { logAudit } from "@/lib/audit";
import { auditContext } from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string }> };

const WITH_USER = {
  user: { columns: { id: true, name: true, role: true } },
} as const;

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "payroll", "read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const row = await db.query.payroll.findFirst({
    where: eq(payroll.id, parseInt(id, 10)),
    with: WITH_USER,
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "payroll", "update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const payrollId = parseInt(id, 10);

  const existing = await db.query.payroll.findFirst({ where: eq(payroll.id, payrollId) });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const { status, payDate, hours, visitsCount, rate, rateType, total, notes } = body;

  // Status transition rules
  if (status) {
    if (existing.status === "paid")     return NextResponse.json({ error: "Paid records are immutable" }, { status: 409 });
    if (status === "approved" && existing.status !== "draft")   return NextResponse.json({ error: "Can only approve draft records" },   { status: 409 });
    if (status === "paid"     && existing.status !== "approved") return NextResponse.json({ error: "Can only mark approved records paid" }, { status: 409 });
    if (status === "paid"     && !payDate) return NextResponse.json({ error: "payDate required when marking as paid" }, { status: 400 });
    // Only admin can approve or mark paid
    if ((status === "approved" || status === "paid") && session.user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can approve or mark payroll as paid" }, { status: 403 });
    }
  }

  await db.update(payroll).set({
    ...(status      !== undefined && { status }),
    ...(payDate     !== undefined && { payDate }),
    ...(hours       !== undefined && { hours: hours != null ? String(hours) : null }),
    ...(visitsCount !== undefined && { visitsCount }),
    ...(rate        !== undefined && { rate: rate != null ? String(rate) : null }),
    ...(rateType    !== undefined && { rateType }),
    ...(total       !== undefined && { total: total != null ? String(total) : null }),
    ...(notes       !== undefined && { notes }),
    updatedAt: new Date(),
  }).where(eq(payroll.id, payrollId));

  const full = await db.query.payroll.findFirst({
    where: eq(payroll.id, payrollId),
    with: WITH_USER,
  });

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "update",
    tableName: "payroll",
    recordId: payrollId,
    details: { status: full?.status },
    ip,
    userAgent,
  });

  return NextResponse.json(full);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "payroll", "delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const payrollId = parseInt(id, 10);

  const existing = await db.query.payroll.findFirst({ where: eq(payroll.id, payrollId) });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "draft") return NextResponse.json({ error: "Only draft records can be deleted" }, { status: 409 });

  await db.delete(payroll).where(eq(payroll.id, payrollId));

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "delete",
    tableName: "payroll",
    recordId: payrollId,
    details: { userId: existing.userId, periodStart: existing.periodStart, periodEnd: existing.periodEnd },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
