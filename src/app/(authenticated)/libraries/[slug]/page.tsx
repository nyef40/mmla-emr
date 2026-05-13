"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { AppCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Slugs that have their own dedicated pages — redirect immediately
const REDIRECTS: Record<string, string> = {
  users:           "/admin/users",
  patients:        "/patients",
  "billing-codes": "/libraries/billing-codes",
  pharmacy:        "/libraries/pharmacy",
  insurance:       "/libraries/insurance",
  physician:       "/libraries/physician",
  referrer:        "/libraries/referrer",
  "icd-codes":     "/libraries/icd-codes",
  "dme-supply":    "/libraries/pharmacy",
};

const slugLabels: Record<string, string> = {
  insurance:  "Insurance",
  physician:  "Physician",
  referrer:   "Referrer",
  pharmacy:   "Pharmacy",
  "dme-supply": "DME / Supply",
};

export default function LibrarySlugPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    const dest = REDIRECTS[slug];
    if (dest) router.replace(dest);
  }, [status, slug, router]);

  if (status === "loading" || REDIRECTS[slug]) return null;

  const title = slugLabels[slug] ?? slug;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Button variant="outline" asChild>
          <Link href="/libraries">Back to Libraries</Link>
        </Button>
      </div>
      <AppCard title={title}>
        <p className="text-muted-foreground mb-4">Library module coming soon.</p>
        <Button asChild variant="outline">
          <Link href="/libraries">Back to Libraries</Link>
        </Button>
      </AppCard>
    </div>
  );
}
