'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Calculator from '@/components/Calculator';
import { useUser, UserButton, SignIn, SignUp } from '@stackframe/stack';
import Link from 'next/link';
import { useReferral } from '@/hooks/useReferral';
import { useSearchParams } from 'next/navigation';
import { useMixpanel } from '@/components/providers/MixpanelProvider';
import { MixpanelUserTracker } from '@/components/providers/MixpanelUserTracker';
import { MixpanelEvents } from '@/lib/mixpanel';

function HomeContent() {
  const user = useUser();
  const mixpanel = useMixpanel();
  const [showSignUp, setShowSignUp] = useState(false);
  const { trackReferral } = useReferral(user?.id);
  const [hasTrackedReferral, setHasTrackedReferral] = useState(false);
  const [hasTrackedSignup, setHasTrackedSignup] = useState(false);
  const [validReferralCode, setValidReferralCode] = useState<string | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const isTrackingRef = useRef(false);
  const validatedCodesRef = useRef<Set<string>>(new Set());
  const searchParams = useSearchParams();

  // Validate and store referral code from URL when component mounts
  useEffect(() => {
    const validateAndStoreCode = async () => {
      const refCode = searchParams.get('ref');
      
      // Check if we have a code and haven't validated it yet
      if (refCode && !validatedCodesRef.current.has(refCode)) {
        // Mark this code as being processed
        validatedCodesRef.current.add(refCode);
        setIsValidatingCode(true);
        console.log('Validating referral code from URL:', refCode);
        
        try {
          // Validate the referral code
          const response = await fetch(`/api/referral/validate?code=${refCode}`);
          const data = await response.json();
          
          if (data.valid) {
            console.log('Referral code is valid:', refCode);
            localStorage.setItem('referralCode', refCode);
            setValidReferralCode(refCode);
            
            // Track referral code capture only if valid
            mixpanel.track(MixpanelEvents.REFERRAL_CODE_CAPTURED, {
              referralCode: refCode,
              source: 'url_parameter',
              valid: true,
            });
            
            // Show sign-up form when there's a valid referral code
            setShowSignUp(true);
          } else {
            console.log('Invalid referral code:', refCode);
            // Don't store invalid codes
            setValidReferralCode(null);
            
            // Track invalid referral attempt
            mixpanel.track(MixpanelEvents.REFERRAL_CODE_CAPTURED, {
              referralCode: refCode,
              source: 'url_parameter',
              valid: false,
            });
          }
        } catch (error) {
          console.error('Error validating referral code:', error);
          setValidReferralCode(null);
          // Remove from validated set on error to allow retry
          validatedCodesRef.current.delete(refCode);
        } finally {
          setIsValidatingCode(false);
        }
      } else if (!refCode) {
        // Clear state when there's no referral code
        setValidReferralCode(null);
        setIsValidatingCode(false);
      }
    };
    
    validateAndStoreCode();
  }, [searchParams, mixpanel]);

  // Track user signup and referral after successful authentication
  useEffect(() => {
    const handleUserTracking = async () => {
      if (user) {
        // Track signup if this is a new user
        if (!hasTrackedSignup) {
          const isNewUser = localStorage.getItem('isNewUser');
          if (isNewUser === 'true') {
            const referralCode = localStorage.getItem('referralCode');
            
            mixpanel.trackSignup(user.id, {
              email: user.primaryEmail || undefined,
              name: user.displayName || undefined,
              referralCode: referralCode || undefined,
            });
            
            localStorage.removeItem('isNewUser');
          }
          setHasTrackedSignup(true);
        }
        
        // Handle referral tracking
        if (!hasTrackedReferral && !isTrackingRef.current) {
          const referralCode = localStorage.getItem('referralCode');
          if (referralCode) {
            // Set the lock to prevent duplicate calls
            isTrackingRef.current = true;
            
            console.log('User signed up, tracking referral...');
            const success = await trackReferral();
            if (success) {
              console.log('Referral tracked successfully');
              
              // Track successful referral
              mixpanel.trackReferralEvent(MixpanelEvents.REFERRAL_TRACKED, {
                referralCode: referralCode,
                referredId: user.id,
                valid: true,  // This was successful, so it's valid
                success: true,
              });
              
              // Clear the referral code after successful tracking
              localStorage.removeItem('referralCode');
            } else {
              console.log('Referral tracking failed or user was already referred');
              
              // Track failed referral attempt
              mixpanel.trackReferralEvent(MixpanelEvents.REFERRAL_TRACKED, {
                referralCode: referralCode,
                referredId: user.id,
                valid: true,  // Code was valid, but tracking failed (e.g., already referred)
                success: false,
              });
              
              // Still remove the code to prevent repeated attempts
              localStorage.removeItem('referralCode');
            }
            setHasTrackedReferral(true);
            
            // Release the lock
            isTrackingRef.current = false;
          }
        }
      }
    };
    
    handleUserTracking();
  }, [user, hasTrackedReferral, hasTrackedSignup, trackReferral, mixpanel]);

  return (
    <div className="relative">
      {/* Mixpanel User Tracking */}
      <MixpanelUserTracker />
      
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
            {/* Show loading state while validating */}
            {isValidatingCode && (
              <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 text-sm text-center flex items-center justify-center gap-2">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></span>
                  Validating referral code...
                </p>
              </div>
            )}
            
            {/* Show referral message if there's a valid referral code */}
            {!isValidatingCode && validReferralCode && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm text-center">
                  🎉 You&apos;ve been referred! Sign up to get started.
                </p>
              </div>
            )}
            
            {/* Show invalid referral message */}
            {searchParams.get('ref') && !isValidatingCode && !validReferralCode && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm text-center">
                  ⚠️ Invalid referral code. Please check the link or sign up normally.
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
