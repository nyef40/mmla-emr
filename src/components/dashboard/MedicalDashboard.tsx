// src/components/dashboard/MedicalDashboard.tsx
"use client";

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type PatientStat = { month: string; patients: number };
type AppointmentStat = { day: string; scheduled: number; completed: number };
type VitalSign = { time: string; systolic: number; diastolic: number; heartRate: number };

export default function MedicalDashboard() {
  const [patientStats, setPatientStats] = useState<PatientStat[]>([]);
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStat[]>([]);
  const [vitalSignsData, setVitalSignsData] = useState<VitalSign[]>([]);

  useEffect(() => {
    // Fetch data from API
    const fetchData = async () => {
      try {
        // Example data - replace with actual API calls
        setPatientStats([
          { month: 'Jan', patients: 65 },
          { month: 'Feb', patients: 78 },
          { month: 'Mar', patients: 90 },
          { month: 'Apr', patients: 81 },
          { month: 'May', patients: 56 },
          { month: 'Jun', patients: 55 },
        ]);

        setAppointmentStats([
          { day: 'Mon', scheduled: 12, completed: 10 },
          { day: 'Tue', scheduled: 15, completed: 12 },
          { day: 'Wed', scheduled: 11, completed: 9 },
          { day: 'Thu', scheduled: 17, completed: 15 },
          { day: 'Fri', scheduled: 14, completed: 13 },
          { day: 'Sat', scheduled: 6, completed: 5 },
          { day: 'Sun', scheduled: 2, completed: 2 },
        ]);

        setVitalSignsData([
          { time: '08:00', systolic: 120, diastolic: 80, heartRate: 72 },
          { time: '12:00', systolic: 118, diastolic: 79, heartRate: 75 },
          { time: '16:00', systolic: 122, diastolic: 82, heartRate: 70 },
          { time: '20:00', systolic: 119, diastolic: 78, heartRate: 74 },
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient Growth</CardTitle>
            <CardDescription>Monthly patient registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={patientStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="patients" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Statistics</CardTitle>
            <CardDescription>Weekly appointment completion rate</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={appointmentStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="scheduled" fill="#8884d8" />
                <Bar dataKey="completed" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vital Signs Monitoring</CardTitle>
          <CardDescription>Daily vital signs tracking for patient</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={vitalSignsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="systolic"
                stroke="#8884d8"
                name="Systolic BP"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="diastolic"
                stroke="#82ca9d"
                name="Diastolic BP"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="heartRate"
                stroke="#ffc658"
                name="Heart Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}