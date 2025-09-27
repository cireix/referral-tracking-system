import { NextRequest } from 'next/server';
import { GET } from '../route';
import * as db from '@/lib/db';

// Mock database functions
jest.mock('@/lib/db', () => ({
  initDatabase: jest.fn(),
  validateReferralCode: jest.fn(),
}));

describe('Referral Validation API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/referral/validate', () => {
    test('should return 400 when no code is provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/referral/validate');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.valid).toBe(false);
      expect(data.error).toBe('No referral code provided');
    });

    test('should validate a valid referral code', async () => {
      (db.validateReferralCode as jest.Mock).mockResolvedValueOnce('user-123');

      const request = new NextRequest('http://localhost:3000/api/referral/validate?code=VALID123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(data.referrerId).toBe('user-123');
      expect(db.validateReferralCode).toHaveBeenCalledWith('VALID123');
    });

    test('should handle invalid referral code', async () => {
      (db.validateReferralCode as jest.Mock).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/referral/validate?code=INVALID');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(false);
      expect(data.referrerId).toBeUndefined();
      expect(db.validateReferralCode).toHaveBeenCalledWith('INVALID');
    });

    test('should handle database error gracefully', async () => {
      (db.validateReferralCode as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/referral/validate?code=ERROR');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.valid).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    test('should handle empty code parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/referral/validate?code=');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.valid).toBe(false);
      expect(data.error).toBe('No referral code provided');
    });

    test('should handle special characters in code', async () => {
      (db.validateReferralCode as jest.Mock).mockResolvedValueOnce('user-special');

      const request = new NextRequest('http://localhost:3000/api/referral/validate?code=ABC%2B123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(db.validateReferralCode).toHaveBeenCalledWith('ABC+123');
    });

    test('should handle multiple code parameters (use first)', async () => {
      (db.validateReferralCode as jest.Mock).mockResolvedValueOnce('user-multi');

      const request = new NextRequest('http://localhost:3000/api/referral/validate?code=FIRST&code=SECOND');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(db.validateReferralCode).toHaveBeenCalledWith('FIRST');
    });

    test('should handle case-sensitive codes', async () => {
      (db.validateReferralCode as jest.Mock).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/referral/validate?code=abc123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(false);
      expect(db.validateReferralCode).toHaveBeenCalledWith('abc123');
    });

    test('should log validation attempts', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      (db.validateReferralCode as jest.Mock).mockResolvedValueOnce('user-log');

      const request = new NextRequest('http://localhost:3000/api/referral/validate?code=LOG123');
      await GET(request);

      expect(consoleSpy).toHaveBeenCalledWith('[Referral Validate API] Validating code: LOG123');
      expect(consoleSpy).toHaveBeenCalledWith('[Referral Validate API] Code LOG123 is valid for user user-log');

      consoleSpy.mockRestore();
    });

    test('should log invalid code attempts', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      (db.validateReferralCode as jest.Mock).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/referral/validate?code=NOVALID');
      await GET(request);

      expect(consoleSpy).toHaveBeenCalledWith('[Referral Validate API] Validating code: NOVALID');
      expect(consoleSpy).toHaveBeenCalledWith('[Referral Validate API] Code NOVALID is invalid');

      consoleSpy.mockRestore();
    });
  });
}); 