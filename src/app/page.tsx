'use client';

import { useState, useEffect, Suspense } from 'react';
import Calculator from '@/components/Calculator';
import { useUser, UserButton, SignIn, SignUp } from '@stackframe/stack';
import Link from 'next/link';
import { useReferral } from '@/hooks/useReferral';
import { useSearchParams } from 'next/navigation';

function HomeContent() {
  const user = useUser();
  const [showSignUp, setShowSignUp] = useState(false);
  const { trackReferral } = useReferral(user?.id);
  const [hasTrackedReferral, setHasTrackedReferral] = useState(false);
  const searchParams = useSearchParams();

  // Store referral code from URL when component mounts
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('referralCode', refCode);
      console.log('Captured referral code from URL:', refCode);
      
      // Show sign-up form when there's a referral code
      setShowSignUp(true);
    }
  }, [searchParams]);

  // Track referral after successful sign-up
  useEffect(() => {
    const handleReferralTracking = async () => {
      if (user && !hasTrackedReferral) {
        const referralCode = localStorage.getItem('referralCode');
        if (referralCode) {
          console.log('User signed up, tracking referral...');
          const success = await trackReferral();
          if (success) {
            console.log('Referral tracked successfully');
          }
          setHasTrackedReferral(true);
        }
      }
    };
    
    handleReferralTracking();
  }, [user, hasTrackedReferral, trackReferral]);

  return (
    <div className="relative">
      {/* Auth Header - Only show when user is signed in */}
      {user && (
        <div className="absolute top-0 left-0 right-0 z-10 p-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="text-white">
              <span className="flex items-center gap-2">
                Welcome, {user.displayName || user.primaryEmail || 'User'}!
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-white hover:text-gray-200 transition-colors"
              >
                Dashboard
              </Link>
              <UserButton />
            </div>
          </div>
        </div>
      )}

      {/* Calculator or Authentication */}
      {user ? (
        <Calculator />
      ) : (
        <div className="min-h-screen bg-black-800 flex items-center justify-center">
          <div className="w-full max-w-sm p-6">
            {/* Show referral message if there's a referral code */}
            {searchParams.get('ref') && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm text-center">
                  🎉 You&apos;ve been referred! Sign up to get started.
                </p>
              </div>
            )}
           
            {/* Stack Auth Component */}
            <div className="simple-auth-wrapper">
              {showSignUp ? (
                <SignUp 
                  fullPage={false}
                  automaticRedirect={false}
                />
              ) : (
                <SignIn 
                  fullPage={false}
                  automaticRedirect={false}
                />
              )}
            </div>
            
            {/* Toggle Link */}
            <p className="text-center text-sm text-white mt-6">
              {showSignUp ? (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setShowSignUp(false)}
                    className="text-white font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  No account?{' '}
                  <button
                    onClick={() => setShowSignUp(true)}
                    className="text-white font-medium hover:underline"
                  >
                    Create one
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
