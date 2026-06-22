import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { can, Role } from "@/lib/authorize";
import { isPrimaryAdmin } from "@/lib/admin";
import { auditContext } from "@/lib/api-utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!can(session.user.role, "users", "update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await req.json();
    const validRoles: readonly Role[] = ["admin", "staff", "rn", "pt"];
    const updates: { isActive?: boolean; role?: Role; name?: string; phone?: string; jobTitle?: string; onCall?: boolean } = {};
    if (typeof body.isActive === "boolean") updates.isActive = body.isActive;
    if (typeof body.role === "string" && (validRoles as readonly string[]).includes(body.role)) updates.role = body.role as Role;
    if (typeof body.name === "string") updates.name = body.name;
    if (typeof body.phone === "string") updates.phone = body.phone;
    if (typeof body.jobTitle === "string") updates.jobTitle = body.jobTitle;
    if (typeof body.onCall === "boolean") updates.onCall = body.onCall;

    const primary = isPrimaryAdmin(session.user.email);
    const restrictedFields = ["isActive", "name", "phone", "jobTitle"] as const;
    const hasRestricted = restrictedFields.some((f) => f in updates);
    if (hasRestricted && !primary) {
      return NextResponse.json(
        { error: "Only the primary administrator can activate/deactivate or edit user profiles." },
        { status: 403 }
      );
    }

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
