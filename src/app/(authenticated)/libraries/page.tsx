"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const libraryCards = [
  { title: "Users", href: "/libraries/users" },
  { title: "Patients", href: "/libraries/patients" },
  { title: "Insurance", href: "/libraries/insurance" },
  { title: "Physician", href: "/libraries/physician" },
  { title: "Referrer", href: "/libraries/referrer" },
  { title: "Pharmacy & DME", href: "/libraries/pharmacy" },
  { title: "Billing Codes", href: "/libraries/billing-codes" },
  { title: "ICD-10 Codes", href: "/libraries/icd-codes" },
];

export default function LibrariesPage() {
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
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Libraries</h1>
        <Button variant="outline" asChild>
          <Link href="/home">Back to Home</Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {libraryCards.map(({ title, href }) => (
          <AppCard key={href} title={title}>
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link href={href}>{title}</Link>
            </Button>
          </AppCard>
        ))}
      </div>
    </div>
  );
}
