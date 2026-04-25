"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { AppCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const slugLabels: Record<string, string> = {
  "online-activity": "View Online Activity",
  analytics: "Analytics Dashboard",
  "patient-dashboard": "Patient Dashboard",
  "episode-summary": "Episode Summary",
  "patient-activity": "Patient Activity",
};

export default function ReportSlugPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const title = slugLabels[slug] ?? slug;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Button variant="outline" asChild>
          <Link href="/home">Back to Home</Link>
        </Button>
      </div>
      <AppCard title={title}>
        <p className="text-muted-foreground mb-4">Report placeholder. No heavy analytics yet.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </AppCard>
    </div>
  );
}
