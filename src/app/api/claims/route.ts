import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { claims, patients, insurances, visits } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/authorize";
import { auditContext } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "claims", "read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const patientId = searchParams.get("patientId");
  const status = searchParams.get("status");

  const conditions = [];
  if (patientId) conditions.push(eq(claims.patientId, parseInt(patientId, 10)));
  if (status) conditions.push(eq(claims.status, status as typeof claims.status._.data));

  const rows = await db.query.claims.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: desc(claims.createdAt),
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, patientId: true } },
      insurance: { columns: { id: true, name: true } },
      visit: { columns: { id: true, visitType: true, visitDate: true } },
    },
  });

  return NextResponse.json(rows, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "claims", "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { patientId, insuranceId, visitId, claimNumber, billingCodesJson, totalAmount, notes } = body;

  if (!patientId) return NextResponse.json({ error: "patientId is required" }, { status: 400 });

  const patient = await db.query.patients.findFirst({ where: eq(patients.id, patientId) });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  if (insuranceId) {
    const ins = await db.query.insurances.findFirst({ where: eq(insurances.id, insuranceId) });
    if (!ins) return NextResponse.json({ error: "Insurance not found" }, { status: 404 });
  }

  if (visitId) {
    const visit = await db.query.visits.findFirst({ where: eq(visits.id, visitId) });
    if (!visit) return NextResponse.json({ error: "Visit not found" }, { status: 404 });
  }

  const [claim] = await db
    .insert(claims)
    .values({
      patientId,
      insuranceId: insuranceId ?? null,
      visitId: visitId ?? null,
      claimNumber: claimNumber ?? null,
      status: "draft",
      billingCodesJson: billingCodesJson ?? null,
      totalAmount: totalAmount != null ? String(totalAmount) : null,
      notes: notes ?? null,
    })
    .returning();

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "create",
    tableName: "claims",
    recordId: claim.id,
    details: { patientId, visitId, totalAmount },
    ip,
    userAgent,
  });

  return NextResponse.json(claim, { status: 201 });
}
