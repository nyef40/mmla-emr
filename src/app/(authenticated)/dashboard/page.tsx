"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const reportLinks = [
  { href: "/dashboard/reports/online-activity", label: "View Online Activity" },
  { href: "/dashboard/reports/analytics", label: "Analytics Dashboard" },
  { href: "/dashboard/reports/patient-dashboard", label: "Patient Dashboard" },
  { href: "/dashboard/reports/episode-summary", label: "Episode Summary" },
  { href: "/dashboard/reports/patient-activity", label: "Patient Activity" },
];

const linkClass = "block py-2 text-blue-600 hover:underline focus:outline-none focus:underline";

export default function DashboardPage() {
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
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button variant="outline" asChild>
          <Link href="/home">Back to Home</Link>
        </Button>
      </div>
      <AppCard title="Reports">
        <p className="text-muted-foreground text-sm mb-4">No heavy analytics yet — placeholder routes.</p>
        <nav className="flex flex-col">
          {reportLinks.map(({ href, label }) => (
            <Link key={href} href={href} className={linkClass}>
              {label}
            </Link>
          ))}
        </nav>
      </AppCard>
    </div>
  );
}
