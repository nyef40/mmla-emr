// src/app/api/patients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { patients } from '@/db/schema';
import { eq, ilike, and, desc, count } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth/auth';
import { logAudit } from '@/lib/audit';
import { can } from '@/lib/authorize';

function auditContext(req: NextRequest) {
  return {
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  };
}

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

    // Use 'or' to combine search conditions safely
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { or } = require('drizzle-orm');

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
        ...body,
        patientId,
        ownerId: parseInt(session.user.id, 10),
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