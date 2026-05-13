import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pharmacies } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { auditContext } from "@/lib/api-utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.query.pharmacies.findMany({
    orderBy: asc(pharmacies.name),
  });

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  const body = await request.json();
  const { name, vendorType, street, city, state, zipCode, phone, fax } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const [row] = await db
    .insert(pharmacies)
    .values({
      name: name.trim(),
      vendorType: vendorType ?? "Both",
      street: street?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || "CA",
      zipCode: zipCode?.trim() || null,
      phone: phone?.trim() || null,
      fax: fax?.trim() || null,
    })
    .returning();

  const [withCode] = await db
    .update(pharmacies)
    .set({ code: String(50000 + row.id) })
    .where(eq(pharmacies.id, row.id))
    .returning();

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "create",
    tableName: "pharmacies",
    recordId: row.id,
    details: { name: row.name },
    ip,
    userAgent,
  });

  return NextResponse.json(withCode, { status: 201 });
}
