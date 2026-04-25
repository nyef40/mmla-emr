import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/authorize";

function auditContext(req: NextRequest) {
  return {
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!can(session.user.role, "users", "update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = parseInt(params.id, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await req.json();
    const allowedRoles = ["admin", "staff", "rn", "pt"] as const;
    type UserRole = (typeof allowedRoles)[number];
    const updates: { isActive?: boolean; role?: UserRole; name?: string } = {};
    if (typeof body.isActive === "boolean") updates.isActive = body.isActive;
    if (typeof body.role === "string" && allowedRoles.includes(body.role as UserRole)) updates.role = body.role as UserRole;
    if (typeof body.name === "string") updates.name = body.name;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { ip, userAgent } = auditContext(req);
    await logAudit({
      userId: parseInt(session.user.id, 10),
      action: "update",
      tableName: "users",
      recordId: id,
      details: updates,
      ip,
      userAgent,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
