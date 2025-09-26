import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack/server';
import { 
  getReferralStats, 
  validateReferralCode,
  trackReferral,
  initDatabase 
} from '@/lib/db';

// Initialize database on first load
initDatabase();

// GET: Get user's referral code and statistics
export async function GET(request: NextRequest) {
  try {
    // Get the current user from Stack Auth
    const user = await stackServerApp.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`[Referral API] Getting referral stats for user: ${user.id}`);
    
    // Get referral statistics
    const stats = await getReferralStats(user.id);
    
    // Generate the full referral URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const referralUrl = stats.referralCode 
      ? `${baseUrl}?ref=${stats.referralCode}`
      : null;
    
    return NextResponse.json({
      referralCode: stats.referralCode,
      referralUrl,
      totalReferrals: stats.totalReferrals,
      referrals: stats.referrals
    });
  } catch (error) {
    console.error('Error in GET /api/referral:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Track a referral for the current user
export async function POST(request: NextRequest) {
  try {
    // Get the current user from Stack Auth
    const user = await stackServerApp.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the referral code from the request body
    const body = await request.json();
    const { referralCode } = body;
    
    if (!referralCode) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }
    
    console.log(`[Referral API] Tracking referral for user ${user.id} with code ${referralCode}`);
    
    // Validate the referral code and get the referrer
    const referrerId = await validateReferralCode(referralCode);
    
    if (!referrerId) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 400 }
      );
    }
    
    // Don't allow self-referral
    if (referrerId === user.id) {
      return NextResponse.json(
        { error: 'Cannot refer yourself' },
        { status: 400 }
      );
    }
    
    // Track the referral
    const success = await trackReferral(
      referrerId,
      user.id,
      referralCode,
      user.primaryEmail || undefined
    );
    
    if (success) {
      console.log(`[Referral API] Successfully tracked referral: ${referrerId} -> ${user.id}`);
      return NextResponse.json({ 
        success: true,
        message: 'Referral tracked successfully' 
      });
    } else {
      // This could mean the user has already been referred
      return NextResponse.json(
        { error: 'User has already been referred or referral could not be tracked' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/referral:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 