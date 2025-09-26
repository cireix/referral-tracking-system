import { getOnboardingStatus, initDatabase, setOnboardingCompleted } from '@/lib/db';
import { stackServerApp } from '@/stack/server';
import { NextResponse } from 'next/server';

// Initialize database on first load
initDatabase();

// GET: Check if user has completed onboarding
export async function GET() {
  try {
    // Get the current user from Stack Auth
    const user = await stackServerApp.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`[Onboarding API] Checking status for user: ${user.id}`);
    const completed = await getOnboardingStatus(user.id);
    console.log(`[Onboarding API] User ${user.id} onboarding completed: ${completed}`);
    
    return NextResponse.json({ completed });
  } catch (error) {
    console.error('Error in GET /api/onboarding:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Mark onboarding as completed
export async function POST() {
  try {
    // Get the current user from Stack Auth
    const user = await stackServerApp.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const success = await setOnboardingCompleted(user.id);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to update onboarding status' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/onboarding:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 