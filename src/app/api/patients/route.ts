// src/app/api/patients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { patients } from '@/db/schema';
import { eq, ilike, and, or, desc, count, inArray } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth/auth';
import { logAudit } from '@/lib/audit';
import { can } from '@/lib/authorize';
import { auditContext } from '@/lib/api-utils';
import { patientStaffAssignments } from '@/db/schema';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // RN: only see patients explicitly assigned to them
    if (session.user.role === "rn") {
      const assignments = await db
        .select({ patientId: patientStaffAssignments.patientId })
        .from(patientStaffAssignments)
        .where(
          and(
            eq(patientStaffAssignments.staffId, parseInt(session.user.id, 10)),
            eq(patientStaffAssignments.isActive, true)
          )
        );
      const ids = assignments.map(a => a.patientId);
      if (ids.length === 0) {
        return NextResponse.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }
      const rnBase = search
        ? and(
            eq(patients.isActive, true),
            inArray(patients.id, ids),
            or(
              ilike(patients.firstName, `%${search}%`),
              ilike(patients.lastName, `%${search}%`),
              ilike(patients.patientId, `%${search}%`),
              ilike(patients.phone, `%${search}%`)
            )
          )
        : and(eq(patients.isActive, true), inArray(patients.id, ids));
      const data = await db.select().from(patients).where(rnBase).orderBy(desc(patients.createdAt)).limit(limit).offset(offset);
      const total = await db.select({ count: count() }).from(patients).where(and(eq(patients.isActive, true), inArray(patients.id, ids)));
      return NextResponse.json({ data, pagination: { page, limit, total: total[0].count, totalPages: Math.ceil(total[0].count / limit) } });
    }

    const baseClause = search
      ? and(
          eq(patients.isActive, true),
          or(
            ilike(patients.firstName, `%${search}%`),
            ilike(patients.lastName, `%${search}%`),
            ilike(patients.patientId, `%${search}%`),
            ilike(patients.phone, `%${search}%`)
          )
        )
      : eq(patients.isActive, true);
    const ownerClause =
      session.user.role === "pt"
        ? eq(patients.ownerId, parseInt(session.user.id, 10))
        : undefined;
    const whereClause =
      ownerClause ? and(baseClause, ownerClause) : baseClause;

    const data = await db
      .select()
      .from(patients)
      .where(whereClause)
      .orderBy(desc(patients.createdAt))
      .limit(limit)
      .offset(offset);

    const totalWhere = session.user.role === "pt"
      ? and(eq(patients.isActive, true), eq(patients.ownerId, parseInt(session.user.id, 10)))
      : eq(patients.isActive, true);
    const total = await db
      .select({ count: count() })
      .from(patients)
      .where(totalWhere);

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: total[0].count,
        totalPages: Math.ceil(total[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!can(session.user.role, "patients", "create")) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Generate patient ID
    const lastPatient = await db
      .select()
      .from(patients)
      .orderBy(desc(patients.id))
      .limit(1);
    
    const nextId = lastPatient.length > 0 
      ? parseInt(lastPatient[0].patientId?.split('-')[1] || '0') + 1 
      : 1;
    const patientId = `PAT-${nextId.toString().padStart(3, '0')}`;

    const [newPatient] = await db
      .insert(patients)
      .values({
        patientId,
        ownerId: parseInt(session.user.id, 10),
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: new Date(body.dateOfBirth),
        gender: body.gender,
        phone: body.phone ?? null,
        email: body.email ?? null,
        address: body.address ?? null,
        bloodType: body.bloodType ?? null,
        allergies: body.allergies ?? null,
        medicalConditions: body.medicalConditions ?? null,
        medications: body.medications ?? null,
        emergencyContact: body.emergencyContact ?? null,
        notes: body.notes ?? null,
        socDate: body.socDate ?? null,
        admissionStatus: body.admissionStatus ?? "admitted",
        codeStatus: body.codeStatus ?? "full_code",
        primaryDiagnosis: body.primaryDiagnosis ?? null,
        otherDiagnoses: body.otherDiagnoses ?? null,
        insurancePrimary: body.insurancePrimary ?? null,
        insuranceSecondary: body.insuranceSecondary ?? null,
        physicianName: body.physicianName ?? null,
        physicianPhone: body.physicianPhone ?? null,
        physicianNpi: body.physicianNpi ?? null,
        intakeData: body.intakeData ?? null,
      })
      .returning();

    const { ip, userAgent } = auditContext(request);
    await logAudit({
      userId: parseInt(session.user.id, 10),
      action: "create",
      tableName: "patients",
      recordId: newPatient.id,
      details: { patientId: newPatient.patientId, firstName: newPatient.firstName, lastName: newPatient.lastName },
      ip,
      userAgent,
    });

    return NextResponse.json(newPatient, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}