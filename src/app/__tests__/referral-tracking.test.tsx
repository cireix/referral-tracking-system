import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import Home from '../page';
import { useReferral } from '@/hooks/useReferral';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock Stack Auth
jest.mock('@stackframe/stack', () => ({
  useUser: jest.fn(),
  UserButton: () => <div data-testid="user-button">User Button</div>,
  SignIn: ({ fullPage, automaticRedirect }: any) => (
    <div data-testid="sign-in-form">Sign In Form</div>
  ),
  SignUp: ({ fullPage, automaticRedirect }: any) => (
    <div data-testid="sign-up-form">Sign Up Form</div>
  ),
}));

// Mock Mixpanel
const mockMixpanelTrack = jest.fn();
const mockMixpanelTrackSignup = jest.fn();
const mockMixpanelTrackReferralEvent = jest.fn();

jest.mock('@/components/providers/MixpanelProvider', () => ({
  useMixpanel: () => ({
    track: mockMixpanelTrack,
    trackSignup: mockMixpanelTrackSignup,
    trackReferralEvent: mockMixpanelTrackReferralEvent,
  }),
}));

jest.mock('@/components/providers/MixpanelUserTracker', () => ({
  MixpanelUserTracker: () => null,
}));

// Mock useReferral hook
jest.mock('@/hooks/useReferral');

// Mock Calculator
jest.mock('@/components/Calculator', () => {
  return function Calculator() {
    return <div data-testid="calculator">Calculator</div>;
  };
});

// Mock fetch globally
global.fetch = jest.fn();

describe('Referral Tracking System', () => {
  const mockPush = jest.fn();
  const mockTrackReferral = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockTrackReferral.mockReset();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      pathname: '/',
    });
    (useReferral as jest.Mock).mockImplementation((userId) => ({
      trackReferral: mockTrackReferral,
      stats: null,
      loading: false,
      error: null,
      refetch: jest.fn(),
      copyReferralLink: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Referral Code URL Parameter Handling', () => {
    test('should validate and store valid referral code from URL', async () => {
      const mockSearchParams = new URLSearchParams('ref=ABC123');
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
      (useUser as jest.Mock).mockReturnValue(null);

      // Mock successful validation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true, referrerId: 'referrer-123' }),
      });

      render(<Home />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/referral/validate?code=ABC123');
      });

      await waitFor(() => {
        expect(localStorage.getItem('referralCode')).toBe('ABC123');
        expect(localStorage.getItem('referrerId')).toBe('referrer-123');
      });

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/You've been referred! Sign up to get started/)).toBeInTheDocument();
      });

      // Should automatically show sign-up form
      expect(screen.getByTestId('sign-up-form')).toBeInTheDocument();
    });

    test('should handle invalid referral code from URL', async () => {
      const mockSearchParams = new URLSearchParams('ref=INVALID');
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
      (useUser as jest.Mock).mockReturnValue(null);

      // Mock failed validation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: false }),
      });

      render(<Home />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/referral/validate?code=INVALID');
      });

      // Should not store invalid code
      await waitFor(() => {
        expect(localStorage.getItem('referralCode')).toBeNull();
        expect(localStorage.getItem('referrerId')).toBeNull();
      });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Invalid referral code/)).toBeInTheDocument();
      });

      // Should show sign-in form by default
      expect(screen.getByTestId('sign-in-form')).toBeInTheDocument();
    });

    test('should show loading state while validating referral code', async () => {
      const mockSearchParams = new URLSearchParams('ref=ABC123');
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
      (useUser as jest.Mock).mockReturnValue(null);

      // Mock a slow validation
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => {
          resolve({
            ok: true,
            json: async () => ({ valid: true, referrerId: 'referrer-123' }),
          });
        }, 100))
      );

      render(<Home />);

      // Should show loading message initially
      expect(screen.getByText(/Validating referral code/)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/Validating referral code/)).not.toBeInTheDocument();
      });
    });

    test('should handle validation error gracefully', async () => {
      const mockSearchParams = new URLSearchParams('ref=ERROR123');
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
      (useUser as jest.Mock).mockReturnValue(null);

      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<Home />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/referral/validate?code=ERROR123');
      });

      // Should not store code on error
      await waitFor(() => {
        expect(localStorage.getItem('referralCode')).toBeNull();
        expect(localStorage.getItem('referrerId')).toBeNull();
      });
    });

    test('should not validate same code multiple times', async () => {
      const mockSearchParams = new URLSearchParams('ref=ABC123');
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
      (useUser as jest.Mock).mockReturnValue(null);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ valid: true, referrerId: 'referrer-123' }),
      });

      const { rerender } = render(<Home />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Rerender with same params
      rerender(<Home />);

      // Should not call validation again
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Referral Tracking After Authentication', () => {


    test('should not track referral if no code is present', async () => {
      // No referral code in localStorage
      localStorage.clear();

      const mockSearchParams = new URLSearchParams();
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
      
      (useUser as jest.Mock).mockReturnValue({
        id: 'user-999',
        primaryEmail: 'noref@example.com',
        displayName: 'No Ref User',
      });

      render(<Home />);

      // Give time for effect to run
      await waitFor(() => {
        expect(mockTrackReferral).not.toHaveBeenCalled();
      });
    });


  });

  describe('Referral Code Capture Events', () => {
    test('should track valid referral code capture', async () => {
      const mockSearchParams = new URLSearchParams('ref=TRACK123');
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
      (useUser as jest.Mock).mockReturnValue(null);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true, referrerId: 'referrer-track' }),
      });

      render(<Home />);

      await waitFor(() => {
        expect(mockMixpanelTrack).toHaveBeenCalledWith(
          'Referral Code Captured',
          expect.objectContaining({
            referralCode: 'TRACK123',
            referrerId: 'referrer-track',
            source: 'url_parameter',
            valid: true,
          })
        );
      });
    });

    test('should track invalid referral code capture', async () => {
      const mockSearchParams = new URLSearchParams('ref=INVALID123');
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
      (useUser as jest.Mock).mockReturnValue(null);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: false }),
      });

      render(<Home />);

      await waitFor(() => {
        expect(mockMixpanelTrack).toHaveBeenCalledWith(
          'Referral Code Captured',
          expect.objectContaining({
            referralCode: 'INVALID123',
            source: 'url_parameter',
            valid: false,
          })
        );
      });
    });
  });

  describe('Clean URL State', () => {
    test('should clear referral data when no code in URL', async () => {
      // Pre-set some stale data
      localStorage.setItem('referralCode', 'STALE');
      localStorage.setItem('referrerId', 'stale-referrer');

      const mockSearchParams = new URLSearchParams(); // No ref param
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
}); 