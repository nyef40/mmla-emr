import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { icdCodes } from "@/db/schema";
import { asc, eq, and, or, ilike } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { auditContext } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = request.nextUrl.searchParams.get("search")?.trim();

  const where = search
    ? and(
        eq(icdCodes.isActive, true),
        or(
          ilike(icdCodes.code, `%${search}%`),
          ilike(icdCodes.description, `%${search}%`)
        )
      )
    : undefined;

  const rows = await db.query.icdCodes.findMany({
    where,
    orderBy: [asc(icdCodes.displayOrder), asc(icdCodes.code)],
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
  const { code, description, category, displayOrder } = body;

  if (!code?.trim()) return NextResponse.json({ error: "Code is required" }, { status: 400 });
  if (!description?.trim()) return NextResponse.json({ error: "Description is required" }, { status: 400 });

  const [row] = await db
    .insert(icdCodes)
    .values({
      code: code.trim().toUpperCase(),
      description: description.trim(),
      category: category?.trim() || "Other",
      displayOrder: displayOrder ? parseInt(displayOrder, 10) : 99,
    })
    .returning();

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "create",
    tableName: "icd_codes",
    recordId: row.id,
    details: { code: row.code, description: row.description },
    ip,
    userAgent,
  });

  return NextResponse.json(row, { status: 201 });
}
