"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "./Breadcrumb";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Shield,
  Receipt,
  ArrowLeft,
  LogOut,
  Cross,
} from "lucide-react";
import { getRoleLabel } from "@/lib/role-labels";

const navItems = [
  { href: "/home",          label: "Home",            icon: LayoutDashboard, billing: false, admin: false },
  { href: "/patients",      label: "Patients",        icon: Users,           billing: false, admin: false },
  { href: "/appointments",  label: "Appointments",    icon: Calendar,        billing: false, admin: false },
  { href: "/billing/charges",label: "Billing",         icon: Receipt,         billing: true,  admin: false },
  { href: "/admin/users",   label: "User Management", icon: Shield,          billing: false, admin: true  },
];

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const showAdmin   = session?.user?.role === "admin";
  const showBilling = session?.user?.role === "admin" || session?.user?.role === "staff";

  // Format user display as "LastName, FirstName (Role)" like Netsmart
  const userName = session?.user?.name ?? "";
  const roleLabel = session?.user?.role ? getRoleLabel(session.user.role) : "";
  const nameParts = userName.trim().split(" ");
  const displayName = nameParts.length >= 2
    ? `${nameParts[nameParts.length - 1]}, ${nameParts.slice(0, -1).join(" ")} (${roleLabel})`
    : userName ? `${userName} (${roleLabel})` : roleLabel;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-52 border-r bg-white flex flex-col shadow-sm">
        {/* Brand */}
        <div className="bg-[#1e5f8a] px-4 py-3 flex items-center gap-2">
          <div className="bg-white/20 rounded p-1">
            <Cross className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <Link href="/home" className="font-bold text-white text-sm leading-tight hover:opacity-90">
            MOBILE MEDICAL LA
          </Link>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 mt-1">
          {navItems
            .filter(item => {
              if (item.admin    && !showAdmin)   return false;
              if (item.billing  && !showBilling) return false;
              return true;
            })
            .map(item => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/home" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors
                    ${isActive
                      ? "bg-[#1e5f8a] text-white"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
        </nav>

        {/* User info at sidebar bottom */}
        {session?.user && (
          <div className="border-t px-3 py-2.5">
            <p className="text-xs text-gray-500 truncate">{displayName}</p>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navbar */}
        <header className="h-11 border-b bg-[#1e5f8a] px-4 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/home")}
              title="Back to Home"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Breadcrumb className="text-white/90 text-sm" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/90 text-sm hidden md:block">{displayName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="gap-1 text-white/80 hover:text-white hover:bg-white/10 h-7 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
