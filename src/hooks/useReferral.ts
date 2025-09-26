'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

interface ReferralStats {
  referralCode: string | null;
  referralUrl: string | null;
  totalReferrals: number;
  referrals: Array<{
    id: number;
    referred_email: string;
    created_at: string;
    status: string;
  }>;
}

export function useReferral(userId: string | undefined) {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Store referral code in localStorage when found in URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('referralCode', refCode);
      console.log('Stored referral code from URL:', refCode);
    }
  }, [searchParams]);

  // Fetch referral statistics
  const fetchStats = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/referral');
      if (!response.ok) {
        throw new Error('Failed to fetch referral stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching referral stats:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Track referral for new user
  const trackReferral = useCallback(async () => {
    if (!userId) return false;
    
    // Get referral code from localStorage
    const referralCode = localStorage.getItem('referralCode');
    if (!referralCode) {
      console.log('No referral code found');
      return false;
    }
    
    try {
      console.log('Tracking referral with code:', referralCode);
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referralCode }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to track referral:', error);
        return false;
      }
      
      // Clear the referral code after successful tracking
      localStorage.removeItem('referralCode');
      console.log('Referral tracked successfully');
      return true;
    } catch (err) {
      console.error('Error tracking referral:', err);
      return false;
    }
  }, [userId]);

  // Copy referral link to clipboard
  const copyReferralLink = useCallback(async () => {
    if (!stats?.referralUrl) return false;
    
    try {
      await navigator.clipboard.writeText(stats.referralUrl);
      return true;
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      return false;
    }
  }, [stats?.referralUrl]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
    trackReferral,
    copyReferralLink,
  };
} 