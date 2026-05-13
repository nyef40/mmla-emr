import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, claims } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/authorize";
import { auditContext } from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string }> };

const VALID_PAYMENT_TYPES = ["check", "ach", "era", "other"] as const;
type PaymentType = typeof VALID_PAYMENT_TYPES[number];

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "payments", "read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const claimId = parseInt(id, 10);

  const claim = await db.query.claims.findFirst({ where: eq(claims.id, claimId) });
  if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });

  const rows = await db.query.payments.findMany({
    where: eq(payments.claimId, claimId),
  });

  return NextResponse.json(rows, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "payments", "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const claimId = parseInt(id, 10);

  const claim = await db.query.claims.findFirst({ where: eq(claims.id, claimId) });
  if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });

  if (claim.status === "void") {
    return NextResponse.json({ error: "Cannot add payment to a voided claim" }, { status: 409 });
  }

  const body = await request.json();
  const { amount, paymentDate, payer, paymentType, checkNumber, notes } = body;

  if (!amount || !paymentDate) {
    return NextResponse.json({ error: "amount and paymentDate are required" }, { status: 400 });
  }

  if (paymentType && !VALID_PAYMENT_TYPES.includes(paymentType as PaymentType)) {
    return NextResponse.json({ error: "Invalid paymentType" }, { status: 400 });
  }

  const [payment] = await db
    .insert(payments)
    .values({
      claimId,
      amount: String(amount),
      paymentDate,
      payer: payer ?? null,
      paymentType: (paymentType as PaymentType) ?? "other",
      checkNumber: checkNumber ?? null,
      notes: notes ?? null,
    })
    .returning();

  // Auto-advance claim to "paid" if it was accepted
  if (claim.status === "accepted") {
    await db.update(claims).set({ status: "paid", updatedAt: new Date() }).where(eq(claims.id, claimId));
  }

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "create",
    tableName: "payments",
    recordId: payment.id,
    details: { claimId, amount, paymentType },
    ip,
    userAgent,
  });

  return NextResponse.json(payment, { status: 201 });
}
