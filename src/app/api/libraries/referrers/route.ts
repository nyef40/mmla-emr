import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { referrers } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { auditContext } from "@/lib/api-utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.query.referrers.findMany({
    orderBy: asc(referrers.lastName),
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
  const { firstName, lastName, companyName, title, street, suite, city, state, zipCode, phone, fax, email, externalId, protocol } = body;

  if (!firstName?.trim() || !lastName?.trim()) {
    return NextResponse.json({ error: "First and last name are required" }, { status: 400 });
  }

  const [row] = await db
    .insert(referrers)
    .values({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      companyName: companyName?.trim() || null,
      title: title?.trim() || null,
      street: street?.trim() || null,
      suite: suite?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || "CA",
      zipCode: zipCode?.trim() || null,
      phone: phone?.trim() || null,
      fax: fax?.trim() || null,
      email: email?.trim() || null,
      externalId: externalId?.trim() || null,
      protocol: protocol?.trim() || null,
    })
    .returning();

  const [withCode] = await db
    .update(referrers)
    .set({ code: String(70000 + row.id) })
    .where(eq(referrers.id, row.id))
    .returning();

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "create",
    tableName: "referrers",
    recordId: row.id,
    details: { name: `${row.firstName} ${row.lastName}` },
    ip,
    userAgent,
  });

  return NextResponse.json(withCode, { status: 201 });
}
