import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { charges, claims, patientLogs, billingCodes, insurances, patients } from "@/db/schema";
import { eq, isNull, and, inArray, gte, lte, ne, count } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { can } from "@/lib/authorize";
import { logAudit } from "@/lib/audit";
import { auditContext } from "@/lib/api-utils";

// GET: verified charges not yet linked to a claim
// Optional filters: ?patientId=X&startDate=Y&endDate=Z
// When patientId+dates are provided, also returns pendingCount and existingClaim info.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "claims", "read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const patientIdParam = searchParams.get("patientId");
  const startDate      = searchParams.get("startDate");
  const endDate        = searchParams.get("endDate");

  const baseConditions = [eq(charges.verified, true), isNull(charges.claimId)];
  if (patientIdParam) baseConditions.push(eq(charges.patientId, parseInt(patientIdParam, 10)));
  if (startDate)      baseConditions.push(gte(charges.chargeDate, startDate));
  if (endDate)        baseConditions.push(lte(charges.chargeDate, endDate));

  const rows = await db.query.charges.findMany({
    where: and(...baseConditions),
    orderBy: (c, { asc }) => [asc(c.chargeDate)],
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, patientId: true, socDate: true, insurancePrimary: true } },
      clinician: { columns: { name: true } },
    },
  });

  // Pull billing codes for rate lookup
  const codes = await db.query.billingCodes.findMany();
  const codeMap = new Map(codes.map(c => [c.code, c]));

  const enriched = rows.map(charge => {
    const bc = codeMap.get(charge.chargeCode);
    let computedAmount: string | null = null;
    if (charge.billedAmount) {
      computedAmount = charge.billedAmount;
    } else if (bc?.rate) {
      const rate = parseFloat(bc.rate);
      if (bc.rateType === "per_hour" && charge.visitTime) {
        computedAmount = (rate * parseFloat(charge.visitTime)).toFixed(2);
      } else if (bc.rateType === "per_visit") {
        computedAmount = (rate * charge.quantity).toFixed(2);
      }
    }
    return { ...charge, computedAmount, billingCode: bc ?? null };
  });

  // When a specific patient+period is requested, include validation metadata
  if (patientIdParam && startDate && endDate) {
    const patientIdNum = parseInt(patientIdParam, 10);

    // Count unverified charges in range (pending)
    const [{ value: pendingCount }] = await db
      .select({ value: count() })
      .from(charges)
      .where(and(
        eq(charges.patientId, patientIdNum),
        eq(charges.verified, false),
        isNull(charges.claimId),
        gte(charges.chargeDate, startDate),
        lte(charges.chargeDate, endDate),
      ));

    // Check for any existing non-void claim covering this period
    const existingClaim = await db.query.claims.findFirst({
      where: and(
        eq(claims.patientId, patientIdNum),
        ne(claims.status, "void"),
        lte(claims.periodStart, endDate),
        gte(claims.periodEnd, startDate),
      ),
      columns: { id: true, claimNumber: true, status: true, periodStart: true, periodEnd: true },
    });

    return NextResponse.json({ charges: enriched, pendingCount: Number(pendingCount), existingClaim: existingClaim ?? null });
  }

  return NextResponse.json(enriched);
}

// POST: post a group of charges as a submitted claim
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "claims", "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const {
    patientId,
    chargeIds,
    periodStart,
    periodEnd,
    tobCode,
    hippsCode,
    insuranceId,
    claimNumber,
    totalAmount,
    notes,
  } = body as {
    patientId: number;
    chargeIds: number[];
    periodStart: string;
    periodEnd: string;
    tobCode?: string;
    hippsCode?: string;
    insuranceId?: number;
    claimNumber?: string;
    totalAmount: string;
    notes?: string;
  };

  if (!patientId)     return NextResponse.json({ error: "patientId required" }, { status: 400 });
  if (!chargeIds?.length) return NextResponse.json({ error: "chargeIds required" }, { status: 400 });
  if (!periodStart)   return NextResponse.json({ error: "periodStart required" }, { status: 400 });
  if (!periodEnd)     return NextResponse.json({ error: "periodEnd required" }, { status: 400 });
  if (!totalAmount)   return NextResponse.json({ error: "totalAmount required" }, { status: 400 });

  // Verify all charges belong to this patient and are unposted
  const chargesToPost = await db.query.charges.findMany({
    where: and(
      inArray(charges.id, chargeIds),
      eq(charges.patientId, patientId),
      isNull(charges.claimId),
    ),
  });
  if (chargesToPost.length !== chargeIds.length) {
    return NextResponse.json({ error: "Some charges are invalid or already posted" }, { status: 409 });
  }

  // Auto-resolve insurance: match patient's primary insurance category to a plan
  let resolvedInsuranceId = insuranceId ?? null;
  if (!resolvedInsuranceId) {
    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, patientId),
      columns: { insurancePrimary: true },
    });
    const category = (patient?.insurancePrimary as { category?: string } | null)?.category ?? "";
    if (category) {
      const allIns = await db.select({ id: insurances.id, category: insurances.category }).from(insurances);
      const match = allIns.find(i => i.category.toLowerCase() === category.toLowerCase())
        ?? allIns.find(i => category.toLowerCase().includes(i.category.toLowerCase()))
        ?? allIns.find(i => i.category.toLowerCase().includes(category.toLowerCase()));
      resolvedInsuranceId = match?.id ?? null;
    }
  }

  // Create claim
  const [claim] = await db.insert(claims).values({
    patientId,
    insuranceId: resolvedInsuranceId,
    claimNumber: claimNumber ?? null,
    status: "submitted",
    submittedDate: new Date().toISOString().slice(0, 10),
    periodStart,
    periodEnd,
    tobCode: tobCode ?? "329",
    hippsCode: hippsCode ?? null,
    totalAmount,
    notes: notes ?? null,
  }).returning();

  // Link charges to the new claim and set billedAmount from computedAmount if missing
  for (const charge of chargesToPost) {
    const updateValues: Record<string, unknown> = { claimId: claim.id, updatedAt: new Date() };
    if (!charge.billedAmount) {
      const bc = await db.query.billingCodes.findFirst({ where: eq(billingCodes.code, charge.chargeCode) });
      if (bc?.rate) {
        const rate = parseFloat(bc.rate);
        let amt: number | null = null;
        if (bc.rateType === "per_hour" && charge.visitTime) {
          amt = rate * parseFloat(charge.visitTime);
        } else if (bc.rateType === "per_visit") {
          amt = rate * charge.quantity;
        }
        if (amt !== null) updateValues.billedAmount = amt.toFixed(2);
      }
    }
    await db.update(charges).set(updateValues).where(eq(charges.id, charge.id));
  }

  // Auto-add patient billing log entry
  const logEntry = `${periodStart} – ${periodEnd}, TOB=${tobCode ?? "329"}, billed $${totalAmount}${claimNumber ? `, claim# ${claimNumber}` : ""}`;
  await db.insert(patientLogs).values({
    patientId,
    userId: parseInt(session.user.id, 10),
    logDate: new Date().toISOString().slice(0, 10),
    entry: logEntry,
  });

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "create",
    tableName: "claims",
    recordId: claim.id,
    details: { patientId, periodStart, periodEnd, chargeCount: chargeIds.length, totalAmount },
    ip,
    userAgent,
  });

  return NextResponse.json(claim, { status: 201 });
}
