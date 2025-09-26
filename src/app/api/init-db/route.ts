import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';

// GET: Initialize database
// Remove this route once the database is initialized
export async function GET(request: NextRequest) {
  try {
    const success = await initDatabase();
    
    if (success) {
      return NextResponse.json({ 
        message: 'Database initialized successfully',
        table: 'user_preferences created/verified'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to initialize database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 