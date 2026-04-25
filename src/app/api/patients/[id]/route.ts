// src/app/api/patients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { patients } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth/auth';
import { logAudit } from '@/lib/audit';
import { can, mustMatchOwner } from '@/lib/authorize';

function auditContext(req: NextRequest) {
  return {
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, parseInt(params.id)),
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    if (!mustMatchOwner(session.user.role, patient.ownerId, session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!can(session.user.role, "patients", "update")) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const recordId = parseInt(params.id, 10);
    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, recordId),
    });
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    if (!mustMatchOwner(session.user.role, patient.ownerId, session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const [updatedPatient] = await db
      .update(patients)
      .set({
        ...body,
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
      details: { changes: body },
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!can(session.user.role, "patients", "delete")) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const recordId = parseInt(params.id, 10);
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