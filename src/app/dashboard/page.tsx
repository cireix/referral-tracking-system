'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import { UserButton } from '@stackframe/stack';
import Link from 'next/link';
import { useReferral } from '@/hooks/useReferral';

export default function DashboardPage() {
  const user = useUser();
  const router = useRouter();
  const [onboardingStatus, setOnboardingStatus] = useState<boolean | null>(null);
  const { stats: referralStats, copyReferralLink, refetch: refetchReferralStats } = useReferral(user?.id);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    // Redirect to signin if not logged in
    if (!user) {
      router.push('/');
      return;
    }
    
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
  }, [user, router]);

  const handleCopyReferralLink = async () => {
    const success = await copyReferralLink();
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
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
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-300 hover:text-white transition-colors"
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
              <h2 className="text-xl font-semibold text-white mb-4">Your Referrals</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-400">#</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-400">Email</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-400">Date</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralStats.referrals.map((referral, index) => (
                      <tr key={referral.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-2 px-3 text-sm text-gray-300">{index + 1}</td>
                        <td className="py-2 px-3 text-sm text-gray-300">{referral.referred_email}</td>
                        <td className="py-2 px-3 text-sm text-gray-300">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3">
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