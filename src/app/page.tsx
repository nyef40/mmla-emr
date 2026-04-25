// src/app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">MMLA EMR</h1>
          <nav className="flex gap-4">
            <Button variant="ghost" asChild className="cursor-pointer">
              <Link href="/home">Home</Link>
            </Button>
            <Button variant="ghost" asChild className="cursor-pointer">
              <Link href="/patients">Patients</Link>
            </Button>
            <Button variant="ghost" asChild className="cursor-pointer">
              <Link href="/appointments">Appointments</Link>
            </Button>
            <Button variant="ghost" asChild className="cursor-pointer">
              <Link href="/admin/users">Admin</Link>
            </Button>
            <Button asChild className="cursor-pointer">
              <Link href="/login">Login</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Medical Management System</h2>
          <p className="text-gray-600 text-lg">Modern Electronic Medical Records for healthcare providers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Patient Management</CardTitle>
              <CardDescription>Manage patient records and histories</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Store and access patient information securely with detailed medical histories.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appointment Scheduling</CardTitle>
              <CardDescription>Schedule and manage appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Efficiently schedule appointments with real-time availability and reminders.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medical Records</CardTitle>
              <CardDescription>Secure and accessible records</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Maintain comprehensive medical records with secure access controls.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
