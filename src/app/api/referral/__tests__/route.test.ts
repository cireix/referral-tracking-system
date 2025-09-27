import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { stackServerApp } from '@/stack/server';
import * as db from '@/lib/db';

// Mock Stack server app
jest.mock('@/stack/server', () => ({
  stackServerApp: {
    getUser: jest.fn(),
  },
}));

// Mock database functions
jest.mock('@/lib/db', () => ({
  initDatabase: jest.fn(),
  getReferralStats: jest.fn(),
  validateReferralCode: jest.fn(),
  trackReferral: jest.fn(),
}));

describe('Referral API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/referral', () => {
    test('should return 401 when user is not authenticated', async () => {
      (stackServerApp.getUser as jest.Mock).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/referral');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('should return referral stats for authenticated user', async () => {
      const mockUser = {
        id: 'user-123',
        primaryEmail: 'user@example.com',
      };

      const mockStats = {
        referralCode: 'ABC123',
        totalReferrals: 3,
        referrals: [
          {
            id: 1,
            referred_email: 'ref1@example.com',
            created_at: '2024-01-01',
            status: 'completed',
          },
          {
            id: 2,
            referred_email: 'ref2@example.com',
            created_at: '2024-01-02',
            status: 'completed',
          },
        ],
      };

      (stackServerApp.getUser as jest.Mock).mockResolvedValueOnce(mockUser);
      (db.getReferralStats as jest.Mock).mockResolvedValueOnce(mockStats);

      const request = new NextRequest('http://localhost:3000/api/referral');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.referralCode).toBe('ABC123');
      expect(data.referralUrl).toContain('?ref=ABC123');
      expect(data.totalReferrals).toBe(3);
      expect(data.referrals).toHaveLength(2);
      expect(db.getReferralStats).toHaveBeenCalledWith('user-123');
    });

    test('should handle database error gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        primaryEmail: 'user@example.com',
      };

      (stackServerApp.getUser as jest.Mock).mockResolvedValueOnce(mockUser);
      (db.getReferralStats as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/referral');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    test('should use custom base URL when environment variable is set', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_BASE_URL;
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com';

      const mockUser = {
        id: 'user-123',
        primaryEmail: 'user@example.com',
      };

      const mockStats = {
        referralCode: 'XYZ789',
        totalReferrals: 0,
        referrals: [],
      };

      (stackServerApp.getUser as jest.Mock).mockResolvedValueOnce(mockUser);
      (db.getReferralStats as jest.Mock).mockResolvedValueOnce(mockStats);

      const request = new NextRequest('http://localhost:3000/api/referral');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.referralUrl).toBe('https://example.com?ref=XYZ789');

      // Restore environment variable
      process.env.NEXT_PUBLIC_BASE_URL = originalEnv;
    });

    test('should handle user without referral code', async () => {
      const mockUser = {
        id: 'user-456',
        primaryEmail: 'noref@example.com',
      };

      const mockStats = {
        referralCode: null,
        totalReferrals: 0,
        referrals: [],
      };

      (stackServerApp.getUser as jest.Mock).mockResolvedValueOnce(mockUser);
      (db.getReferralStats as jest.Mock).mockResolvedValueOnce(mockStats);

      const request = new NextRequest('http://localhost:3000/api/referral');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.referralCode).toBeNull();
      expect(data.referralUrl).toBeNull();
      expect(data.totalReferrals).toBe(0);
    });
  });

  describe('POST /api/referral', () => {
    test('should return 401 when user is not authenticated', async () => {
      (stackServerApp.getUser as jest.Mock).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/referral', {
        method: 'POST',
        body: JSON.stringify({ referralCode: 'ABC123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('should return 400 when referral code is missing', async () => {
      const mockUser = {
        id: 'user-123',
        primaryEmail: 'user@example.com',
      };

      (stackServerApp.getUser as jest.Mock).mockResolvedValueOnce(mockUser);

      const request = {
        json: async () => ({}),
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Referral code is required');
    });

    test('should return 400 for invalid referral code', async () => {
      const mockUser = {
        id: 'user-123',
        primaryEmail: 'user@example.com',
      };

      (stackServerApp.getUser as jest.Mock).mockResolvedValueOnce(mockUser);
      (db.validateReferralCode as jest.Mock).mockResolvedValueOnce(null);

      const request = {
        json: async () => ({ referralCode: 'INVALID' }),
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid referral code');
      expect(db.validateReferralCode).toHaveBeenCalledWith('INVALID');
    });

    test('should prevent self-referral', async () => {
      const mockUser = {
        id: 'user-123',
        primaryEmail: 'user@example.com',
      };

      (stackServerApp.getUser as jest.Mock).mockResolvedValueOnce(mockUser);
      (db.validateReferralCode as jest.Mock).mockResolvedValueOnce('user-123'); // Same as current user

      const request = {
        json: async () => ({ referralCode: 'MYCODE' }),
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cannot refer yourself');
    });

    test('should successfully track referral', async () => {
      const mockUser = {
        id: 'referred-user',
        primaryEmail: 'referred@example.com',
      };

      (stackServerApp.getUser as jest.Mock).mockResolvedValueOnce(mockUser);
      (db.validateReferralCode as jest.Mock).mockResolvedValueOnce('referrer-123');
      (db.trackReferral as jest.Mock).mockResolvedValueOnce(true);

      const request = {
        json: async () => ({ referralCode: 'REF123' }),
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Referral tracked successfully');
      expect(db.trackReferral).toHaveBeenCalledWith(
        'referrer-123',
        'referred-user',
        'REF123',
        'referred@example.com'
      );
    });

    test('should handle already referred user', async () => {
      const mockUser = {
        id: 'already-referred',
        primaryEmail: 'already@example.com',
      };

      (stackServerApp.getUser as jest.Mock).mockResolvedValueOnce(mockUser);
      (db.validateReferralCode as jest.Mock).mockResolvedValueOnce('referrer-456');
      (db.trackReferral as jest.Mock).mockResolvedValueOnce(false);

      const request = {
        json: async () => ({ referralCode: 'REF456' }),
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User has already been referred or referral could not be tracked');
    });

    test('should handle user without email', async () => {
      const mockUser = {
        id: 'no-email-user',
        primaryEmail: null,
      };

      (stackServerApp.getUser as jest.Mock).mockResolvedValueOnce(mockUser);
      (db.validateReferralCode as jest.Mock).mockResolvedValueOnce('referrer-789');
      (db.trackReferral as jest.Mock).mockResolvedValueOnce(true);

      const request = {
        json: async () => ({ referralCode: 'REF789' }),
      } as NextRequest;

      const response = await POST(request);
      await response.json();

      expect(response.status).toBe(200);
      expect(db.trackReferral).toHaveBeenCalledWith(
        'referrer-789',
        'no-email-user',
        'REF789',
        undefined
      );
    });

    test('should handle database error during tracking', async () => {
      const mockUser = {
        id: 'user-error',
        primaryEmail: 'error@example.com',
      };

      (stackServerApp.getUser as jest.Mock).mockResolvedValueOnce(mockUser);
      (db.validateReferralCode as jest.Mock).mockResolvedValueOnce('referrer-error');
      (db.trackReferral as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      const request = {
        json: async () => ({ referralCode: 'ERROR123' }),
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
}); 