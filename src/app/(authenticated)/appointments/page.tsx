"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, PlusCircle, Search, User } from "lucide-react";

interface Appointment {
  id: number;
  appointmentId: string;
  patientId: number;
  patientName?: string;
  doctorId: number;
  doctorName?: string;
  appointmentType: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  scheduledFor: string;
  duration: number;
  reason: string;
}

export default function AppointmentsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchAppointments = useCallback(async () => {
    try {
      const url = filter === "all" ? "/api/appointments" : `/api/appointments?status=${filter}`;
      const response = await fetch(url);
      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(response.statusText || "Failed to fetch");
      }
      if (!contentType?.includes("application/json")) throw new Error("Invalid response format");
      const data = await response.json();
      setAppointments(data.data ?? []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [filter, router]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const getStatusColor = (s: string) => {
    switch (s) {
      case "scheduled": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "no_show": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  const getStatusText = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ");

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Appointment Management</h1>
          <p className="text-gray-600 mt-1">Schedule and manage patient appointments</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/home">Back to Home</Link>
          </Button>
          <Button onClick={() => router.push("/appointments/new")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Appointments</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{appointments.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Scheduled</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{appointments.filter((a) => a.status === "scheduled").length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Confirmed</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{appointments.filter((a) => a.status === "confirmed").length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completed Today</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{appointments.filter((a) => a.status === "completed").length}</div></CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Appointments</CardTitle>
          <CardDescription>Search by patient name or filter by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input placeholder="Search patient name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1" />
              <Button variant="outline"><Search className="h-4 w-4" /></Button>
            </div>
            <div className="flex gap-2">
              {(["all", "scheduled", "confirmed", "completed"] as const).map((f) => (
                <Button key={f} variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>{f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}</Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No appointments found</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push("/appointments/new")}>
                <PlusCircle className="mr-2 h-4 w-4" /> Schedule your first appointment
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Appointment ID</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">{appointment.appointmentId}</TableCell>
                      <TableCell>
                        <div className="flex items-center"><User className="h-4 w-4 mr-2 text-gray-400" />{appointment.patientName || "N/A"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center"><Calendar className="h-3 w-3 mr-1 text-gray-400" />{new Date(appointment.scheduledFor).toLocaleDateString()}</div>
                          <div className="flex items-center text-sm text-gray-500"><Clock className="h-3 w-3 mr-1" />{new Date(appointment.scheduledFor).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                      </TableCell>
                      <TableCell>{appointment.appointmentType}</TableCell>
                      <TableCell>{appointment.doctorName || "N/A"}</TableCell>
                      <TableCell><Badge className={getStatusColor(appointment.status)}>{getStatusText(appointment.status)}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/appointments/${appointment.id}`)}>View</Button>
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/appointments/${appointment.id}/edit`)}>Edit</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
