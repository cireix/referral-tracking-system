'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStackApp, useUser } from '@stackframe/stack';
import { UserButton } from '@stackframe/stack';
import Link from 'next/link';

export default function DashboardPage() {
  const user = useUser();
  const router = useRouter();
  const [onboardingStatus, setOnboardingStatus] = useState<boolean | null>(null);

  useEffect(() => {
    // Redirect to signin if not logged in
    if (!user) {
      router.push('/signin');
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <UserButton />
          </div>
        </div>

        {/* User Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">User Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">User ID</label>
                <p className="text-gray-900 font-mono text-sm">{user.id}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <p className="text-gray-900">{user.primaryEmail || 'No email set'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Display Name</label>
                <p className="text-gray-900">{user.displayName || 'No name set'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Email Verified</label>
                <p className="text-gray-900">
                  {user.primaryEmailVerified ? (
                    <span className="text-green-600 flex items-center gap-1">
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="text-yellow-600 flex items-center gap-1">
                      ⚠ Not verified
                    </span>
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Created At</label>
                <p className="text-gray-900">
                  {user.signedUpAt ? new Date(user.signedUpAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Calculator Tutorial</label>
                <p className="text-gray-900">
                  {onboardingStatus !== null ? (
                    onboardingStatus ? (
                      <span className="text-green-600 flex items-center gap-1">
                        ✓ Completed
                      </span>
                    ) : (
                      <span className="text-yellow-600 flex items-center gap-1">
                        ⚠ Not completed
                      </span>
                    )
                  ) : (
                    <span className="text-gray-400">Loading...</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link 
                href="/" 
                className="block w-full bg-blue-600 text-white rounded-xl py-3 px-4 hover:bg-blue-700 transition-colors text-center font-medium"
              >
                Go to Calculator
              </Link>
              <button
                onClick={() => user?.signOut()}
                className="w-full bg-red-600 text-white rounded-xl py-3 px-4 hover:bg-red-700 transition-colors font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 