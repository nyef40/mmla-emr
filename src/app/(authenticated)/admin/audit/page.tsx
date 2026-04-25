"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminAuditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "admin")
      router.push("/403");
  }, [status, session, router]);

  if (status === "loading") return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Audit Logs</h1>
      <AppCard title="User / Patient log">
        <p className="text-muted-foreground text-sm mb-3">User and patient activity audit trail.</p>
        <p className="text-sm text-muted-foreground">Coming soon.</p>
      </AppCard>
      <AppCard title="Integration log" className="mt-6">
        <p className="text-muted-foreground text-sm mb-3">External system integration events.</p>
        <p className="text-sm text-muted-foreground">Coming soon.</p>
      </AppCard>
      <Button asChild variant="outline" className="mt-4">
        <Link href="/home">Back to Home</Link>
      </Button>
    </div>
  );
}
