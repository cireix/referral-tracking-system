'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import { UserButton } from '@stackframe/stack';
import Link from 'next/link';
import { useReferral } from '@/hooks/useReferral';
import { useMixpanel } from '@/components/providers/MixpanelProvider';
import { MixpanelUserTracker } from '@/components/providers/MixpanelUserTracker';
import { MixpanelEvents } from '@/lib/mixpanel';

export default function DashboardPage() {
  const user = useUser();
  const router = useRouter();
  const mixpanel = useMixpanel();
  const [onboardingStatus, setOnboardingStatus] = useState<boolean | null>(null);
  const { stats: referralStats, copyReferralLink, refetch: refetchReferralStats } = useReferral(user?.id);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    // Redirect to signin if not logged in
    if (!user) {
      router.push('/');
      return;
    }
    
    // Track dashboard view
    mixpanel.track(MixpanelEvents.DASHBOARD_VIEWED, {
      userId: user.id,
    });
    
    // Create abort controller for cleanup
    const abortController = new AbortController();
    
    // Fetch onboarding status
    fetch('/api/onboarding', { signal: abortController.signal })
      .then(res => res.json())
      .then(data => setOnboardingStatus(data.completed))
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Error fetching onboarding status:', err);
        }
      });
    
    // Cleanup function
    return () => {
      abortController.abort();
    };
  }, [user, router, mixpanel]);

  const handleCopyReferralLink = async () => {
    const success = await copyReferralLink();
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      
      // Track referral link copy
      mixpanel.trackReferralEvent(MixpanelEvents.REFERRAL_LINK_COPIED, {
        referralCode: referralStats?.referralCode || undefined,
        referralUrl: referralStats?.referralUrl || undefined,
        valid: true,  // User's own referral code is always valid
        totalReferrals: referralStats?.totalReferrals || 0,
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-y-auto">
      {/* Mixpanel User Tracking */}
      <MixpanelUserTracker />
      <div className="container mx-auto px-4 py-8 pb-16 max-w-7xl">
        {/* Header - Make it sticky on desktop, static on mobile */}
        <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl p-4 md:p-6 mb-8 md:sticky md:top-4 z-20">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
            <div className="flex items-center gap-3 md:gap-4">
              <Link
                href="/"
                className="text-sm md:text-base text-gray-300 hover:text-white transition-colors"
              >
                Calculator
              </Link>
              <UserButton />
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Info Card */}
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">User Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">User ID</label>
                <p className="text-gray-200 font-mono text-sm break-all">{user.id}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Email</label>
                <p className="text-gray-200">{user.primaryEmail || 'No email set'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Display Name</label>
                <p className="text-gray-200">{user.displayName || 'No name set'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Email Verified</label>
                <p>
                  {user.primaryEmailVerified ? (
                    <span className="text-green-400 flex items-center gap-1">
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="text-yellow-400 flex items-center gap-1">
                      ⚠ Not verified
                    </span>
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Created At</label>
                <p className="text-gray-200">
                  {user.signedUpAt ? new Date(user.signedUpAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Calculator Tutorial</label>
                <p>
                  {onboardingStatus !== null ? (
                    onboardingStatus ? (
                      <span className="text-green-400 flex items-center gap-1">
                        ✓ Completed
                      </span>
                    ) : (
                      <span className="text-yellow-400 flex items-center gap-1">
                        ⚠ Not completed
                      </span>
                    )
                  ) : (
                    <span className="text-gray-500">Loading...</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Referral Stats Card */}
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Referral Program</h2>
            
            {referralStats ? (
              <div className="space-y-4">
                {/* Referral Link Section */}
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Your Referral Link</label>
                  {referralStats.referralUrl ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={referralStats.referralUrl}
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={handleCopyReferralLink}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        {copySuccess ? '✓ Copied!' : 'Copy'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-500">Generating...</p>
                  )}
                </div>

                {/* Referral Code */}
                <div>
                  <label className="text-sm text-gray-400">Referral Code</label>
                  <p className="text-2xl font-bold text-blue-400">
                    {referralStats.referralCode || 'Generating...'}
                  </p>
                </div>

                {/* Total Referrals */}
                <div>
                  <label className="text-sm text-gray-400">Total Referrals</label>
                  <p className="text-3xl font-bold text-green-400">
                    {referralStats.totalReferrals}
                  </p>
                </div>

                {/* Share Instructions */}
                <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-800/50">
                  <p className="text-sm text-blue-300">
                    <strong>Share your referral link</strong> with friends to invite them to the platform. 
                    You&apos;ll see them appear here when they sign up!
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading referral stats...</p>
              </div>
            )}
          </div>

          {/* Referred Users Card */}
          {referralStats && referralStats.totalReferrals > 0 && (
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Your Referrals</h2>
                <span className="text-sm text-gray-400">
                  Total: {referralStats.totalReferrals} {referralStats.totalReferrals === 1 ? 'referral' : 'referrals'}
                </span>
              </div>
              
              {/* Scrollable table container */}
              <div className="overflow-x-auto">
                <div className={`${referralStats.totalReferrals > 10 ? 'max-h-96 overflow-y-auto scrollbar-thin pr-2' : ''}`}>
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-900 z-10">
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-3 text-sm font-medium text-gray-400 bg-gray-900">#</th>
                        <th className="text-left py-3 px-3 text-sm font-medium text-gray-400 bg-gray-900">Email</th>
                        <th className="text-left py-3 px-3 text-sm font-medium text-gray-400 bg-gray-900">Date</th>
                        <th className="text-left py-3 px-3 text-sm font-medium text-gray-400 bg-gray-900">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {referralStats.referrals.map((referral, index) => (
                        <tr key={referral.id} className="hover:bg-gray-800/50 transition-colors">
                          <td className="py-3 px-3 text-sm text-gray-300">{index + 1}</td>
                          <td className="py-3 px-3 text-sm text-gray-300">
                            <span className="truncate block max-w-xs" title={referral.referred_email}>
                              {referral.referred_email}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-sm text-gray-300 whitespace-nowrap">
                            {new Date(referral.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              referral.status === 'completed' 
                                ? 'bg-green-900/50 text-green-400' 
                                : 'bg-yellow-900/50 text-yellow-400'
                            }`}>
                              {referral.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Show a note if there are many referrals */}
              {referralStats.totalReferrals > 10 && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Scroll to see more referrals • Showing all {referralStats.totalReferrals} referrals
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions Card */}
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Link 
                href="/" 
                className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-3 px-4 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-center font-medium shadow-lg hover:shadow-xl"
              >
                📱 Go to Calculator
              </Link>
              <button
                onClick={() => refetchReferralStats()}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl py-3 px-4 hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                🔄 Refresh Stats
              </button>
              <button
                onClick={() => user?.signOut()}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl py-3 px-4 hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 