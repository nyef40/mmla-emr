import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { episodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { auditContext } from "@/lib/api-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; episodeId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "admin" && role !== "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { episodeId } = await params;
  const id = parseInt(episodeId, 10);
  const b = await request.json();

  const setClause: Partial<typeof episodes.$inferInsert> & { updatedAt: Date } = { updatedAt: new Date() };

  if (b.episodeNumber !== undefined) setClause.episodeNumber = b.episodeNumber;
  if (b.chartNumber   !== undefined) setClause.chartNumber   = b.chartNumber?.trim() || null;
  if (b.startDate     !== undefined) setClause.startDate     = b.startDate;
  if (b.endDate       !== undefined) setClause.endDate       = b.endDate;
  if (b.actualEnd     !== undefined) setClause.actualEnd     = b.actualEnd || null;
  if (b.fbvAccrual    !== undefined) setClause.fbvAccrual    = b.fbvAccrual || null;
  if (b.finalBill     !== undefined) setClause.finalBill     = b.finalBill || null;
  if (b.held          !== undefined) setClause.held          = Boolean(b.held);
  if (b.pep           !== undefined) setClause.pep           = Boolean(b.pep);
  if (b.hippsFlag     !== undefined) setClause.hippsFlag     = Boolean(b.hippsFlag);
  if (b.medicaid      !== undefined) setClause.medicaid      = Boolean(b.medicaid);
  if (b.docStatus     !== undefined) setClause.docStatus     = b.docStatus;
  if (b.admitNumber   !== undefined) setClause.admitNumber   = b.admitNumber?.trim() || null;
  if (b.isActive      !== undefined) setClause.isActive      = Boolean(b.isActive);

  const [updated] = await db
    .update(episodes)
    .set(setClause)
    .where(eq(episodes.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "update",
    tableName: "episodes",
    recordId: id,
    details: { changes: b },
    ip,
    userAgent,
  });

  return NextResponse.json(updated);
}
