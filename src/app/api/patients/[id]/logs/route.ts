import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { patientLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { can } from "@/lib/authorize";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "patient_logs", "read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const rows = await db.query.patientLogs.findMany({
    where: eq(patientLogs.patientId, parseInt(id, 10)),
    orderBy: desc(patientLogs.logDate),
    with: { user: { columns: { name: true } } },
  });

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "patient_logs", "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const patientId = parseInt(id, 10);
  const body = await request.json();
  const { logDate, entry } = body;

  if (!entry?.trim()) return NextResponse.json({ error: "entry is required" }, { status: 400 });

  const [row] = await db.insert(patientLogs).values({
    patientId,
    userId: parseInt(session.user.id, 10),
    logDate: logDate ?? new Date().toISOString().slice(0, 10),
    entry: entry.trim(),
  }).returning();

  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "patient_logs", "delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { logId } = body;
  if (!logId) return NextResponse.json({ error: "logId required" }, { status: 400 });

  await db.delete(patientLogs).where(eq(patientLogs.id, logId));
  return NextResponse.json({ ok: true });
}
