import { NextRequest, NextResponse } from 'next/server';
import { validateReferralCode, initDatabase } from '@/lib/db';

// Initialize database on first load
initDatabase();

export async function GET(request: NextRequest) {
  try {
    // Get the referral code from query params
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'No referral code provided' },
        { status: 400 }
      );
    }
    
    console.log(`[Referral Validate API] Validating code: ${code}`);
    
    // Validate the referral code
    const referrerId = await validateReferralCode(code);
    
    if (referrerId) {
      console.log(`[Referral Validate API] Code ${code} is valid for user ${referrerId}`);
      return NextResponse.json({ 
        valid: true,
        referrerId 
      });
    } else {
      console.log(`[Referral Validate API] Code ${code} is invalid`);
      return NextResponse.json({ 
        valid: false 
      });
    }
  } catch (error) {
    console.error('Error in GET /api/referral/validate:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 