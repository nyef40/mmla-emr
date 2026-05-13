import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { charges, patients, visits } from "@/db/schema";
import { eq, and, gte, lte, desc, or, sql, isNull, isNotNull } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/authorize";
import { auditContext } from "@/lib/api-utils";

const WITH_JOINS = {
  patient:   { columns: { id: true, patientId: true, firstName: true, lastName: true } },
  clinician: { columns: { id: true, name: true } },
  visit:     { columns: { id: true, visitType: true, visitDate: true } },
} as const;

function visitDateISO(d: Date | string | null): string | null {
  if (!d) return null;
  if (typeof d === "string") return d.slice(0, 10);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

// Calculate visit duration (decimal hours) from formData.header.timeIn / timeOut
function computeVisitTime(fd: unknown): string | null {
  const header = (fd as Record<string, unknown> | null)?.header as Record<string, string> | undefined;
  const timeIn  = header?.timeIn;
  const timeOut = header?.timeOut;
  if (!timeIn || !timeOut) return null;
  const [inH,  inM]  = timeIn.split(":").map(Number);
  const [outH, outM] = timeOut.split(":").map(Number);
  if ([inH, inM, outH, outM].some(isNaN)) return null;
  const minutes = (outH * 60 + outM) - (inH * 60 + inM);
  if (minutes <= 0) return null;
  return (minutes / 60).toFixed(2);
}

// Map legacy form billing codes to canonical CPT codes
function mapBillingCode(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "";
  if (raw === "IV-IG") return "G0299";
  return raw;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "charges", "read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const patientId   = searchParams.get("patientId");
  const clinicianId = searchParams.get("clinicianId");
  const from        = searchParams.get("from");
  const to          = searchParams.get("to");

  // ── 1. Fetch existing charges ──────────────────────────────────────────────
  const includePosted = searchParams.get("includePosted") === "true";
  const chargeConds = [];
  if (patientId)   chargeConds.push(eq(charges.patientId,   parseInt(patientId, 10)));
  if (clinicianId) chargeConds.push(eq(charges.clinicianId, parseInt(clinicianId, 10)));
  if (from)        chargeConds.push(gte(charges.chargeDate, from));
  if (to)          chargeConds.push(lte(charges.chargeDate, to));
  // By default only show unposted charges (no claim_id); posted charges live in Claims
  if (!includePosted) chargeConds.push(isNull(charges.claimId));

  const existing = await db.query.charges.findMany({
    where: chargeConds.length > 0 ? and(...chargeConds) : undefined,
    orderBy: desc(charges.chargeDate),
    with: WITH_JOINS,
  });

  // ── 2. Fetch signed/completed visits in range (includes formData) ──────────
  const visitConds: ReturnType<typeof eq>[] = [
    or(eq(visits.formStatus, "signed"), eq(visits.formStatus, "completed"))!,
  ];
  if (from) visitConds.push(sql`(${visits.visitDate} AT TIME ZONE 'UTC')::date >= ${from}::date` as ReturnType<typeof eq>);
  if (to)   visitConds.push(sql`(${visits.visitDate} AT TIME ZONE 'UTC')::date <= ${to}::date` as ReturnType<typeof eq>);
  if (patientId)   visitConds.push(eq(visits.patientId,   parseInt(patientId, 10)));
  if (clinicianId) visitConds.push(eq(visits.clinicianId, parseInt(clinicianId, 10)));

  const signedVisits = await db.query.visits.findMany({
    where: and(...visitConds),
    with: {
      patient:   { columns: { id: true, patientId: true, firstName: true, lastName: true } },
      clinician: { columns: { id: true, name: true } },
    },
  });

  const visitMap = new Map(signedVisits.map(v => [v.id, v]));

  // ── 3. Retroactively fill visitTime / fix chargeCode on existing charges ───
  for (const charge of existing) {
    if (!charge.visitId || charge.visitTime) continue; // skip if no visit link or already has time
    const visit = visitMap.get(charge.visitId);
    if (!visit) continue;
    const fd = visit.formData as unknown;
    const visitTime  = computeVisitTime(fd);
    const mappedCode = mapBillingCode((fd as Record<string, unknown> | null)?.header &&
      ((fd as Record<string, unknown>).header as Record<string, unknown>).billingCode);
    const newCode = mappedCode || charge.chargeCode;
    if (!visitTime && newCode === charge.chargeCode) continue;
    await db.update(charges).set({
      ...(visitTime ? { visitTime } : {}),
      ...(newCode !== charge.chargeCode ? { chargeCode: newCode } : {}),
      updatedAt: new Date(),
    }).where(eq(charges.id, charge.id));
    // Mutate local copy so the response reflects updated values
    if (visitTime) (charge as Record<string, unknown>).visitTime = visitTime;
    if (newCode !== charge.chargeCode) (charge as Record<string, unknown>).chargeCode = newCode;
  }

  // ── 4. Auto-import signed/completed visits not yet in charges ──────────────
  // coveredVisitIds must include ALL charges (posted or unposted, including those
  // released from voided claims) so we never create a second charge for a visit.
  const allChargeVisitRows = await db
    .select({ visitId: charges.visitId })
    .from(charges)
    .where(isNotNull(charges.visitId));
  const coveredVisitIds = new Set([
    ...existing.map(c => c.visitId).filter(Boolean),
    ...allChargeVisitRows.map(r => r.visitId).filter(Boolean),
  ]);
  const uncovered = signedVisits.filter(v => !coveredVisitIds.has(v.id));

  const autoCreated = [];
  for (const visit of uncovered) {
    const chargeDate = visitDateISO(visit.visitDate as Date | string | null);
    if (!chargeDate) continue;

    const fd = visit.formData as unknown;
    const visitTime = computeVisitTime(fd);

    if (visit.visitType === "SN Infusion" && visitTime) {
      // SN Infusion requires two lines: 99601 (first hour) + 99602 (additional hours)
      const totalHours = parseFloat(visitTime);
      const additionalHours = Math.max(0, +(totalHours - 1).toFixed(2));

      const [row1] = await db.insert(charges).values({
        visitId:     visit.id,
        patientId:   visit.patientId,
        clinicianId: visit.clinicianId ?? null,
        chargeDate,
        chargeCode:  "99601",
        quantity:    1,
        visitTime:   "1.00",
        verified:    false,
      }).returning();
      const full1 = await db.query.charges.findFirst({ where: eq(charges.id, row1.id), with: WITH_JOINS });
      if (full1) autoCreated.push(full1);

      if (additionalHours > 0) {
        const [row2] = await db.insert(charges).values({
          visitId:     visit.id,
          patientId:   visit.patientId,
          clinicianId: visit.clinicianId ?? null,
          chargeDate,
          chargeCode:  "99602",
          quantity:    1,
          visitTime:   String(additionalHours),
          verified:    false,
        }).returning();
        const full2 = await db.query.charges.findFirst({ where: eq(charges.id, row2.id), with: WITH_JOINS });
        if (full2) autoCreated.push(full2);
      }
    } else {
      const mappedCode = mapBillingCode((fd as Record<string, unknown> | null)?.header &&
        ((fd as Record<string, unknown>).header as Record<string, unknown>).billingCode);
      const chargeCode = mappedCode || "99601";

      const [row] = await db.insert(charges).values({
        visitId:     visit.id,
        patientId:   visit.patientId,
        clinicianId: visit.clinicianId ?? null,
        chargeDate,
        chargeCode,
        quantity:    1,
        visitTime:   visitTime ?? undefined,
        verified:    false,
      }).returning();

      const full = await db.query.charges.findFirst({
        where: eq(charges.id, row.id),
        with: WITH_JOINS,
      });
      if (full) autoCreated.push(full);
    }
  }

  const all = [...existing, ...autoCreated].sort((a, b) =>
    b.chargeDate.localeCompare(a.chargeDate)
  );

  return NextResponse.json(all, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "charges", "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { patientId, clinicianId, visitId, chargeDate, chargeCode, quantity, visitTime, miles, payRate, notes } = body;

  if (!patientId)  return NextResponse.json({ error: "patientId is required" },  { status: 400 });
  if (!chargeDate) return NextResponse.json({ error: "chargeDate is required" }, { status: 400 });
  if (!chargeCode) return NextResponse.json({ error: "chargeCode is required" }, { status: 400 });

  const patient = await db.query.patients.findFirst({ where: eq(patients.id, patientId) });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  // Extract visitTime from linked visit's formData if not provided
  let resolvedVisitTime = visitTime != null ? String(visitTime) : null;
  if (visitId && resolvedVisitTime === null) {
    const visit = await db.query.visits.findFirst({ where: eq(visits.id, visitId) });
    resolvedVisitTime = computeVisitTime(visit?.formData);
  }

  const [charge] = await db.insert(charges).values({
    patientId,
    clinicianId: clinicianId ?? null,
    visitId:     visitId ?? null,
    chargeDate,
    chargeCode,
    quantity:    quantity ?? 1,
    visitTime:   resolvedVisitTime ?? undefined,
    miles:       miles != null ? String(miles) : undefined,
    payRate:     payRate ?? null,
    verified:    false,
    notes:       notes ?? null,
  }).returning();

  const full = await db.query.charges.findFirst({
    where: eq(charges.id, charge.id),
    with: WITH_JOINS,
  });

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "create",
    tableName: "charges",
    recordId: charge.id,
    details: { patientId, chargeCode, chargeDate },
    ip,
    userAgent,
  });

  return NextResponse.json(full, { status: 201 });
}
