"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "./Breadcrumb";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Shield,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { getRoleLabel } from "@/lib/role-labels";

const navItems = [
  { href: "/home", label: "Home", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/admin/users", label: "User Management", icon: Shield },
];

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const showAdmin = session?.user?.role === "admin";

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <Link href="/home" className="cursor-pointer font-bold text-lg text-primary hover:underline">
            MMLA EMR
          </Link>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems
            .filter((item) => item.href !== "/admin/users" || showAdmin)
            .map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/home" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isActive ? "bg-secondary text-secondary-foreground" : ""
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navbar */}
        <header className="h-14 border-b bg-white px-4 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/home")}
              title="Back to Home"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Breadcrumb />
          </div>
          <div className="flex items-center gap-2">
            {session?.user?.role && (
              session.user.role === "admin" ? (
                <Link
                  href="/admin/users"
                  className="cursor-pointer"
                  title="User Management"
                >
                  <Badge variant="outline">{getRoleLabel(session.user.role)}</Badge>
                </Link>
              ) : (
                <Badge variant="outline">{getRoleLabel(session.user.role)}</Badge>
              )
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="gap-1"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
