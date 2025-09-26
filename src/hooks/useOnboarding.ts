'use client';

import { useState, useEffect, useRef } from 'react';

export function useOnboarding(userId: string | undefined) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Early return if no userId or already checked
    if (!userId) {
      setLoading(false);
      return;
    }

    // Prevent duplicate checks for the same user
    if (hasCheckedRef.current) {
      return;
    }

    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Check onboarding status from database
    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch('/api/onboarding', {
          signal: abortController.signal
        });
        
        if (response.ok) {
          const data = await response.json();
          // Show onboarding if user hasn't completed it
          setShowOnboarding(!data.completed);
          hasCheckedRef.current = true;
        } else {
          // If there's an error, fall back to localStorage
          const hasSeenOnboarding = localStorage.getItem('calculatorOnboardingComplete');
          setShowOnboarding(!hasSeenOnboarding);
        }
      } catch (error: unknown) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        
        console.error('Error checking onboarding status:', error);
        // Fall back to localStorage on error
        const hasSeenOnboarding = localStorage.getItem('calculatorOnboardingComplete');
        setShowOnboarding(!hasSeenOnboarding);
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [userId]);

  const startOnboarding = () => {
    setShowOnboarding(true);
  };

  const completeOnboarding = async () => {
    try {
      // Save to database
      if (userId) {
        const response = await fetch('/api/onboarding', {
          method: 'POST',
        });

        if (!response.ok) {
          console.error('Failed to save onboarding status to database');
        } else {
          // Mark as checked so we don't fetch again
          hasCheckedRef.current = true;
        }
      }
      
      // Also save to localStorage as fallback
      localStorage.setItem('calculatorOnboardingComplete', 'true');
      
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still hide onboarding even if save fails
      localStorage.setItem('calculatorOnboardingComplete', 'true');
      setShowOnboarding(false);
    }
  };

  return {
    showOnboarding,
    loading,
    startOnboarding,
    completeOnboarding,
  };
} 