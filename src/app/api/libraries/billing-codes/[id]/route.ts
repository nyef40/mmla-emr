import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { billingCodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { auditContext } from "@/lib/api-utils";

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

  const existing = await db.query.billingCodes.findFirst({
    where: eq(billingCodes.id, recordId),
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db
    .update(billingCodes)
    .set({ isActive: false })
    .where(eq(billingCodes.id, recordId));

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "delete",
    tableName: "billing_codes",
    recordId,
    details: { code: existing.code },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
