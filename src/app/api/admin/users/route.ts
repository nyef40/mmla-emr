// src/app/api/admin/users/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/authorize";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return new Response("Unauthorized", { status: 401 });
  }

  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    isActive: users.isActive,
    lastLoginAt: users.lastLoginAt,
  }).from(users);

  return Response.json(allUsers);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!can(session.user.role, "users", "create")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { email, name, password, role } = await req.json();
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [newUser] = await db.insert(users).values({
      email,
      name,
      password: hashedPassword,
      role,
      isActive: true,
    }).returning();

    await logAudit({
      userId: parseInt(session.user.id, 10),
      action: "create",
      tableName: "users",
      recordId: newUser.id,
      details: { email, role },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return Response.json({ id: newUser.id, email, name, role });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  }
}