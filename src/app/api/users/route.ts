import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

// Minimal user list for billing dropdowns — admin and staff only
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "admin" && role !== "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({ id: users.id, name: users.name, role: users.role, isActive: users.isActive })
    .from(users)
    .where(eq(users.isActive, true))
    .orderBy(asc(users.name));

  return NextResponse.json(rows);
}
