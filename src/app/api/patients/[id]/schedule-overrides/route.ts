import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { scheduleOverrides } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const patientId = parseInt(id, 10);

  const rows = await db
    .select()
    .from(scheduleOverrides)
    .where(eq(scheduleOverrides.patientId, patientId));

  return NextResponse.json(rows);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "admin" && role !== "staff" && role !== "rn") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const patientId = parseInt(id, 10);
  const { discipline, weekStart, dayIndices } = await request.json();

  if (!discipline || !weekStart || !Array.isArray(dayIndices)) {
    return NextResponse.json({ error: "discipline, weekStart, dayIndices required" }, { status: 400 });
  }

  const [row] = await db
    .insert(scheduleOverrides)
    .values({ patientId, discipline, weekStart, dayIndices, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [scheduleOverrides.patientId, scheduleOverrides.discipline, scheduleOverrides.weekStart],
      set: { dayIndices, updatedAt: new Date() },
    })
    .returning();

  return NextResponse.json(row);
}
