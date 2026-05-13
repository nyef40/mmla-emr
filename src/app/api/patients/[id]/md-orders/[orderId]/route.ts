import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mdOrders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { auditContext } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const id = parseInt(orderId, 10);

  const order = await db.query.mdOrders.findFirst({
    where: eq(mdOrders.id, id),
    with: { createdBy: true, signedBy: true },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const id = parseInt(orderId, 10);
  const b = await request.json();

  const existing = await db.query.mdOrders.findFirst({ where: eq(mdOrders.id, id) });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Status-only update (admin marking as signed/expired)
  if (b.status !== undefined && Object.keys(b).length === 1) {
    const [updated] = await db
      .update(mdOrders)
      .set({ status: b.status, updatedAt: new Date() })
      .where(eq(mdOrders.id, id))
      .returning();

    const { ip, userAgent } = auditContext(request);
    await logAudit({
      userId: parseInt(session.user.id, 10),
      action: "update",
      tableName: "md_orders",
      recordId: id,
      details: { status: b.status },
      ip,
      userAgent,
    });

    return NextResponse.json(updated);
  }

  // Full edit (draft orders only)
  if (existing.status !== "draft") {
    return NextResponse.json({ error: "Only draft orders can be edited" }, { status: 400 });
  }

  const userId = parseInt(session.user.id, 10);
  const isSendingToMd = b.status === "sent_to_md";

  const setClause: Partial<typeof mdOrders.$inferInsert> & { updatedAt: Date } = {
    updatedAt: new Date(),
  };

  if (b.orderType !== undefined)              setClause.orderType = b.orderType;
  if (b.verbalReceivedBy !== undefined)       setClause.verbalReceivedBy = b.verbalReceivedBy?.trim() || null;
  if (b.verbalReceivedFrom !== undefined)     setClause.verbalReceivedFrom = b.verbalReceivedFrom?.trim() || null;
  if (b.verbalReadBack !== undefined)         setClause.verbalReadBack = Boolean(b.verbalReadBack);
  if (b.dateReceived !== undefined)           setClause.dateReceived = b.dateReceived || null;
  if (b.timeReceived !== undefined)           setClause.timeReceived = b.timeReceived?.trim() || null;
  if (b.effectiveDate !== undefined)          setClause.effectiveDate = b.effectiveDate || null;
  if (b.clinicalNotes !== undefined)          setClause.clinicalNotes = b.clinicalNotes?.trim() || null;
  if (b.visitFrequency !== undefined)         setClause.visitFrequency = b.visitFrequency;
  if (b.interventions !== undefined)          setClause.interventions = b.interventions?.trim() || null;
  if (b.infusionInterventions !== undefined)  setClause.infusionInterventions = b.infusionInterventions?.trim() || null;

  if (isSendingToMd) {
    setClause.status = "sent_to_md";
    setClause.signedById = userId;
    setClause.signedAt = new Date();
  } else if (b.status !== undefined) {
    setClause.status = b.status;
  }

  const [updated] = await db
    .update(mdOrders)
    .set(setClause)
    .where(eq(mdOrders.id, id))
    .returning();

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId,
    action: "update",
    tableName: "md_orders",
    recordId: id,
    details: { changes: b },
    ip,
    userAgent,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "admin" && role !== "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderId } = await params;
  const id = parseInt(orderId, 10);

  const [deleted] = await db
    .delete(mdOrders)
    .where(eq(mdOrders.id, id))
    .returning();

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "delete",
    tableName: "md_orders",
    recordId: id,
    details: {},
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
