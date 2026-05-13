// src/app/api/patients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { patients, patientStaffAssignments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth/auth';
import { logAudit } from '@/lib/audit';
import { can, mustMatchOwner } from '@/lib/authorize';
import { auditContext } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, parseInt(id)),
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    if (!mustMatchOwner(session.user.role, patient.ownerId, session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (session.user.role === "rn") {
      const assignment = await db.query.patientStaffAssignments.findFirst({
        where: and(
          eq(patientStaffAssignments.patientId, patient.id),
          eq(patientStaffAssignments.staffId, parseInt(session.user.id, 10)),
          eq(patientStaffAssignments.isActive, true)
        ),
      });
      if (!assignment) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!can(session.user.role, "patients", "update")) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const recordId = parseInt(id, 10);
    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, recordId),
    });
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    if (!mustMatchOwner(session.user.role, patient.ownerId, session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const b = await request.json();

    // Explicit field mapping — never spread raw request body into Drizzle set()
    // because type coercion (ISO string → timestamp, date string → date) throws at runtime.
    const [updatedPatient] = await db
      .update(patients)
      .set({
        ...(b.firstName !== undefined   && { firstName:   b.firstName }),
        ...(b.lastName !== undefined    && { lastName:    b.lastName }),
        ...(b.dateOfBirth !== undefined && { dateOfBirth: new Date(b.dateOfBirth) }),
        ...(b.gender !== undefined      && { gender:      b.gender }),
        ...(b.phone !== undefined       && { phone:       b.phone ?? null }),
        ...(b.email !== undefined       && { email:       b.email ?? null }),
        ...(b.address !== undefined     && { address:     b.address ?? null }),
        ...(b.bloodType !== undefined   && { bloodType:   b.bloodType ?? null }),
        ...(b.allergies !== undefined   && { allergies:   b.allergies ?? null }),
        ...(b.medications !== undefined && { medications: b.medications ?? null }),
        ...(b.notes !== undefined       && { notes:       b.notes ?? null }),
        ...(b.socDate !== undefined     && { socDate:     b.socDate ?? null }),
        ...(b.admissionStatus !== undefined && { admissionStatus: b.admissionStatus }),
        ...(b.codeStatus !== undefined      && { codeStatus:      b.codeStatus }),
        ...(b.primaryDiagnosis !== undefined   && { primaryDiagnosis:  b.primaryDiagnosis ?? null }),
        ...(b.otherDiagnoses !== undefined     && { otherDiagnoses:    b.otherDiagnoses ?? null }),
        ...(b.insurancePrimary !== undefined   && { insurancePrimary:  b.insurancePrimary ?? null }),
        ...(b.insuranceSecondary !== undefined && { insuranceSecondary: b.insuranceSecondary ?? null }),
        ...(b.physicianName !== undefined  && { physicianName:  b.physicianName ?? null }),
        ...(b.physicianPhone !== undefined && { physicianPhone: b.physicianPhone ?? null }),
        ...(b.physicianNpi !== undefined   && { physicianNpi:   b.physicianNpi ?? null }),
        ...(b.emergencyContact !== undefined && { emergencyContact: b.emergencyContact ?? null }),
        ...(b.intakeData !== undefined       && { intakeData:       b.intakeData ?? null }),
        ...(b.isActive !== undefined         && { isActive:         b.isActive }),
        updatedAt: new Date(),
      })
      .where(eq(patients.id, recordId))
      .returning();

    const { ip, userAgent } = auditContext(request);
    await logAudit({
      userId: parseInt(session.user.id, 10),
      action: "update",
      tableName: "patients",
      recordId,
      details: { changes: b },
      ip,
      userAgent,
    });

    return NextResponse.json(updatedPatient);
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { error: 'Failed to update patient' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!can(session.user.role, "patients", "delete")) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const recordId = parseInt(id, 10);
    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, recordId),
    });
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    if (!mustMatchOwner(session.user.role, patient.ownerId, session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db
      .update(patients)
      .set({ isActive: false })
      .where(eq(patients.id, recordId));

    const { ip, userAgent } = auditContext(request);
    await logAudit({
      userId: parseInt(session.user.id, 10),
      action: "delete",
      tableName: "patients",
      recordId,
      details: { reason: "soft delete" },
      ip,
      userAgent,
    });

    return NextResponse.json({ message: 'Patient deactivated' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { error: 'Failed to delete patient' },
      { status: 500 }
    );
  }
}