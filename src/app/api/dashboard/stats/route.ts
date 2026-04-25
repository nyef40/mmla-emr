import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Replace with your actual database queries
    const stats = {
      totalPatients: 42,
      todayAppointments: 8,
      pendingTasks: 5,
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error(error); // Log the error for debugging
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}