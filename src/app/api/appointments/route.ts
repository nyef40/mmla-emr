// src/app/api/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, patients, users } from "@/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = request.nextUrl.searchParams.get("status") as
      | "scheduled"
      | "confirmed"
      | "completed"
      | "cancelled"
      | "no_show"
      | null;

    const statusCondition = status ? eq(appointments.status, status) : undefined;
    const ownerCondition =
      session.user.role === "pt"
        ? eq(appointments.ownerId, parseInt(session.user.id, 10))
        : undefined;
    const whereCondition =
      statusCondition || ownerCondition
        ? and(statusCondition, ownerCondition)
        : undefined;

    const rows = await db
      .select({
        id: appointments.id,
        appointmentId: appointments.appointmentId,
        patientId: appointments.patientId,
        patientName: patients.firstName,
        patientLastName: patients.lastName,
        doctorId: appointments.doctorId,
        doctorName: users.name,
        appointmentType: appointments.appointmentType,
        status: appointments.status,
        scheduledFor: appointments.scheduledFor,
        duration: appointments.duration,
        reason: appointments.reason,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(users, eq(appointments.doctorId, users.id))
      .where(whereCondition)
      .orderBy(asc(appointments.scheduledFor));

    const data = rows.map((row) => ({
      id: row.id,
      appointmentId: row.appointmentId,
      patientId: row.patientId,
      patientName:
        row.patientName && row.patientLastName
          ? `${row.patientName} ${row.patientLastName}`.trim()
          : undefined,
      doctorId: row.doctorId,
      doctorName: row.doctorName ?? undefined,
      appointmentType: row.appointmentType,
      status: row.status,
      scheduledFor: row.scheduledFor,
      duration: row.duration,
      reason: row.reason,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}
