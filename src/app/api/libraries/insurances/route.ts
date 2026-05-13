import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { insurances } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { auditContext } from "@/lib/api-utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.query.insurances.findMany({
    orderBy: asc(insurances.name),
  });

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  const body = await request.json();
  const {
    name, category, phone, street, city, state, zipCode,
    billType, insuranceType, financialClass, payorSubmitterId, providerNumber, payorType,
    billMethod, ppsBilling, ewRequired, timelyFilingDays,
    authRequired, requiresPlanOfCare, requiresHippsCode, vbpPpsAdjust,
    ediReceiverId, ediReceiverQualifier, ediReceiverName, sbrPayorQualifier,
  } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const [row] = await db
    .insert(insurances)
    .values({
      name: name.trim(),
      category: category ?? "Other",
      phone: phone?.trim() || null,
      street: street?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || "CA",
      zipCode: zipCode?.trim() || null,
      billType: billType ?? "UB04",
      insuranceType: insuranceType?.trim() || null,
      financialClass: financialClass?.trim() || null,
      payorSubmitterId: payorSubmitterId?.trim() || null,
      providerNumber: providerNumber?.trim() || null,
      payorType: payorType?.trim() || null,
      billMethod: billMethod ?? "Normal",
      ppsBilling: ppsBilling === true,
      ewRequired: ewRequired === true,
      timelyFilingDays: timelyFilingDays ? parseInt(timelyFilingDays, 10) : null,
      authRequired: authRequired === true,
      requiresPlanOfCare: requiresPlanOfCare === true,
      requiresHippsCode: requiresHippsCode === true,
      vbpPpsAdjust: vbpPpsAdjust === true,
      ediReceiverId: ediReceiverId?.trim() || null,
      ediReceiverQualifier: ediReceiverQualifier?.trim() || "ZZ",
      ediReceiverName: ediReceiverName?.trim() || null,
      sbrPayorQualifier: sbrPayorQualifier?.trim() || null,
    })
    .returning();

  // Auto-assign code based on generated id
  const [withCode] = await db
    .update(insurances)
    .set({ code: String(60000 + row.id) })
    .where(eq(insurances.id, row.id))
    .returning();

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "create",
    tableName: "insurances",
    recordId: row.id,
    details: { name: row.name },
    ip,
    userAgent,
  });

  return NextResponse.json(withCode, { status: 201 });
}
