import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { oasisAssessments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { auditContext } from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string }> };

// GET all OASIS assessments for a patient
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const rows = await db.query.oasisAssessments.findMany({
    where: eq(oasisAssessments.patientId, parseInt(id, 10)),
    orderBy: desc(oasisAssessments.assessDate),
    with: {
      completedBy: { columns: { name: true } },
      episode: { columns: { id: true, startDate: true, endDate: true, episodeNumber: true } },
    },
  });
  return NextResponse.json(rows);
}

// POST: create a new OASIS assessment
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin" && session.user.role !== "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const patientId = parseInt(id, 10);
  const body = await request.json();
  const { episodeId, assessDate, rfaCode, assessmentReason, hippsCode, hhrgCode, notes } = body;

  if (!assessDate) return NextResponse.json({ error: "assessDate required" }, { status: 400 });

  const RFA_LABELS: Record<number, string> = {
    1: "OASIS v3-E RFA 1 Start of Care",
    3: "OASIS v3-E RFA 3 Resumption of Care",
    4: "OASIS v3-E RFA 4 Followup",
    5: "OASIS v3-E RFA 5 Other",
    9: "OASIS v3-E RFA 9 Discharge",
  };
  const rfa = parseInt(rfaCode ?? "4", 10);
  const reason = assessmentReason?.trim() || RFA_LABELS[rfa] || `OASIS v3-E RFA ${rfa}`;

  const [row] = await db.insert(oasisAssessments).values({
    patientId,
    episodeId: episodeId ?? null,
    completedById: parseInt(session.user.id, 10),
    assessDate,
    rfaCode: rfa,
    assessmentReason: reason,
    hippsCode: hippsCode?.trim() || null,
    hhrgCode: hhrgCode?.trim() || null,
    status: "completed",
    notes: notes ?? null,
  }).returning();

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "create",
    tableName: "oasis_assessments",
    recordId: row.id,
    details: { patientId, assessDate, rfaCode: rfa },
    ip,
    userAgent,
  });

  return NextResponse.json(row, { status: 201 });
}
