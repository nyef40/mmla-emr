import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { claims, charges, billingCodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/authorize";
import { auditContext } from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string }> };

const VALID_STATUSES = ["draft", "submitted", "accepted", "rejected", "paid", "void"] as const;
type ClaimStatus = typeof VALID_STATUSES[number];

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "claims", "read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const claim = await db.query.claims.findFirst({
    where: eq(claims.id, parseInt(id, 10)),
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true, patientId: true } },
      insurance: { columns: { id: true, name: true, category: true } },
      visit: { columns: { id: true, visitType: true, visitDate: true, formStatus: true } },
      payments: true,
    },
  });

  if (!claim) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Auto-derive billingCodesJson from linked charges when not manually set
  let result: Record<string, unknown> = claim as unknown as Record<string, unknown>;
  const hasManualCodes = Array.isArray(claim.billingCodesJson) && (claim.billingCodesJson as unknown[]).length > 0;
  if (!hasManualCodes) {
    const linkedCharges = await db.query.charges.findMany({
      where: eq(charges.claimId, parseInt(id, 10)),
      orderBy: (c, { asc }) => [asc(c.chargeDate), asc(c.chargeCode)],
    });
    if (linkedCharges.length > 0) {
      const allCodes = await db.query.billingCodes.findMany();
      const codeMap = new Map(allCodes.map(c => [c.code, c.description]));
      result = {
        ...result,
        billingCodesJson: linkedCharges.map(c => ({
          code:        c.chargeCode,
          description: codeMap.get(c.chargeCode) ?? c.chargeCode,
          units:       c.quantity,
          amount:      parseFloat(String(c.billedAmount ?? "0")),
        })),
      };
    }
  }

  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "claims", "update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const claimId = parseInt(id, 10);

  const existing = await db.query.claims.findFirst({ where: eq(claims.id, claimId) });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const {
    status, claimNumber, submittedDate, billingCodesJson, totalAmount, notes,
    insuranceId, visitId, icn, hippsCode, periodStart, periodEnd, tobCode,
    caseWeight, wageIndex, cbsaCode, eepAmount, outlierAmount, sequesterAmount, finalPosted, ppsNotes,
  } = body;

  if (status && !VALID_STATUSES.includes(status as ClaimStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Once void, no further edits allowed
  if (existing.status === "void") {
    return NextResponse.json({ error: "Voided claims cannot be modified" }, { status: 409 });
  }

  // When voiding: release all linked charges back to charge load
  if (status === "void") {
    await db.update(charges).set({ claimId: null, updatedAt: new Date() }).where(eq(charges.claimId, claimId));
  }

  const [updated] = await db
    .update(claims)
    .set({
      ...(status !== undefined && { status: status as ClaimStatus }),
      ...(claimNumber !== undefined && { claimNumber }),
      ...(submittedDate !== undefined && { submittedDate }),
      ...(billingCodesJson !== undefined && { billingCodesJson }),
      ...(totalAmount !== undefined && { totalAmount: String(totalAmount) }),
      ...(notes !== undefined && { notes }),
      ...(insuranceId !== undefined && { insuranceId }),
      ...(visitId !== undefined && { visitId }),
      ...(icn !== undefined && { icn }),
      ...(hippsCode !== undefined && { hippsCode }),
      ...(periodStart !== undefined && { periodStart }),
      ...(periodEnd !== undefined && { periodEnd }),
      ...(tobCode !== undefined && { tobCode }),
      ...(caseWeight !== undefined && { caseWeight: caseWeight !== null ? String(caseWeight) : null }),
      ...(wageIndex !== undefined && { wageIndex: wageIndex !== null ? String(wageIndex) : null }),
      ...(cbsaCode !== undefined && { cbsaCode }),
      ...(eepAmount !== undefined && { eepAmount: eepAmount !== null ? String(eepAmount) : null }),
      ...(outlierAmount !== undefined && { outlierAmount: outlierAmount !== null ? String(outlierAmount) : null }),
      ...(sequesterAmount !== undefined && { sequesterAmount: sequesterAmount !== null ? String(sequesterAmount) : null }),
      ...(finalPosted !== undefined && { finalPosted: finalPosted !== null ? String(finalPosted) : null }),
      ...(ppsNotes !== undefined && { ppsNotes }),
      updatedAt: new Date(),
    })
    .where(eq(claims.id, claimId))
    .returning();

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "update",
    tableName: "claims",
    recordId: claimId,
    details: { status, claimNumber },
    ip,
    userAgent,
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "claims", "delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const claimId = parseInt(id, 10);

  const existing = await db.query.claims.findFirst({ where: eq(claims.id, claimId) });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing.status !== "draft") {
    return NextResponse.json({ error: "Only draft claims can be deleted" }, { status: 409 });
  }

  const [deleted] = await db.delete(claims).where(eq(claims.id, claimId)).returning();

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "delete",
    tableName: "claims",
    recordId: claimId,
    details: { patientId: deleted.patientId },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
