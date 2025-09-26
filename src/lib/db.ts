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