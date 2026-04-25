"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRoleLabel } from "@/lib/role-labels";
import { formsByRole, type RoleKey } from "@/lib/forms";

const ROLES: RoleKey[] = ["pt", "rn", "staff", "admin"];

export default function FormsOverviewPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Agent Menus Overview</h1>
          <p className="text-muted-foreground mt-1">
            Role-based forms: OASIS, Clinical, and Shared
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/home">Back to Home</Link>
        </Button>
      </div>

      <div className="space-y-8">
        {ROLES.map((roleKey) => {
          const sections = formsByRole[roleKey];
          return (
            <section key={roleKey}>
              <h2 className="text-xl font-semibold mb-2">
                {getRoleLabel(roleKey)}
              </h2>
              <hr className="border-border mb-4" />
              <div className="grid grid-cols-3 gap-6">
                <AppCard title="OASIS Forms">
                  <ul className="text-sm space-y-1.5 text-muted-foreground">
                    {sections.oasis.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </AppCard>
                <AppCard title="Clinical Forms">
                  <ul className="text-sm space-y-1.5 text-muted-foreground">
                    {sections.clinical.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </AppCard>
                <AppCard title="Shared Forms">
                  <ul className="text-sm space-y-1.5 text-muted-foreground">
                    {sections.shared.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </AppCard>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
