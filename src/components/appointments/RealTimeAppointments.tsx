// src/components/appointments/RealTimeAppointments.tsx
"use client";

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AppointmentUpdate {
  id: number;
  patientName: string;
  status: string;
  time: string;
}

export default function RealTimeAppointments() {
  const { socket, isConnected } = useSocket();
  const [updates, setUpdates] = useState<AppointmentUpdate[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('appointment-updated', (data: AppointmentUpdate) => {
      setUpdates((prev) => [data, ...prev.slice(0, 9)]);
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        setUpdates((prev) => prev.filter((update) => update.id !== data.id));
      }, 10000);
    });

    return () => {
      socket.off('appointment-updated');
    };
  }, [socket]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Real-time Updates
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {updates.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No recent updates
            </p>
          ) : (
            updates.map((update) => (
              <div
                key={update.id}
                className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{update.patientName}</p>
                    <p className="text-sm text-gray-500">{update.time}</p>
                  </div>
                  <Badge className={getStatusColor(update.status)}>
                    {update.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}