import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { billingCodes } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { auditContext } from "@/lib/api-utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.query.billingCodes.findMany({
    where: eq(billingCodes.isActive, true),
    orderBy: asc(billingCodes.displayOrder),
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
  const { code, description, rate, rateType, displayOrder } = body as {
    code: string;
    description: string;
    rate?: number | null;
    rateType?: "per_hour" | "per_visit" | null;
    displayOrder?: number;
  };

  if (!code?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "code and description are required" }, { status: 400 });
  }

  const [row] = await db
    .insert(billingCodes)
    .values({
      code: code.trim(),
      description: description.trim(),
      rate: rate != null ? String(rate) : null,
      rateType: rateType ?? null,
      displayOrder: displayOrder ?? 99,
    })
    .returning();

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "create",
    tableName: "billing_codes",
    recordId: row.id,
    details: { code: row.code },
    ip,
    userAgent,
  });

  return NextResponse.json(row, { status: 201 });
}
