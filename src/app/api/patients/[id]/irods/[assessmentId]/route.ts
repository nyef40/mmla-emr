import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { irodsAssessments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; assessmentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { assessmentId } = await params;
  const id = parseInt(assessmentId, 10);

  const row = await db.query.irodsAssessments.findFirst({
    where: eq(irodsAssessments.id, id),
    with: { completedBy: true },
  });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assessmentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "admin" && role !== "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { assessmentId } = await params;
  const id = parseInt(assessmentId, 10);

  const [deleted] = await db
    .delete(irodsAssessments)
    .where(eq(irodsAssessments.id, id))
    .returning();

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
