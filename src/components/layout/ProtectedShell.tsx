"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
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
  Menu,
  X,
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const showAdmin   = session?.user?.role === "admin";
  const showBilling = session?.user?.role === "admin" || session?.user?.role === "staff";

  const userName = session?.user?.name ?? "";
  const roleLabel = session?.user?.role ? getRoleLabel(session.user.role) : "";
  const nameParts = userName.trim().split(" ");
  const displayName = nameParts.length >= 2
    ? `${nameParts[nameParts.length - 1]}, ${nameParts.slice(0, -1).join(" ")} (${roleLabel})`
    : userName ? `${userName} (${roleLabel})` : roleLabel;

  const visibleNavItems = navItems.filter(item => {
    if (item.admin && !showAdmin) return false;
    if (item.billing && !showBilling) return false;
    return true;
  });

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  const sidebarContent = (
    <>
      <div className="bg-[#1e5f8a] px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="bg-white/20 rounded p-1 shrink-0">
            <Cross className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <Link href="/home" className="font-bold text-white text-sm leading-tight hover:opacity-90 truncate">
            MOBILE MEDICAL LA
          </Link>
        </div>
        <button
          type="button"
          className="md:hidden text-white/90 hover:text-white p-1"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 mt-1 overflow-y-auto">
        {visibleNavItems.map(item => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/home" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex w-full items-center gap-2 rounded px-3 py-2.5 text-sm font-medium transition-colors
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

      {session?.user && (
        <div className="border-t px-3 py-2.5 shrink-0">
          <p className="text-xs text-gray-500 truncate">{displayName}</p>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex bg-gray-50 overflow-x-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-52 border-r bg-white flex-col shadow-sm shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close menu overlay"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] border-r bg-white flex flex-col shadow-lg transition-transform duration-200 md:hidden
          ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {sidebarContent}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-11 border-b bg-[#1e5f8a] px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              className="md:hidden text-white/90 hover:text-white p-1 shrink-0"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/home")}
              title="Back to Home"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Breadcrumb className="text-white/90 text-sm truncate" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-white/90 text-xs sm:text-sm hidden sm:block max-w-[140px] truncate">{displayName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="gap-1 text-white/80 hover:text-white hover:bg-white/10 h-7 text-xs px-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 overflow-auto overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
