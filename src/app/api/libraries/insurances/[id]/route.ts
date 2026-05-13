import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { insurances } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { auditContext } from "@/lib/api-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  const { id } = await params;
  const recordId = parseInt(id, 10);

  const existing = await db.query.insurances.findFirst({ where: eq(insurances.id, recordId) });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const {
    name, category, code, phone, street, city, state, zipCode,
    billType, insuranceType, financialClass, payorSubmitterId, providerNumber, payorType,
    billMethod, ppsBilling, ewRequired, timelyFilingDays,
    authRequired, requiresPlanOfCare, requiresHippsCode, vbpPpsAdjust,
    ediReceiverId, ediReceiverQualifier, ediReceiverName, sbrPayorQualifier,
    isActive,
  } = body;

  const [updated] = await db
    .update(insurances)
    .set({
      ...(name !== undefined && { name: name.trim() }),
      ...(category !== undefined && { category }),
      ...(code !== undefined && { code: code?.trim() || null }),
      ...(phone !== undefined && { phone: phone?.trim() || null }),
      ...(street !== undefined && { street: street?.trim() || null }),
      ...(city !== undefined && { city: city?.trim() || null }),
      ...(state !== undefined && { state: state?.trim() || "CA" }),
      ...(zipCode !== undefined && { zipCode: zipCode?.trim() || null }),
      ...(billType !== undefined && { billType }),
      ...(insuranceType !== undefined && { insuranceType: insuranceType?.trim() || null }),
      ...(financialClass !== undefined && { financialClass: financialClass?.trim() || null }),
      ...(payorSubmitterId !== undefined && { payorSubmitterId: payorSubmitterId?.trim() || null }),
      ...(providerNumber !== undefined && { providerNumber: providerNumber?.trim() || null }),
      ...(payorType !== undefined && { payorType: payorType?.trim() || null }),
      ...(billMethod !== undefined && { billMethod }),
      ...(ppsBilling !== undefined && { ppsBilling: Boolean(ppsBilling) }),
      ...(ewRequired !== undefined && { ewRequired: Boolean(ewRequired) }),
      ...(timelyFilingDays !== undefined && { timelyFilingDays: timelyFilingDays ? parseInt(timelyFilingDays, 10) : null }),
      ...(authRequired !== undefined && { authRequired: Boolean(authRequired) }),
      ...(requiresPlanOfCare !== undefined && { requiresPlanOfCare: Boolean(requiresPlanOfCare) }),
      ...(requiresHippsCode !== undefined && { requiresHippsCode: Boolean(requiresHippsCode) }),
      ...(vbpPpsAdjust !== undefined && { vbpPpsAdjust: Boolean(vbpPpsAdjust) }),
      ...(ediReceiverId !== undefined && { ediReceiverId: ediReceiverId?.trim() || null }),
      ...(ediReceiverQualifier !== undefined && { ediReceiverQualifier: ediReceiverQualifier?.trim() || "ZZ" }),
      ...(ediReceiverName !== undefined && { ediReceiverName: ediReceiverName?.trim() || null }),
      ...(sbrPayorQualifier !== undefined && { sbrPayorQualifier: sbrPayorQualifier?.trim() || null }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date(),
    })
    .where(eq(insurances.id, recordId))
    .returning();

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "update",
    tableName: "insurances",
    recordId,
    details: body,
    ip,
    userAgent,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  const { id } = await params;
  const recordId = parseInt(id, 10);

  const existing = await db.query.insurances.findFirst({ where: eq(insurances.id, recordId) });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.update(insurances).set({ isActive: false, updatedAt: new Date() }).where(eq(insurances.id, recordId));

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "delete",
    tableName: "insurances",
    recordId,
    details: { name: existing.name },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
