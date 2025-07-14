import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

// Mock the database before importing the module
jest.mock('@/lib/db', () => ({
  db: {
    order: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { db } from '@/lib/db';
import { checkDigitalRefundEligibility, getDigitalRefundPolicy } from '@/lib/refund-policy';

describe('Refund Policy', () => {
  const mockDb = db as jest.Mocked<typeof db>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('checkDigitalRefundEligibility', () => {
    it('allows refund for physical products regardless of status', async () => {
      mockDb.order.findUnique.mockResolvedValue({
        id: 'order-1',
        isDigital: false,
        digitalDownloadAttempted: false,
        digitalDownloadedAt: null,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        createdAt: new Date(),
      } as any);

      const result = await checkDigitalRefundEligibility('order-1');

      expect(result.canRefund).toBe(true);
      expect(result.reason).toBe('Physical product - standard refund policy applies');
      expect(result.downloadAttempted).toBe(false);
    });

    it('allows refund for digital products that have not been downloaded', async () => {
      mockDb.order.findUnique.mockResolvedValue({
        id: 'order-1',
        isDigital: true,
        digitalDownloadAttempted: false,
        digitalDownloadedAt: null,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        createdAt: new Date(),
      } as any);

      const result = await checkDigitalRefundEligibility('order-1');

      expect(result.canRefund).toBe(true);
      expect(result.reason).toBe('Digital product not downloaded - refund allowed');
      expect(result.downloadAttempted).toBe(false);
    });

    it('denies refund for digital products that have been downloaded', async () => {
      const downloadDate = new Date('2024-01-15T10:30:00Z');
      mockDb.order.findUnique.mockResolvedValue({
        id: 'order-1',
        isDigital: true,
        digitalDownloadAttempted: true,
        digitalDownloadedAt: downloadDate,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        createdAt: new Date(),
      } as any);

      const result = await checkDigitalRefundEligibility('order-1');

      expect(result.canRefund).toBe(false);
      expect(result.reason).toBe('Digital product has been downloaded - no refund allowed');
      expect(result.downloadAttempted).toBe(true);
      expect(result.downloadedAt).toEqual(downloadDate);
    });

    it('handles missing order gracefully', async () => {
      mockDb.order.findUnique.mockResolvedValue(null);

      const result = await checkDigitalRefundEligibility('nonexistent-order');

      expect(result.canRefund).toBe(false);
      expect(result.reason).toBe('Order not found');
      expect(result.downloadAttempted).toBe(false);
    });

    it('handles database errors gracefully', async () => {
      mockDb.order.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const result = await checkDigitalRefundEligibility('order-1');

      expect(result.canRefund).toBe(false);
      expect(result.reason).toBe('Error checking refund eligibility');
      expect(result.downloadAttempted).toBe(false);
    });

    it('handles edge case where downloadAttempted is true but no download date', async () => {
      mockDb.order.findUnique.mockResolvedValue({
        id: 'order-1',
        isDigital: true,
        digitalDownloadAttempted: true,
        digitalDownloadedAt: null, // Edge case: attempted but no timestamp
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        createdAt: new Date(),
      } as any);

      const result = await checkDigitalRefundEligibility('order-1');

      expect(result.canRefund).toBe(false);
      expect(result.reason).toBe('Digital product has been downloaded - no refund allowed');
      expect(result.downloadAttempted).toBe(true);
      expect(result.downloadedAt).toBeUndefined();
    });
  });

  describe('getDigitalRefundPolicy', () => {
    it('returns the correct refund policy text', () => {
      const policy = getDigitalRefundPolicy();
      
      expect(policy).toBe('Digital products are eligible for refunds only if they have not been downloaded. Once downloaded, no refunds will be issued to prevent fraud.');
      expect(policy).toContain('Digital products');
      expect(policy).toContain('downloaded');
      expect(policy).toContain('fraud');
    });
  });

  describe('Download Tracking Integration', () => {
    it('simulates the download tracking flow', async () => {
      // Step 1: Initial order state (not downloaded)
      mockDb.order.findUnique.mockResolvedValue({
        id: 'order-1',
        isDigital: true,
        digitalDownloadAttempted: false,
        digitalDownloadedAt: null,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        createdAt: new Date(),
      } as any);

      let result = await checkDigitalRefundEligibility('order-1');
      expect(result.canRefund).toBe(true);

      // Step 2: After download attempt (simulate what happens in download API)
      mockDb.order.findUnique.mockResolvedValue({
        id: 'order-1',
        isDigital: true,
        digitalDownloadAttempted: true,
        digitalDownloadedAt: new Date('2024-01-15T10:30:00Z'),
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        createdAt: new Date(),
      } as any);

      result = await checkDigitalRefundEligibility('order-1');
      expect(result.canRefund).toBe(false);
      expect(result.downloadAttempted).toBe(true);
    });
  });

  describe('Refund Scenarios', () => {
    it('handles multiple download attempts correctly', async () => {
      // Even if someone tries to download multiple times, we only track the first attempt
      const downloadDate = new Date('2024-01-15T10:30:00Z');
      mockDb.order.findUnique.mockResolvedValue({
        id: 'order-1',
        isDigital: true,
        digitalDownloadAttempted: true,
        digitalDownloadedAt: downloadDate,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        createdAt: new Date(),
      } as any);

      const result = await checkDigitalRefundEligibility('order-1');
      expect(result.canRefund).toBe(false);
      expect(result.downloadedAt).toEqual(downloadDate);
    });

    it('handles refunded orders correctly', async () => {
      // This would be handled by the download API checking order status
      mockDb.order.findUnique.mockResolvedValue({
        id: 'order-1',
        isDigital: true,
        digitalDownloadAttempted: true,
        digitalDownloadedAt: new Date(),
        status: 'REFUNDED', // Order has been refunded
        paymentStatus: 'REFUNDED',
        createdAt: new Date(),
      } as any);

      const result = await checkDigitalRefundEligibility('order-1');
      // The refund policy should still deny refunds for downloaded products
      expect(result.canRefund).toBe(false);
      expect(result.reason).toBe('Digital product has been downloaded - no refund allowed');
    });
  });
}); 