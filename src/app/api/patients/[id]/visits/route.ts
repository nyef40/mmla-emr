import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { visits, patients } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { can, mustMatchOwner } from "@/lib/authorize";
import { auditContext } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const patientId = parseInt(id, 10);
  const patient = await db.query.patients.findFirst({ where: eq(patients.id, patientId) });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  if (!mustMatchOwner(session.user.role, patient.ownerId, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db.query.visits.findMany({
    where: eq(visits.patientId, patientId),
    orderBy: desc(visits.visitDate),
    with: { clinician: true },
  });

  // Add visitDateISO: calendar date string computed server-side using UTC methods
  // (visits are stored at UTC noon so getUTC* always returns the correct calendar date)
  function localDateStr(d: Date | string | null | undefined): string {
    if (!d) return "";
    if (typeof d === "string") return d.slice(0, 10);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  }

  const payload = rows.map(v => ({ ...v, visitDateISO: localDateStr(v.visitDate) }));
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "visits", "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const patientId = parseInt(id, 10);
  const patient = await db.query.patients.findFirst({ where: eq(patients.id, patientId) });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  if (!mustMatchOwner(session.user.role, patient.ownerId, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  // Normalize to UTC noon of the given date so the calendar date is timezone-safe
  function parseVisitDate(raw: string | undefined): Date {
    if (!raw) return new Date();
    const [y, m, d] = raw.slice(0, 10).split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  }

  const [visit] = await db
    .insert(visits)
    .values({
      patientId,
      clinicianId: parseInt(session.user.id, 10),
      visitDate: parseVisitDate(body.visitDate),
      visitType: body.visitType ?? "SKILLED NURSE INFUSION VISIT NOTE",
      status: "in_progress",
      formData: body.formData ?? null,
      formStatus: "draft",
    })
    .returning();

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "create",
    tableName: "visits",
    recordId: visit.id,
    details: { patientId, visitType: visit.visitType },
    ip,
    userAgent,
  });

  return NextResponse.json(visit, { status: 201 });
}
