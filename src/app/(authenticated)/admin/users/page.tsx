"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Loader2, Phone } from "lucide-react";
import { getRoleLabel } from "@/lib/role-labels";

const ROLES = ["admin", "staff", "rn", "pt"] as const;

interface User {
  id: number;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean | null;
  phone: string | null;
  jobTitle: string | null;
  onCall: boolean | null;
  lastLoginAt: string | null;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({
    email: "", name: "", password: "", role: "rn" as string,
    phone: "", jobTitle: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "admin") router.push("/403");
  }, [status, session, router]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) { if (res.status === 403) router.push("/403"); return; }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!form.email.trim()) { setCreateError("Email is required."); return; }
    if (!form.password || form.password.length < 6) { setCreateError("Password must be at least 6 characters."); return; }
    setCreateLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          name: form.name.trim() || undefined,
          password: form.password,
          role: form.role,
          phone: form.phone.trim() || undefined,
          jobTitle: form.jobTitle.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || "Failed to create user."); return; }
      setForm({ email: "", name: "", password: "", role: "rn", phone: "", jobTitle: "" });
      setCreateOpen(false);
      fetchUsers();
    } catch {
      setCreateError("An error occurred. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  };

  const patch = async (userId: number, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok && res.status === 403) router.push("/403");
    else fetchUsers();
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-1">Create users, assign roles, and manage contact details</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/home">Back to Home</Link></Button>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="mr-2 h-4 w-4" />Create User</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create User</DialogTitle>
                <DialogDescription>Add a new user and assign a role.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <Label>Full Name</Label>
                    <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Joy Pleasant" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label>Email *</Label>
                    <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="user@mobilemedicalla.com" required />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label>Password *</Label>
                    <Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" required minLength={6} />
                  </div>
                  <div className="space-y-1">
                    <Label>Role *</Label>
                    <select
                      value={form.role}
                      onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Job Title</Label>
                    <Input value={form.jobTitle} onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))} placeholder="RN, PT, Admin…" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label>Cell Phone</Label>
                    <Input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="(310) 555-0100" />
                  </div>
                </div>
                {createError && <p className="text-sm text-destructive">{createError}</p>}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createLoading}>
                    {createLoading ? "Creating…" : "Create User"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>On Call</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-8">No users found.</TableCell>
                </TableRow>
              )}
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.name ?? "—"}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <select
                      value={user.role}
                      onChange={e => patch(user.id, { role: e.target.value })}
                      className="flex h-8 w-24 rounded-md border border-input bg-background px-2 py-1 text-xs"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                    </select>
                  </TableCell>
                  <TableCell className="text-sm">{user.jobTitle ?? "—"}</TableCell>
                  <TableCell>
                    {user.phone
                      ? <a href={`tel:${user.phone}`} className="flex items-center gap-1 text-sm text-blue-700 hover:underline"><Phone className="h-3 w-3" />{user.phone}</a>
                      : <span className="text-gray-400 text-sm">—</span>
                    }
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => patch(user.id, { onCall: !user.onCall })}
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-colors ${user.onCall ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"}`}
                    >
                      {user.onCall ? "On Call" : "No"}
                    </button>
                  </TableCell>
                  <TableCell>
                    <Badge variant={(user.isActive ?? true) ? "default" : "secondary"}>
                      {(user.isActive ?? true) ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => patch(user.id, { isActive: !(user.isActive ?? true) })}>
                      {(user.isActive ?? true) ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
