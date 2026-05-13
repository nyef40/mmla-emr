import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/authorize";
import { auditContext } from "@/lib/api-utils";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    isActive: users.isActive,
    phone: users.phone,
    jobTitle: users.jobTitle,
    onCall: users.onCall,
    lastLoginAt: users.lastLoginAt,
  }).from(users).orderBy(users.name);

  return NextResponse.json(allUsers);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!can(session.user.role, "users", "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { email, name, password, role, phone, jobTitle } = await req.json();

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db.insert(users).values({
      email,
      name: name ?? null,
      password: hashedPassword,
      role,
      isActive: true,
      phone: phone ?? null,
      jobTitle: jobTitle ?? null,
    }).returning();

    const { ip, userAgent } = auditContext(req);
    await logAudit({
      userId: parseInt(session.user.id, 10),
      action: "create",
      tableName: "users",
      recordId: newUser.id,
      details: { email, role },
      ip,
      userAgent,
    });

    return NextResponse.json({ id: newUser.id, email, name, role });
  } catch {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
