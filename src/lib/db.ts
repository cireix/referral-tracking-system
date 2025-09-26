import { neon } from '@neondatabase/serverless';

// Create database connection
const sql = neon(process.env.DATABASE_URL!);

export default sql;

// Initialize user preferences table
export async function initDatabase() {
  try {
    // Create user_preferences table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id TEXT PRIMARY KEY,
        onboarding_completed BOOLEAN DEFAULT FALSE,
        onboarding_completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Create referrals table to track referral relationships
    await sql`
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        referrer_id TEXT NOT NULL,
        referred_id TEXT NOT NULL UNIQUE,
        referred_email TEXT,
        referral_code TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        CONSTRAINT unique_referred UNIQUE (referred_id)
      )
    `;
    
    // Create referral_codes table for user referral codes
    await sql`
      CREATE TABLE IF NOT EXISTS referral_codes (
        user_id TEXT PRIMARY KEY,
        referral_code TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Add index for performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_referral_code ON referral_codes(referral_code)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_referrer_id ON referrals(referrer_id)
    `;
    
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

// Get user's onboarding status
export async function getOnboardingStatus(userId: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT onboarding_completed 
      FROM user_preferences 
      WHERE user_id = ${userId}
    `;
    
    return result[0]?.onboarding_completed || false;
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    return false;
  }
}

// Set user's onboarding status
export async function setOnboardingCompleted(userId: string): Promise<boolean> {
  try {
    await sql`
      INSERT INTO user_preferences (user_id, onboarding_completed, onboarding_completed_at, updated_at)
      VALUES (${userId}, TRUE, NOW(), NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET 
        onboarding_completed = TRUE,
        onboarding_completed_at = NOW(),
        updated_at = NOW()
    `;
    
    return true;
  } catch (error) {
    console.error('Error updating onboarding status:', error);
    return false;
  }
} 

// Generate a unique referral code for a user
export async function generateReferralCode(userId: string): Promise<string | null> {
  try {
    // Check if user already has a referral code
    const existing = await sql`
      SELECT referral_code FROM referral_codes 
      WHERE user_id = ${userId}
    `;
    
    if (existing.length > 0) {
      return existing[0].referral_code;
    }
    
    // Generate a unique code (6 characters)
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };
    
    let code = generateCode();
    let attempts = 0;
    
    // Ensure uniqueness
    while (attempts < 10) {
      const existing = await sql`
        SELECT referral_code FROM referral_codes 
        WHERE referral_code = ${code}
      `;
      
      if (existing.length === 0) {
        // Insert the new code
        await sql`
          INSERT INTO referral_codes (user_id, referral_code)
          VALUES (${userId}, ${code})
        `;
        return code;
      }
      
      code = generateCode();
      attempts++;
    }
    
    return null;
  } catch (error) {
    console.error('Error generating referral code:', error);
    return null;
  }
}

// Get referral code for a user
export async function getReferralCode(userId: string): Promise<string | null> {
  try {
    const result = await sql`
      SELECT referral_code FROM referral_codes 
      WHERE user_id = ${userId}
    `;
    
    if (result.length > 0) {
      return result[0].referral_code;
    }
    
    // Generate one if it doesn't exist
    return generateReferralCode(userId);
  } catch (error) {
    console.error('Error getting referral code:', error);
    return null;
  }
}

// Validate a referral code and get the referrer's ID
export async function validateReferralCode(code: string): Promise<string | null> {
  try {
    const result = await sql`
      SELECT user_id FROM referral_codes 
      WHERE referral_code = ${code}
    `;
    
    return result.length > 0 ? result[0].user_id : null;
  } catch (error) {
    console.error('Error validating referral code:', error);
    return null;
  }
}

// Track a new referral
export async function trackReferral(
  referrerId: string,
  referredId: string,
  referralCode: string,
  referredEmail?: string
): Promise<boolean> {
  try {
    // Check if this user has already been referred
    const existing = await sql`
      SELECT id FROM referrals 
      WHERE referred_id = ${referredId}
    `;
    
    if (existing.length > 0) {
      console.log(`User ${referredId} has already been referred`);
      return false;
    }
    
    await sql`
      INSERT INTO referrals (
        referrer_id, 
        referred_id, 
        referred_email, 
        referral_code, 
        status, 
        completed_at
      )
      VALUES (
        ${referrerId}, 
        ${referredId}, 
        ${referredEmail}, 
        ${referralCode}, 
        'completed', 
        NOW()
      )
    `;
    
    return true;
  } catch (error) {
    console.error('Error tracking referral:', error);
    return false;
  }
}

// Get referral statistics for a user
export async function getReferralStats(userId: string): Promise<{
  totalReferrals: number;
  referralCode: string | null;
  referrals: Array<{
    id: number;
    referred_email: string;
    created_at: Date;
    status: string;
  }>;
}> {
  try {
    // Get the user's referral code
    const code = await getReferralCode(userId);
    
    // Get referrals
    const referrals = await sql`
      SELECT 
        id,
        referred_email,
        created_at,
        status
      FROM referrals 
      WHERE referrer_id = ${userId}
      ORDER BY created_at DESC
    `;
    
    return {
      totalReferrals: referrals.length,
      referralCode: code,
      referrals: referrals.map(r => ({
        id: r.id,
        referred_email: r.referred_email || 'Anonymous',
        created_at: r.created_at,
        status: r.status
      }))
    };
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return {
      totalReferrals: 0,
      referralCode: null,
      referrals: []
    };
  }
}

// Check who referred a user
export async function getReferrer(userId: string): Promise<string | null> {
  try {
    const result = await sql`
      SELECT referrer_id FROM referrals 
      WHERE referred_id = ${userId}
    `;
    
    return result.length > 0 ? result[0].referrer_id : null;
  } catch (error) {
    console.error('Error getting referrer:', error);
    return null;
  }
} 