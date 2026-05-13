import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { patientDocuments, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type RouteParams = { params: Promise<{ id: string }> };

const ALLOWED_EXTENSIONS = new Set([
  "bmp","csv","doc","docx","gif","jpeg","jpg","mov","mp3","mp4","mpg","mpeg",
  "odt","pdf","png","ppt","pptx","rtf","tif","tiff","txt","xls","xlsx","xps","zip",
]);

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const patientId = parseInt(id, 10);

    const rows = await db
      .select({
        id:           patientDocuments.id,
        patientId:    patientDocuments.patientId,
        episodeId:    patientDocuments.episodeId,
        category:     patientDocuments.category,
        displayName:  patientDocuments.displayName,
        originalName: patientDocuments.originalName,
        fileType:     patientDocuments.fileType,
        fileSize:     patientDocuments.fileSize,
        docDate:      patientDocuments.docDate,
        notes:        patientDocuments.notes,
        createdAt:    patientDocuments.createdAt,
        uploaderName: users.name,
      })
      .from(patientDocuments)
      .leftJoin(users, eq(patientDocuments.uploadedById, users.id))
      .where(eq(patientDocuments.patientId, patientId))
      .orderBy(desc(patientDocuments.docDate), desc(patientDocuments.createdAt));

    // Shape to match DocRow type expected by ChartView
    const docs = rows.map(r => ({
      ...r,
      uploadedBy: r.uploaderName ? { name: r.uploaderName } : null,
    }));

    return NextResponse.json(docs);
  } catch (err) {
    console.error("[documents GET]", err);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const patientId = parseInt(id, 10);

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (parseErr) {
      console.error("[documents POST] formData parse failed:", parseErr);
      return NextResponse.json(
        { error: `Could not parse form data: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}` },
        { status: 400 }
      );
    }

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file received" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 50 MB)" }, { status: 413 });
    }

    // Validate by extension (not MIME type — browsers report varying types for same format)
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `File extension ".${ext}" is not allowed` },
        { status: 415 }
      );
    }

    const episodeIdStr = formData.get("episodeId") as string | null;
    const category     = (formData.get("category")    as string | null) ?? "NonCategory";
    const displayName  = ((formData.get("displayName") as string | null) ?? "").trim() || file.name;
    const docDate      = (formData.get("docDate")     as string | null) ?? new Date().toISOString().slice(0, 10);
    const rawNotes     = (formData.get("notes")       as string | null) ?? "";
    const notes        = rawNotes.trim() || null;
    const episodeId    = (episodeIdStr && episodeIdStr.trim() !== "")
      ? parseInt(episodeIdStr, 10)
      : null;

    // Write to disk
    const uuid     = randomUUID();
    const fileName = `${uuid}.${ext}`;
    const dir      = join(process.cwd(), "uploads", "patients", String(patientId));

    await mkdir(dir, { recursive: true });

    const bytes = await file.arrayBuffer();
    await writeFile(join(dir, fileName), Buffer.from(bytes));

    // Insert record
    const [doc] = await db.insert(patientDocuments).values({
      patientId,
      episodeId: episodeId ?? null,
      category,
      displayName,
      fileName,
      originalName: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
      docDate,
      uploadedById: parseInt(session.user.id, 10),
      notes,
    }).returning();

    return NextResponse.json(doc, { status: 201 });

  } catch (err) {
    console.error("[documents POST] unexpected error:", err);
    return NextResponse.json(
      { error: `Upload error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
