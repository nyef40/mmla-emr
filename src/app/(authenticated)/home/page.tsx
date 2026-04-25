"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingTasks: number;
}

type Role = "admin" | "staff" | "rn" | "pt";

const adminLinkClass =
  "block py-2 text-blue-600 hover:underline focus:outline-none focus:underline";

const sharedFormLinks = [
  { label: "Care Coordination Note", href: "/admin/forms-overview#shared-care-coordination" },
  { label: "Inter-Office Communication Note", href: "/admin/forms-overview#shared-interoffice" },
  { label: "Medication Profile", href: "/admin/forms-overview#shared-medication" },
];

const officeFormLinks = [
  { label: "Visit Note", href: "/admin/forms-overview#office-visit" },
  { label: "Assessment", href: "/admin/forms-overview#office-assessment" },
  { label: "Care Plan", href: "/admin/forms-overview#office-care-plan" },
];

const physicianFormLinks = [
  { label: "Physician Order", href: "/admin/forms-overview#physician-order" },
  { label: "Face to Face", href: "/admin/forms-overview#physician-f2f" },
  { label: "Certification", href: "/admin/forms-overview#physician-cert" },
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todayAppointments: 0,
    pendingTasks: 0,
  });
  const [patients, setPatients] = useState<{ id: number; patientId: string; firstName: string; lastName: string }[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return;
        const data = await res.json();
        setStats(data);
      } catch {
        // ignore
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch("/api/patients?limit=500");
        if (!res.ok) return;
        const data = await res.json();
        setPatients(data.data ?? []);
      } catch {
        // ignore
      }
    };
    fetchPatients();
  }, []);

  const role = (session?.user?.role ?? "staff") as Role;
  const isAdmin = role === "admin";
  const isPt = role === "pt";

  const handlePatientGo = () => {
    if (selectedPatientId) router.push(`/patients/${selectedPatientId}`);
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: 4 equal cards in 2x2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {isAdmin && (
            <AppCard title="Administrative">
              <nav className="flex flex-col text-sm">
                <span className="font-medium text-muted-foreground pt-1 pb-1">Billing</span>
                <Link href="/admin/billing" className={adminLinkClass}>
                  Billing module
                </Link>
                <span className="font-medium text-muted-foreground pt-3 pb-1">Audit logs</span>
                <Link href="/admin/audit" className={adminLinkClass}>
                  User / Patient log
                </Link>
                <Link href="/admin/audit" className={adminLinkClass}>
                  Integration log
                </Link>
                <span className="font-medium text-muted-foreground pt-3 pb-1">Other Administrative</span>
                <Link href="/admin/upload" className={adminLinkClass}>
                  Upload documents
                </Link>
                <Link href="/admin/forms-overview" className={adminLinkClass}>
                  Menus Overview
                </Link>
              </nav>
            </AppCard>
          )}

          {!isPt && (
            <AppCard title="Dashboard">
              <nav className="flex flex-col gap-1">
                <Link href="/dashboard/reports/online-activity" className={adminLinkClass}>View Online Activity</Link>
                <Link href="/dashboard/reports/analytics" className={adminLinkClass}>Analytics Dashboard</Link>
                <Link href="/dashboard/reports/patient-dashboard" className={adminLinkClass}>Patient Dashboard</Link>
                <Link href="/dashboard/reports/episode-summary" className={adminLinkClass}>Episode Summary</Link>
                <Link href="/dashboard/reports/patient-activity" className={adminLinkClass}>Patient Activity</Link>
              </nav>
            </AppCard>
          )}

          {!isPt && (
            <AppCard title="Libraries">
              <nav className="flex flex-col gap-1">
                <Link href="/libraries/users" className={adminLinkClass}>Users</Link>
                <Link href="/libraries/patients" className={adminLinkClass}>Patients</Link>
                <Link href="/libraries/insurance" className={adminLinkClass}>Insurance</Link>
                <Link href="/libraries/physician" className={adminLinkClass}>Physician</Link>
                <Link href="/libraries/referrer" className={adminLinkClass}>Referrer</Link>
                <Link href="/libraries/pharmacy" className={adminLinkClass}>Pharmacy</Link>
                <Link href="/libraries/dme-supply" className={adminLinkClass}>DME/Supply</Link>
                <Link href="/libraries/billing-codes" className={adminLinkClass}>Billing Codes</Link>
              </nav>
            </AppCard>
          )}

          {!isPt && (
            <AppCard title="Custom Reports">
              <nav className="flex flex-col gap-1">
                <Link href="/dashboard/reports/online-activity" className={adminLinkClass}>View Online Activity</Link>
                <Link href="/dashboard/reports/analytics" className={adminLinkClass}>Analytics Dashboard</Link>
                <Link href="/dashboard/reports/patient-dashboard" className={adminLinkClass}>Patient Dashboard</Link>
                <Link href="/dashboard/reports/episode-summary" className={adminLinkClass}>Episode Summary</Link>
                <Link href="/dashboard/reports/patient-activity" className={adminLinkClass}>Patient Activity</Link>
              </nav>
            </AppCard>
          )}

          {isPt && (
            <AppCard title="Forms">
              <p className="text-muted-foreground text-sm mb-3">OASIS, clinical and shared forms</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/forms-overview">Menus Overview</Link>
              </Button>
            </AppCard>
          )}
        </div>

        {/* Right: Patients big card */}
        <div className="flex flex-col">
          <AppCard
            title="Patients"
            titleAction={
              <Button asChild size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/40 shrink-0">
                <Link href="/patients/new">New Patient</Link>
              </Button>
            }
            className="flex-1 min-h-[280px]"
          >
            <p className="text-muted-foreground text-sm mb-3">
              Select an existing patient, then click a link (or click &quot;New Patient&quot;).
            </p>
            <div className="flex gap-2 mb-4">
              <select
                className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                <option value="">Enter patient name or MR# to search</option>
                {patients.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.patientId} {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handlePatientGo}
                disabled={!selectedPatientId}
              >
                Go
              </Button>
            </div>
            {/* Patient links right below dropdown, 2 columns */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-6">
              <Link href={selectedPatientId ? `/patients/${selectedPatientId}` : "#"} className={adminLinkClass} style={{ pointerEvents: selectedPatientId ? "auto" : "none" }}>Patient profile</Link>
              <Link href={selectedPatientId ? `/patients/${selectedPatientId}` : "#"} className={adminLinkClass} style={{ pointerEvents: selectedPatientId ? "auto" : "none" }}>Patient chart</Link>
              <Link href={selectedPatientId ? `/patients/${selectedPatientId}/assign-staff` : "#"} className={adminLinkClass} style={{ pointerEvents: selectedPatientId ? "auto" : "none" }}>Assign staff to patient</Link>
              <Link href={selectedPatientId ? `/patients/${selectedPatientId}/chart/new` : "#"} className={adminLinkClass} style={{ pointerEvents: selectedPatientId ? "auto" : "none" }}>Create a new chart</Link>
              <Link href={selectedPatientId ? `/patients/${selectedPatientId}/schedule` : "#"} className={adminLinkClass} style={{ pointerEvents: selectedPatientId ? "auto" : "none" }}>Patient schedule</Link>
              <Link href={selectedPatientId ? `/patients/${selectedPatientId}/mar` : "#"} className={adminLinkClass} style={{ pointerEvents: selectedPatientId ? "auto" : "none" }}>Patient MAR</Link>
            </div>

            {/* Other 3 sections in 2 columns total */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Shared Forms</h3>
                <div className="flex flex-col gap-y-1">
                  {sharedFormLinks.map(({ label, href }) => (
                    <Link key={href} href={href} className={adminLinkClass}>{label}</Link>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Office Forms</h3>
                <div className="flex flex-col gap-y-1">
                  {officeFormLinks.map(({ label, href }) => (
                    <Link key={href} href={href} className={adminLinkClass}>{label}</Link>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Physician Forms</h3>
                <div className="flex flex-col gap-y-1">
                  {physicianFormLinks.map(({ label, href }) => (
                    <Link key={href} href={href} className={adminLinkClass}>{label}</Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stats.totalPatients} active patients</span>
              <Button asChild size="sm">
                <Link href="/patients" className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Patient Management
                </Link>
              </Button>
            </div>
          </AppCard>
        </div>
      </div>
    </div>
  );
}
