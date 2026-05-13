import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payroll, charges } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { can } from "@/lib/authorize";
import { logAudit } from "@/lib/audit";
import { auditContext } from "@/lib/api-utils";

const WITH_USER = {
  user: { columns: { id: true, name: true, role: true } },
} as const;

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "payroll", "read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const userId = searchParams.get("userId");
  const status  = searchParams.get("status");
  const from    = searchParams.get("from");
  const to      = searchParams.get("to");

  const conds = [];
  if (userId) conds.push(eq(payroll.userId,      parseInt(userId, 10)));
  if (status) conds.push(eq(payroll.status,      status as "draft" | "approved" | "paid"));
  if (from)   conds.push(gte(payroll.periodStart, from));
  if (to)     conds.push(lte(payroll.periodEnd,   to));

  const rows = await db.query.payroll.findMany({
    where: conds.length > 0 ? and(...conds) : undefined,
    orderBy: desc(payroll.periodStart),
    with: WITH_USER,
  });

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "payroll", "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, periodStart, periodEnd, rate, rateType, notes } = body as {
    userId: number;
    periodStart: string;
    periodEnd: string;
    rate: string;
    rateType: "hourly" | "per_visit" | "salary";
    notes?: string;
  };

  if (!userId)      return NextResponse.json({ error: "userId is required" },      { status: 400 });
  if (!periodStart) return NextResponse.json({ error: "periodStart is required" }, { status: 400 });
  if (!periodEnd)   return NextResponse.json({ error: "periodEnd is required" },   { status: 400 });
  if (!rate)        return NextResponse.json({ error: "rate is required" },        { status: 400 });
  if (!rateType)    return NextResponse.json({ error: "rateType is required" },    { status: 400 });
  if (periodStart > periodEnd) return NextResponse.json({ error: "periodStart must be before periodEnd" }, { status: 400 });

  // Auto-calculate hours and visits from charges in the period
  const chargeRows = await db.query.charges.findMany({
    where: and(
      eq(charges.clinicianId, userId),
      gte(charges.chargeDate, periodStart),
      lte(charges.chargeDate, periodEnd),
    ),
  });

  const hours = chargeRows.reduce((sum, c) => sum + (parseFloat(c.visitTime ?? "0") || 0), 0);
  // Count unique visit dates (or unique visitIds) as visits
  const visitedDates = new Set(chargeRows.map(c => c.chargeDate));
  const visitsCount = visitedDates.size;

  const rateNum = parseFloat(rate);
  let total: number;
  if (rateType === "hourly")    total = rateNum * hours;
  else if (rateType === "per_visit") total = rateNum * visitsCount;
  else                           total = rateNum; // salary — fixed per period

  const [row] = await db.insert(payroll).values({
    userId,
    periodStart,
    periodEnd,
    hours:       hours > 0 ? hours.toFixed(2) : null,
    visitsCount: visitsCount > 0 ? visitsCount : null,
    rate:        rate,
    rateType,
    total:       total.toFixed(2),
    status:      "draft",
    notes:       notes ?? null,
  }).returning();

  const full = await db.query.payroll.findFirst({
    where: eq(payroll.id, row.id),
    with: WITH_USER,
  });

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "create",
    tableName: "payroll",
    recordId: row.id,
    details: { userId, periodStart, periodEnd, total: row.total },
    ip,
    userAgent,
  });

  return NextResponse.json(full, { status: 201 });
}
