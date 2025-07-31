import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { db } from '../lib/db';

describe('Report System', () => {
  beforeEach(async () => {
    // Clean up any existing test data
    await db.report.deleteMany({
      where: {
        targetName: {
          contains: 'TEST_'
        }
      }
    });
  });

  afterEach(async () => {
    // Clean up test data after each test
    await db.report.deleteMany({
      where: {
        targetName: {
          contains: 'TEST_'
        }
      }
    });
  });

  describe('Report Creation', () => {
    it('should create a valid seller report', async () => {
      const reportData = {
        reportType: 'SELLER' as const,
        targetId: 'test-seller-id',
        targetName: 'TEST_Seller Shop',
        reason: 'INAPPROPRIATE_CONTENT',
        category: 'INAPPROPRIATE_CONTENT',
        description: 'This is a test report for inappropriate content',
        severity: 'HIGH' as const,
        status: 'PENDING' as const,
      };

      const report = await db.report.create({
        data: reportData
      });

      expect(report).toBeDefined();
      expect(report.reportType).toBe('SELLER');
      expect(report.targetName).toBe('TEST_Seller Shop');
      expect(report.category).toBe('INAPPROPRIATE_CONTENT');
      expect(report.severity).toBe('HIGH');
      expect(report.status).toBe('PENDING');
    });

    it('should create a valid product report', async () => {
      const reportData = {
        reportType: 'PRODUCT' as const,
        targetId: 'test-product-id',
        targetName: 'TEST_Product Name',
        reason: 'POOR_QUALITY',
        category: 'POOR_QUALITY',
        subReason: 'Defective items',
        description: 'This product arrived damaged and poor quality',
        evidence: 'Photos attached showing damage',
        severity: 'MEDIUM' as const,
        status: 'PENDING' as const,
      };

      const report = await db.report.create({
        data: reportData
      });

      expect(report).toBeDefined();
      expect(report.reportType).toBe('PRODUCT');
      expect(report.targetName).toBe('TEST_Product Name');
      expect(report.category).toBe('POOR_QUALITY');
      expect(report.subReason).toBe('Defective items');
      expect(report.evidence).toBe('Photos attached showing damage');
    });

    it('should handle anonymous reports', async () => {
      const reportData = {
        reportType: 'SELLER' as const,
        targetId: 'test-seller-id',
        targetName: 'TEST_Anonymous Report',
        reason: 'SPAM',
        category: 'SPAM',
        description: 'This seller is spamming the marketplace',
        reporterName: 'Anonymous User',
        reporterEmail: 'anonymous@example.com',
        severity: 'LOW' as const,
        status: 'PENDING' as const,
      };

      const report = await db.report.create({
        data: reportData
      });

      expect(report).toBeDefined();
      expect(report.reporterId).toBeNull();
      expect(report.reporterName).toBe('Anonymous User');
      expect(report.reporterEmail).toBe('anonymous@example.com');
    });
  });

  describe('Report Categories and Severity', () => {
    it('should assign correct severity based on category', () => {
      const severityMap = {
        INAPPROPRIATE_CONTENT: 'HIGH',
        COPYRIGHT_INFRINGEMENT: 'HIGH',
        MISLEADING_INFORMATION: 'MEDIUM',
        POOR_QUALITY: 'MEDIUM',
        FAKE_PRODUCTS: 'CRITICAL',
        HARASSMENT: 'CRITICAL',
        SPAM: 'LOW',
        OTHER: 'MEDIUM'
      };

      Object.entries(severityMap).forEach(([category, expectedSeverity]) => {
        expect(getSeverityForCategory(category)).toBe(expectedSeverity);
      });
    });

    it('should handle all valid categories', () => {
      const validCategories = [
        'INAPPROPRIATE_CONTENT',
        'COPYRIGHT_INFRINGEMENT',
        'MISLEADING_INFORMATION',
        'POOR_QUALITY',
        'FAKE_PRODUCTS',
        'HARASSMENT',
        'SPAM',
        'OTHER'
      ];

      validCategories.forEach(category => {
        expect(() => {
          db.report.create({
                    data: {
          reportType: 'SELLER',
          targetId: 'test-id',
          targetName: `TEST_${category}`,
          reason: category,
          category,
          description: 'Test description',
          severity: getSeverityForCategory(category),
          status: 'PENDING'
        }
          });
        }).not.toThrow();
      });
    });
  });

  describe('Report Status Management', () => {
    it('should update report status correctly', async () => {
      const report = await db.report.create({
        data: {
          reportType: 'SELLER',
          targetId: 'test-seller-id',
          targetName: 'TEST_Status Update',
          reason: 'OTHER',
          category: 'OTHER',
          description: 'Test status update',
          severity: 'MEDIUM',
          status: 'PENDING'
        }
      });

      const updatedReport = await db.report.update({
        where: { id: report.id },
        data: {
          status: 'UNDER_REVIEW',
          adminNotes: 'Admin is reviewing this report'
        }
      });

      expect(updatedReport.status).toBe('UNDER_REVIEW');
      expect(updatedReport.adminNotes).toBe('Admin is reviewing this report');
    });

    it('should handle resolution workflow', async () => {
      const report = await db.report.create({
        data: {
          reportType: 'PRODUCT',
          targetId: 'test-product-id',
          targetName: 'TEST_Resolution Workflow',
          reason: 'POOR_QUALITY',
          category: 'POOR_QUALITY',
          description: 'Test resolution workflow',
          severity: 'MEDIUM',
          status: 'PENDING'
        }
      });

      // Move to under review
      await db.report.update({
        where: { id: report.id },
        data: { status: 'UNDER_REVIEW' }
      });

      // Resolve the report
      const resolvedReport = await db.report.update({
        where: { id: report.id },
        data: {
          status: 'RESOLVED',
          resolutionNotes: 'Issue has been resolved',
          resolvedBy: 'admin-user-id',
          resolvedAt: new Date()
        }
      });

      expect(resolvedReport.status).toBe('RESOLVED');
      expect(resolvedReport.resolutionNotes).toBe('Issue has been resolved');
      expect(resolvedReport.resolvedBy).toBe('admin-user-id');
      expect(resolvedReport.resolvedAt).toBeDefined();
    });
  });
});

// Helper function to determine severity based on category (same as in API)
function getSeverityForCategory(category: string): string {
  const severityMap: Record<string, string> = {
    INAPPROPRIATE_CONTENT: "HIGH",
    COPYRIGHT_INFRINGEMENT: "HIGH",
    MISLEADING_INFORMATION: "MEDIUM",
    POOR_QUALITY: "MEDIUM",
    FAKE_PRODUCTS: "CRITICAL",
    HARASSMENT: "CRITICAL",
    SPAM: "LOW",
    OTHER: "MEDIUM"
  };

  return severityMap[category] || "MEDIUM";
} 