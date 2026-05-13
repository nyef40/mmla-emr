import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { patientDocuments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { readFile, unlink } from "fs/promises";
import { join } from "path";

type RouteParams = { params: Promise<{ id: string; docId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, docId } = await params;
  const patientId = parseInt(id, 10);
  const documentId = parseInt(docId, 10);

  const doc = await db.query.patientDocuments.findFirst({
    where: and(
      eq(patientDocuments.id, documentId),
      eq(patientDocuments.patientId, patientId),
    ),
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const filePath = join(process.cwd(), "uploads", "patients", String(patientId), doc.fileName);
  let buffer: Buffer;
  try {
    buffer = await readFile(filePath);
  } catch {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": doc.fileType,
      "Content-Disposition": `inline; filename="${doc.originalName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "admin" && role !== "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, docId } = await params;
  const patientId  = parseInt(id, 10);
  const documentId = parseInt(docId, 10);

  const doc = await db.query.patientDocuments.findFirst({
    where: and(
      eq(patientDocuments.id, documentId),
      eq(patientDocuments.patientId, patientId),
    ),
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete file from disk (best-effort)
  const filePath = join(process.cwd(), "uploads", "patients", String(patientId), doc.fileName);
  try { await unlink(filePath); } catch { /* ignore if already gone */ }

  await db.delete(patientDocuments)
    .where(and(eq(patientDocuments.id, documentId), eq(patientDocuments.patientId, patientId)));

  return NextResponse.json({ ok: true });
}
