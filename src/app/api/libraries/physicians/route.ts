import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { physicians } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { auditContext } from "@/lib/api-utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.query.physicians.findMany({
    orderBy: asc(physicians.lastName),
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
  const { firstName, lastName } = body;

  if (!firstName?.trim() || !lastName?.trim()) {
    return NextResponse.json({ error: "First Name and Last Name are required" }, { status: 400 });
  }

  const [row] = await db
    .insert(physicians)
    .values({
      firstName: firstName.trim(),
      middleName: body.middleName?.trim() || null,
      lastName: lastName.trim(),
      title: body.title?.trim() || null,
      street: body.street?.trim() || null,
      suite: body.suite?.trim() || null,
      city: body.city?.trim() || null,
      state: body.state?.trim() || "CA",
      zipCode: body.zipCode?.trim() || null,
      phone: body.phone?.trim() || null,
      fax: body.fax?.trim() || null,
      email: body.email?.trim() || null,
      upin: body.upin?.trim() || null,
      npi: body.npi?.trim() || null,
      pecosStatus: body.pecosStatus ?? "Unknown",
      partB: body.partB === true,
      dme: body.dme === true,
      hha: body.hha === true,
      pmd: body.pmd === true,
      hospice: body.hospice === true,
      lastChecked: body.lastChecked || null,
      protocol: body.protocol?.trim() || null,
      licenseNumber: body.licenseNumber?.trim() || null,
      licenseState: body.licenseState?.trim() || "CA",
      licenseExpiration: body.licenseExpiration || null,
      externalId: body.externalId?.trim() || null,
      agencyId: body.agencyId?.trim() || null,
      physicianType: body.physicianType || null,
    })
    .returning();

  const [withCode] = await db
    .update(physicians)
    .set({ code: String(80000 + row.id) })
    .where(eq(physicians.id, row.id))
    .returning();

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "create",
    tableName: "physicians",
    recordId: row.id,
    details: { firstName: row.firstName, lastName: row.lastName },
    ip,
    userAgent,
  });

  return NextResponse.json(withCode, { status: 201 });
}
