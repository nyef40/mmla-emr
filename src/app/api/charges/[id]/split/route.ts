import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { charges } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { can } from "@/lib/authorize";
import { logAudit } from "@/lib/audit";
import { auditContext } from "@/lib/api-utils";

const WITH_JOINS = {
  patient:   { columns: { id: true, patientId: true, firstName: true, lastName: true } },
  clinician: { columns: { id: true, name: true } },
  visit:     { columns: { id: true, visitType: true, visitDate: true } },
} as const;

function computeVisitTime(fd: unknown): number | null {
  const header = (fd as Record<string, unknown> | null)?.header as Record<string, string> | undefined;
  const timeIn  = header?.timeIn;
  const timeOut = header?.timeOut;
  if (!timeIn || !timeOut) return null;
  const [inH,  inM]  = timeIn.split(":").map(Number);
  const [outH, outM] = timeOut.split(":").map(Number);
  if ([inH, inM, outH, outM].some(isNaN)) return null;
  const minutes = (outH * 60 + outM) - (inH * 60 + inM);
  return minutes > 0 ? minutes / 60 : null;
}

// POST /api/charges/[id]/split
// Splits a single SN Infusion charge into 99601 (first hour) + 99602 (remaining hours).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "charges", "update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const chargeId = parseInt(id, 10);

  const charge = await db.query.charges.findFirst({
    where: eq(charges.id, chargeId),
    with: {
      visit: { columns: { id: true, visitType: true, formData: true } },
    },
  });

  if (!charge) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (charge.claimId) return NextResponse.json({ error: "Cannot split a posted charge" }, { status: 400 });
  if (charge.visit?.visitType !== "SN Infusion") {
    return NextResponse.json({ error: "Split only applies to SN Infusion visits" }, { status: 400 });
  }

  // Guard against double-split
  if (charge.visitId) {
    const companions = await db.query.charges.findMany({
      where: and(eq(charges.visitId, charge.visitId), ne(charges.id, chargeId)),
    });
    if (companions.length > 0) {
      return NextResponse.json({ error: "Companion charge already exists for this visit" }, { status: 409 });
    }
  }

  const totalHours = computeVisitTime(charge.visit?.formData);
  if (!totalHours || totalHours <= 1) {
    return NextResponse.json(
      { error: "Visit duration must be more than 1 hour to split" },
      { status: 400 }
    );
  }

  const additionalHours = +(totalHours - 1).toFixed(2);

  // Update the existing charge → 99602 (additional hours)
  await db.update(charges).set({
    chargeCode: "99602",
    visitTime:  String(additionalHours),
    quantity:   1,
    updatedAt:  new Date(),
  }).where(eq(charges.id, chargeId));

  // Create 99601 companion (first hour)
  const [newRow] = await db.insert(charges).values({
    visitId:     charge.visitId,
    patientId:   charge.patientId,
    clinicianId: charge.clinicianId,
    chargeDate:  charge.chargeDate,
    chargeCode:  "99601",
    quantity:    1,
    visitTime:   "1.00",
    payRate:     charge.payRate,
    verified:    false,
  }).returning();

  const [updated, created] = await Promise.all([
    db.query.charges.findFirst({ where: eq(charges.id, chargeId), with: WITH_JOINS }),
    db.query.charges.findFirst({ where: eq(charges.id, newRow.id), with: WITH_JOINS }),
  ]);

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "update",
    tableName: "charges",
    recordId: chargeId,
    details: { action: "split-sn-infusion", totalHours, additionalHours },
    ip,
    userAgent,
  });

  return NextResponse.json({ primary: created, additional: updated });
}
