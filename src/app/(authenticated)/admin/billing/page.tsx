"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminBillingPage() {
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
      <h1 className="text-2xl font-bold mb-6">Billing</h1>
      <AppCard title="Billing">
        <p className="text-muted-foreground mb-4">Billing management coming soon.</p>
        <Button asChild variant="outline">
          <Link href="/home">Back to Home</Link>
        </Button>
      </AppCard>
    </div>
  );
}
