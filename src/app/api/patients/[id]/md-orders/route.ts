import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mdOrders, patients } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
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

  const rows = await db.query.mdOrders.findMany({
    where: eq(mdOrders.patientId, patientId),
    orderBy: desc(mdOrders.createdAt),
    with: { createdBy: true, signedBy: true },
  });

  return NextResponse.json(rows);
}

export async function POST(
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
  const patient = await db.query.patients.findFirst({ where: eq(patients.id, patientId) });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const b = await request.json();
  const createdById = parseInt(session.user.id, 10);

  const isSendingToMd = b.status === "sent_to_md";

  const [order] = await db
    .insert(mdOrders)
    .values({
      patientId,
      createdById,
      orderType: b.orderType ?? "verbal",
      verbalReceivedBy: b.verbalReceivedBy?.trim() || null,
      verbalReceivedFrom: b.verbalReceivedFrom?.trim() || null,
      verbalReadBack: Boolean(b.verbalReadBack),
      dateReceived: b.dateReceived || null,
      timeReceived: b.timeReceived?.trim() || null,
      effectiveDate: b.effectiveDate || null,
      clinicalNotes: b.clinicalNotes?.trim() || null,
      visitFrequency: b.visitFrequency ?? [],
      interventions: b.interventions?.trim() || null,
      infusionInterventions: b.infusionInterventions?.trim() || null,
      status: isSendingToMd ? "sent_to_md" : "draft",
      signedById: isSendingToMd ? createdById : null,
      signedAt: isSendingToMd ? new Date() : null,
    })
    .returning();

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: createdById,
    action: "create",
    tableName: "md_orders",
    recordId: order.id,
    details: { patientId, status: order.status },
    ip,
    userAgent,
  });

  return NextResponse.json(order, { status: 201 });
}
