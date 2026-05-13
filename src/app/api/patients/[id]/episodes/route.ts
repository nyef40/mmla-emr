import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { episodes, patients } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { auditContext } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const patientId = parseInt(id, 10);

  const rows = await db.query.episodes.findMany({
    where: eq(episodes.patientId, patientId),
    orderBy: asc(episodes.episodeNumber),
  });

  return NextResponse.json(rows);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "admin" && role !== "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const patientId = parseInt(id, 10);

  const patient = await db.query.patients.findFirst({ where: eq(patients.id, patientId) });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const b = await request.json();

  if (!b.startDate || !b.endDate) {
    return NextResponse.json({ error: "Start and end date are required" }, { status: 400 });
  }

  const [row] = await db
    .insert(episodes)
    .values({
      patientId,
      episodeNumber: b.episodeNumber ?? 1,
      chartNumber:  b.chartNumber?.trim()  || null,
      admitNumber:  b.admitNumber?.trim()  || null,
      startDate:    b.startDate,
      endDate:      b.endDate,
      fbvAccrual:   b.fbvAccrual  || null,
      finalBill:    b.finalBill   || null,
      docStatus:    b.docStatus   ?? "docs_not_rcvd",
    })
    .returning();

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "create",
    tableName: "episodes",
    recordId: row.id,
    details: { patientId, startDate: row.startDate, endDate: row.endDate },
    ip,
    userAgent,
  });

  return NextResponse.json(row, { status: 201 });
}
