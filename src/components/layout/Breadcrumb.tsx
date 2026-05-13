"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const routeLabels: Record<string, string> = {
  home: "Home",
  dashboard: "Dashboard",
  patients: "Patients",
  chart: "Patient Chart",
  appointments: "Appointments",
  admin: "Admin",
  users: "User Management",
  new: "New User",
  libraries: "Libraries",
  billing: "Billing",
  claims: "Claims",
  charges: "Charge Load",
  "pre-audit": "Pre-Audit",
  payroll: "Payroll",
};

export function Breadcrumb({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((segment, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = routeLabels[segment] ?? segment;
    const isLast = i === segments.length - 1;
    return { href, label, isLast };
  });

  if (crumbs.length === 0) return null;

  return (
    <nav className={`flex items-center gap-1 text-sm ${className ?? "text-muted-foreground"}`}>
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
          {crumb.isLast ? (
            <span className="font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="cursor-pointer opacity-80 hover:opacity-100">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
