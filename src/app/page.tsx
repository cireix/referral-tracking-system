'use client';

import { useState } from 'react';
import Calculator from '@/components/Calculator';
import { useUser, UserButton, SignIn, SignUp } from '@stackframe/stack';
import Link from 'next/link';

export default function Home() {
  const user = useUser();
  const [showSignUp, setShowSignUp] = useState(false);

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
