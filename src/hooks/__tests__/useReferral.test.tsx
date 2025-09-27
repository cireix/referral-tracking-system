import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { useReferral } from '../useReferral';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('useReferral Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('URL Parameter Handling', () => {
    test('should store referral code from URL params in localStorage', () => {
      const mockSearchParams = new URLSearchParams('ref=TEST123');
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

      renderHook(() => useReferral('user-123'));

      expect(localStorage.getItem('referralCode')).toBe('TEST123');
    });

    test('should not store if no referral code in URL', () => {
      const mockSearchParams = new URLSearchParams();
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

      renderHook(() => useReferral('user-123'));

      expect(localStorage.getItem('referralCode')).toBeNull();
    });

    test('should log when storing referral code', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockSearchParams = new URLSearchParams('ref=LOG456');
      (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

      renderHook(() => useReferral('user-123'));

      expect(consoleSpy).toHaveBeenCalledWith('Stored referral code from URL:', 'LOG456');
      consoleSpy.mockRestore();
    });
  });

  describe('Fetching Referral Statistics', () => {
    test('should fetch stats on mount when user ID is provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          referralCode: 'USER123',
          referralUrl: 'http://example.com?ref=USER123',
          totalReferrals: 2,
          referrals: [
            { id: 1, referred_email: 'ref1@test.com', created_at: '2024-01-01', status: 'completed' },
            { id: 2, referred_email: 'ref2@test.com', created_at: '2024-01-02', status: 'completed' },
          ],
        }),
      });

      const { result } = renderHook(() => useReferral('user-123'));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/referral');
      expect(result.current.stats).toEqual({
        referralCode: 'USER123',
        referralUrl: 'http://example.com?ref=USER123',
        totalReferrals: 2,
        referrals: [
          { id: 1, referred_email: 'ref1@test.com', created_at: '2024-01-01', status: 'completed' },
          { id: 2, referred_email: 'ref2@test.com', created_at: '2024-01-02', status: 'completed' },
        ],
      });
      expect(result.current.error).toBeNull();
    });

    test('should not fetch stats when user ID is undefined', () => {
      renderHook(() => useReferral(undefined));

      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should handle fetch error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useReferral('user-error'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.stats).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching referral stats:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    test('should handle non-OK response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useReferral('user-500'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch referral stats');
    });

    test('should refetch stats when refetch is called', async () => {
      const mockStats = {
        referralCode: 'REFETCH',
        referralUrl: 'http://example.com?ref=REFETCH',
        totalReferrals: 0,
        referrals: [],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockStats,
      });

      const { result } = renderHook(() => useReferral('user-refetch'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Call refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Tracking Referrals', () => {
    test('should track referral when code exists in localStorage', async () => {
      localStorage.setItem('referralCode', 'TRACK123');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useReferral('user-track'));

      const success = await act(async () => {
        return await result.current.trackReferral();
      });

      expect(success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referralCode: 'TRACK123' }),
      });
      expect(localStorage.getItem('referralCode')).toBeNull();
    });


    test('should return false when user ID is undefined', async () => {
      localStorage.setItem('referralCode', 'NOUSER');
      
      const { result } = renderHook(() => useReferral(undefined));

      const success = await act(async () => {
        return await result.current.trackReferral();
      });

      expect(success).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });



    test('should clear referral code after successful tracking', async () => {
      localStorage.setItem('referralCode', 'SUCCESS123');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useReferral('user-success'));

      await act(async () => {
        await result.current.trackReferral();
      });

      expect(localStorage.getItem('referralCode')).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Tracking referral with code:', 'SUCCESS123');
      expect(consoleSpy).toHaveBeenCalledWith('Referral tracked successfully');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Copy Referral Link', () => {
    test('should copy referral link to clipboard', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          referralCode: 'COPY123',
          referralUrl: 'http://example.com?ref=COPY123',
          totalReferrals: 0,
          referrals: [],
        }),
      });

      const { result } = renderHook(() => useReferral('user-copy'));

      await waitFor(() => {
        expect(result.current.stats).toBeTruthy();
      });

      const success = await act(async () => {
        return await result.current.copyReferralLink();
      });

      expect(success).toBe(true);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://example.com?ref=COPY123');
    });

    test('should return false when no referral URL exists', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          referralCode: null,
          referralUrl: null,
          totalReferrals: 0,
          referrals: [],
        }),
      });

      const { result } = renderHook(() => useReferral('user-nourl'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const success = await act(async () => {
        return await result.current.copyReferralLink();
      });

      expect(success).toBe(false);
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });

    test('should handle clipboard error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(new Error('Clipboard error'));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          referralCode: 'CLIPERROR',
          referralUrl: 'http://example.com?ref=CLIPERROR',
          totalReferrals: 0,
          referrals: [],
        }),
      });

      const { result } = renderHook(() => useReferral('user-cliperror'));

      await waitFor(() => {
        expect(result.current.stats).toBeTruthy();
      });

      const success = await act(async () => {
        return await result.current.copyReferralLink();
      });

      expect(success).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy to clipboard:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Hook State Management', () => {
    test('should initialize with correct default state', () => {
      const { result } = renderHook(() => useReferral('user-init'));

      expect(result.current.stats).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    test('should update when user ID changes', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          referralCode: 'CHANGE',
          referralUrl: 'http://example.com?ref=CHANGE',
          totalReferrals: 0,
          referrals: [],
        }),
      });

      const { result, rerender } = renderHook(
        ({ userId }) => useReferral(userId),
        { initialProps: { userId: 'user-1' } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Change user ID
      rerender({ userId: 'user-2' });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });
}); 