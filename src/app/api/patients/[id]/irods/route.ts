import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { irodsAssessments, patients } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
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

  const patient = await db.query.patients.findFirst({ where: eq(patients.id, patientId) });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const rows = await db.query.irodsAssessments.findMany({
    where: eq(irodsAssessments.patientId, patientId),
    orderBy: desc(irodsAssessments.assessmentDate),
    with: { completedBy: true },
  });

  return NextResponse.json(rows);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const patientId = parseInt(id, 10);
  const patient = await db.query.patients.findFirst({ where: eq(patients.id, patientId) });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const b = await request.json();
  const { assessmentDate, responses, notes } = b;

  if (!assessmentDate) {
    return NextResponse.json({ error: "Assessment date is required" }, { status: 400 });
  }
  if (!Array.isArray(responses) || responses.length !== 24) {
    return NextResponse.json({ error: "All 24 responses are required" }, { status: 400 });
  }

  const rawScore = (responses as number[]).reduce((sum, v) => sum + (v ?? 0), 0);

  const [row] = await db
    .insert(irodsAssessments)
    .values({
      patientId,
      completedById: parseInt(session.user.id, 10),
      assessmentDate,
      responses,
      rawScore,
      notes: notes?.trim() || null,
    })
    .returning();

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "create",
    tableName: "irods_assessments",
    recordId: row.id,
    details: { patientId, rawScore },
    ip,
    userAgent,
  });

  return NextResponse.json(row, { status: 201 });
}
