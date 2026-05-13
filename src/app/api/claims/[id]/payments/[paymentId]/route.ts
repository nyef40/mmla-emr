import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, claims } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/authorize";
import { auditContext } from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string; paymentId: string }> };

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "payments", "delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, paymentId: paymentIdStr } = await params;
  const claimId = parseInt(id, 10);
  const paymentId = parseInt(paymentIdStr, 10);

  const claim = await db.query.claims.findFirst({ where: eq(claims.id, claimId) });
  if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });

  const [deleted] = await db
    .delete(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.claimId, claimId)))
    .returning();

  if (!deleted) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "delete",
    tableName: "payments",
    recordId: paymentId,
    details: { claimId, amount: deleted.amount },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
