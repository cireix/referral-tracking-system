import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import Home from '@/app/page';
import { useReferral } from '@/hooks/useReferral';

// Mock modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@stackframe/stack', () => ({
  useUser: jest.fn(),
  UserButton: () => <div data-testid="user-button">User Button</div>,
  SignIn: () => <div data-testid="sign-in-form">Sign In</div>,
  SignUp: () => <div data-testid="sign-up-form">Sign Up</div>,
}));

jest.mock('@/components/providers/MixpanelProvider', () => ({
  useMixpanel: () => ({
    track: jest.fn(),
    trackSignup: jest.fn(),
    trackReferralEvent: jest.fn(),
  }),
}));

jest.mock('@/components/providers/MixpanelUserTracker', () => ({
  MixpanelUserTracker: () => null,
}));

jest.mock('@/hooks/useReferral');

jest.mock('@/components/Calculator', () => {
  return function Calculator() {
    return <div data-testid="calculator">Calculator</div>;
  };
});

// Mock fetch globally
global.fetch = jest.fn();

describe('End-to-End Referral Flow Integration Tests', () => {
  const mockPush = jest.fn();
  const mockTrackReferral = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      pathname: '/',
    });
    
    (useReferral as jest.Mock).mockReturnValue({
      trackReferral: mockTrackReferral,
      stats: null,
      loading: false,
      error: null,
    });
  });

  describe('Complete Referral Journey', () => {
    test('should handle complete referral flow: URL → Validation → Signup → Tracking', async () => {
      // Step 1: User visits with referral code
      const mockSearchParams = new URLSearchParams('ref=JOURNEY123');
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
      (useUser as jest.Mock).mockReturnValue(null); // Not authenticated
      
      // Mock successful validation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true, referrerId: 'referrer-journey' }),
      });

      const { rerender } = render(<Home />);

      // Step 2: Validate referral code
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/referral/validate?code=JOURNEY123');
      });

      // Check that code is stored
      await waitFor(() => {
        expect(localStorage.getItem('referralCode')).toBe('JOURNEY123');
        expect(localStorage.getItem('referrerId')).toBe('referrer-journey');
      });

      // Should show welcome message and sign-up form
      expect(screen.getByText(/You've been referred/)).toBeInTheDocument();
      expect(screen.getByTestId('sign-up-form')).toBeInTheDocument();

      // Step 3: User signs up and becomes authenticated
      localStorage.setItem('isNewUser', 'true'); // Simulate new user flag
      mockTrackReferral.mockResolvedValueOnce(true);
      
      (useUser as jest.Mock).mockReturnValue({
        id: 'new-user-journey',
        primaryEmail: 'journey@example.com',
        displayName: 'Journey User',
      });
      
      rerender(<Home />);

      // Step 4: Verify referral tracking
      await waitFor(() => {
        expect(mockTrackReferral).toHaveBeenCalled();
      });

      // Step 5: Verify clean-up
      await waitFor(() => {
        expect(localStorage.getItem('referralCode')).toBeNull();
        expect(localStorage.getItem('referrerId')).toBeNull();
        expect(localStorage.getItem('isNewUser')).toBeNull();
      });

      // Step 6: User should see calculator (authenticated view)
      expect(screen.getByTestId('calculator')).toBeInTheDocument();
      expect(screen.getByText(/Welcome, Journey User!/)).toBeInTheDocument();
    });

    test('should handle invalid referral code gracefully', async () => {
      const mockSearchParams = new URLSearchParams('ref=INVALID999');
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
      (useUser as jest.Mock).mockReturnValue(null);
      
      // Mock invalid code validation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: false }),
      });

      render(<Home />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/referral/validate?code=INVALID999');
      });

      // Should not store invalid code
      expect(localStorage.getItem('referralCode')).toBeNull();
      expect(localStorage.getItem('referrerId')).toBeNull();

      // Should show error message
      expect(screen.getByText(/Invalid referral code/)).toBeInTheDocument();
      
      // Should show sign-in form (not sign-up)
      expect(screen.getByTestId('sign-in-form')).toBeInTheDocument();
      expect(screen.queryByTestId('sign-up-form')).not.toBeInTheDocument();
    });

    test('should handle existing user with referral code', async () => {
      // User visits with referral code
      const mockSearchParams = new URLSearchParams('ref=EXISTING123');
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
      (useUser as jest.Mock).mockReturnValue(null);
      
      // Mock successful validation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true, referrerId: 'referrer-existing' }),
      });

      const { rerender } = render(<Home />);

      await waitFor(() => {
        expect(localStorage.getItem('referralCode')).toBe('EXISTING123');
      });

      // Existing user signs in (not a new user)
      // Note: isNewUser flag is NOT set
      mockTrackReferral.mockResolvedValueOnce(false); // Already referred
      
      (useUser as jest.Mock).mockReturnValue({
        id: 'existing-user',
        primaryEmail: 'existing@example.com',
        displayName: 'Existing User',
      });
      
      rerender(<Home />);

      // Should attempt to track but fail
      await waitFor(() => {
        expect(mockTrackReferral).toHaveBeenCalled();
      });

      // Should still clear the code even on failure
      await waitFor(() => {
        expect(localStorage.getItem('referralCode')).toBeNull();
        expect(localStorage.getItem('referrerId')).toBeNull();
      });

      // User should still see calculator
      expect(screen.getByTestId('calculator')).toBeInTheDocument();
    });

    test('should prevent self-referral', async () => {
      // Step 1: User is already authenticated
      const existingUser = {
        id: 'self-referrer',
        primaryEmail: 'self@example.com',
        displayName: 'Self User',
      };
      (useUser as jest.Mock).mockReturnValue(existingUser);
      (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
      
      // User gets their own referral code
      (useReferral as jest.Mock).mockReturnValue({
        trackReferral: mockTrackReferral,
        stats: {
          referralCode: 'MYCODE',
          referralUrl: 'http://example.com?ref=MYCODE',
          totalReferrals: 0,
          referrals: [],
        },
        loading: false,
        error: null,
      });
      
      render(<Home />);
      
      // Step 2: User logs out
      (useUser as jest.Mock).mockReturnValue(null);
      const { rerender } = render(<Home />);
      
      // Step 3: User visits with their own referral code
      const mockSearchParams = new URLSearchParams('ref=MYCODE');
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
      
      // Mock validation returns same user ID
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true, referrerId: 'self-referrer' }),
      });
      
      rerender(<Home />);
      
      await waitFor(() => {
        expect(localStorage.getItem('referralCode')).toBe('MYCODE');
        expect(localStorage.getItem('referrerId')).toBe('self-referrer');
      });
      
      // Step 4: User signs back in
      (useUser as jest.Mock).mockReturnValue(existingUser);
      
      // Mock the POST request to track referral (should fail)
      mockTrackReferral.mockResolvedValueOnce(false);
      
      rerender(<Home />);
      
      // Should attempt to track but fail
      await waitFor(() => {
        expect(mockTrackReferral).toHaveBeenCalled();
      });
      
      // Code should be cleared
      await waitFor(() => {
        expect(localStorage.getItem('referralCode')).toBeNull();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle network error during validation', async () => {
      const mockSearchParams = new URLSearchParams('ref=NETWORK_ERROR');
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
      (useUser as jest.Mock).mockReturnValue(null);
      
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<Home />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/referral/validate?code=NETWORK_ERROR');
      });

      // Should not store code on error
      expect(localStorage.getItem('referralCode')).toBeNull();
      expect(localStorage.getItem('referrerId')).toBeNull();

      // Should show sign-in form (fallback)
      expect(screen.getByTestId('sign-in-form')).toBeInTheDocument();
    });

    test('should handle rapid authentication state changes', async () => {
      const mockSearchParams = new URLSearchParams('ref=RAPID123');
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
      
      // Start unauthenticated
      (useUser as jest.Mock).mockReturnValue(null);
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true, referrerId: 'rapid-referrer' }),
      });
      
      const { rerender } = render(<Home />);
      
      // Quickly switch to authenticated before validation completes
      (useUser as jest.Mock).mockReturnValue({
        id: 'rapid-user',
        primaryEmail: 'rapid@example.com',
        displayName: 'Rapid User',
      });
      
      rerender(<Home />);
      
      // Should handle the state change gracefully
      expect(screen.getByTestId('calculator')).toBeInTheDocument();
    });

    test('should handle multiple referral codes in sequence', async () => {
      // First referral code
      let mockSearchParams = new URLSearchParams('ref=FIRST123');
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
      (useUser as jest.Mock).mockReturnValue(null);
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true, referrerId: 'first-referrer' }),
      });
      
      const { rerender } = render(<Home />);
      
      await waitFor(() => {
        expect(localStorage.getItem('referralCode')).toBe('FIRST123');
      });
      
      // Change to second referral code
      mockSearchParams = new URLSearchParams('ref=SECOND456');
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true, referrerId: 'second-referrer' }),
      });
      
      rerender(<Home />);
      
      await waitFor(() => {
        expect(localStorage.getItem('referralCode')).toBe('SECOND456');
        expect(localStorage.getItem('referrerId')).toBe('second-referrer');
      });
    });

    test('should clean up stale referral data when URL has no code', async () => {
      // Pre-populate localStorage with stale data
      localStorage.setItem('referralCode', 'STALE_CODE');
      localStorage.setItem('referrerId', 'stale-referrer');
      
      // No referral code in URL
      const mockSearchParams = new URLSearchParams();
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
      (useUser as jest.Mock).mockReturnValue(null);
      
      render(<Home />);
      
      // Should clear stale data
      await waitFor(() => {
        expect(localStorage.getItem('referralCode')).toBeNull();
        expect(localStorage.getItem('referrerId')).toBeNull();
      });
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle simultaneous validation and authentication', async () => {
      const mockSearchParams = new URLSearchParams('ref=CONCURRENT123');
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
      
      // Start with validation in progress
      let resolveValidation: (value: unknown) => void = () => {};
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise(resolve => {
          resolveValidation = resolve;
        })
      );
      
      // Start unauthenticated
      (useUser as jest.Mock).mockReturnValue(null);
      
      const { rerender } = render(<Home />);
      
      // User becomes authenticated while validation is still pending
      (useUser as jest.Mock).mockReturnValue({
        id: 'concurrent-user',
        primaryEmail: 'concurrent@example.com',
        displayName: 'Concurrent User',
      });
      
      rerender(<Home />);
      
      // Complete validation
      resolveValidation({
        ok: true,
        json: async () => ({ valid: true, referrerId: 'concurrent-referrer' }),
      });
      
      await waitFor(() => {
        // User should see calculator (authenticated)
        expect(screen.getByTestId('calculator')).toBeInTheDocument();
      });
    });
  });
}); 