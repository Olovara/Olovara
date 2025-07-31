import { db } from '@/lib/db';
import { getUserAnalytics, checkIPSuspicious } from '@/lib/ipinfo';

// Types for analytics data
export interface FraudRiskFactors {
  isProxy: boolean;
  unusualLocation: boolean;
  multipleAccounts: boolean;
  suspiciousBehavior: boolean;
  riskScore: number;
  reasons: string[];
}

export interface AnalyticsContext {
  sellerId?: string;
  productId?: string;
  category?: string;
  country?: string;
}

export interface AnalyticsMetrics {
  // Core metrics (always present)
  totalOrders: number;
  totalRevenue: number;
  totalViews: number;
  uniqueVisitors: number;
  conversionRate: number;
  averageOrderValue: number;
  
  // Context-specific metrics (stored in JSON)
  platformMetrics?: {
    totalSellers: number;
    totalBuyers: number;
    cartAbandonmentRate: number;
    fraudAttempts: number;
    chargebacks: number;
    disputes: number;
  };
  
  sellerMetrics?: {
    uniqueCustomers: number;
    repeatCustomers: number;
    customerRetentionRate: number;
    averageRating: number;
    totalReviews: number;
    chargebacks: number;
    disputes: number;
    refunds: number;
  };
  
  productMetrics?: {
    addToCart: number;
    timeOnPage: number;
    searchRanking: number;
    shares: number;
    favorites: number;
  };
  
  categoryMetrics?: {
    categoryPerformance: number;
    topProducts: any[];
    marketShare: number;
  };
  
  geographicMetrics?: {
    localConversionRate: number;
    shippingDestinations: number;
    regionalTrends: any[];
  };
}

/**
 * Enhanced fraud detection system with device fingerprinting integration
 */
export class FraudDetectionService {
  /**
   * Analyze user for fraud risk with enhanced device fingerprinting
   */
  static async analyzeUserRisk(userId: string, ipAddress: string, userAgent?: string, deviceFingerprint?: string): Promise<FraudRiskFactors> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check IP suspicious activity
    const ipCheck = await checkIPSuspicious(ipAddress);
    if (ipCheck.isSuspicious) {
      reasons.push(...ipCheck.reasons);
      riskScore += 0.3;
    }

    // Enhanced device fingerprinting analysis
    if (deviceFingerprint) {
      const deviceRisk = await this.analyzeDeviceRisk(userId, deviceFingerprint, ipAddress);
      reasons.push(...deviceRisk.reasons);
      riskScore += deviceRisk.riskScore;
    }

    // Check for multiple accounts from same IP
    const accountsFromIP = await db.user.count({
      where: {
        OR: [
          { signupIP: ipAddress },
          { lastLoginIP: ipAddress }
        ]
      }
    });

    if (accountsFromIP > 3) {
      reasons.push(`Multiple accounts from same IP (${accountsFromIP})`);
      riskScore += 0.4;
    }

    // Enhanced behavioral analysis using UserActivityLog
    const behavioralRisk = await this.analyzeBehavioralPatterns(userId, ipAddress);
    reasons.push(...behavioralRisk.reasons);
    riskScore += behavioralRisk.riskScore;

    // Check user's order history for suspicious patterns
    const userOrders = await db.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Check for unusual order patterns
    if (userOrders.length > 0) {
      const recentOrders = userOrders.filter(order => 
        new Date().getTime() - order.createdAt.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
      );

      if (recentOrders.length > 5) {
        reasons.push('Unusual number of orders in 24 hours');
        riskScore += 0.2;
      }

      // Check for chargebacks/disputes
      const chargebacks = await db.user.findUnique({
        where: { id: userId },
        select: { numChargebacks: true, numDisputes: true }
      });

      if (chargebacks && (chargebacks.numChargebacks > 2 || chargebacks.numDisputes > 2)) {
        reasons.push('High number of chargebacks/disputes');
        riskScore += 0.5;
      }
    }

    // Check for VPN/Proxy usage
    const isProxy = ipCheck.reasons.some(reason => 
      reason.includes('VPN') || reason.includes('Proxy')
    );

    // Check for unusual location patterns
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { signupLocation: true, lastLoginIP: true }
    });

    let unusualLocation = false;
    if (user?.signupLocation) {
      const signupCountry = (user.signupLocation as any)?.country;
      const currentLocation = await getUserAnalytics(ipAddress);
      
      if (signupCountry && (currentLocation as any)?.countryCode !== signupCountry) {
        reasons.push('Login from different country than signup');
        unusualLocation = true;
        riskScore += 0.2;
      }
    }

    return {
      isProxy,
      unusualLocation,
      multipleAccounts: accountsFromIP > 3,
      suspiciousBehavior: reasons.length > 0,
      riskScore: Math.min(riskScore, 1.0),
      reasons
    };
  }

  /**
   * Analyze device fingerprint for fraud risk
   */
  private static async analyzeDeviceRisk(userId: string, deviceFingerprint: string, ipAddress: string) {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check if this device is associated with multiple accounts
    const deviceUsers = await db.deviceFingerprint.findMany({
      where: { deviceId: deviceFingerprint },
      include: { user: { select: { id: true, email: true, role: true } } }
    });

    if (deviceUsers.length > 2) {
      reasons.push(`Device associated with ${deviceUsers.length} accounts`);
      riskScore += 0.3;
    }

    // Check if this device has been flagged before
    const suspiciousDeviceActivity = await db.userActivityLog.findMany({
      where: {
        deviceId: deviceFingerprint,
        action: { in: ['FAILED_LOGIN', 'SUSPICIOUS_ACTIVITY', 'FRAUD_ATTEMPT'] },
        success: false
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    if (suspiciousDeviceActivity.length > 3) {
      reasons.push(`Device has ${suspiciousDeviceActivity.length} suspicious activities`);
      riskScore += 0.4;
    }

    // Check for rapid location changes
    const recentDeviceActivity = await db.userActivityLog.findMany({
      where: {
        deviceId: deviceFingerprint,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (recentDeviceActivity.length > 0) {
      const locations = recentDeviceActivity
        .map(activity => activity.location)
        .filter(Boolean)
        .map(loc => (loc as any)?.countryCode)
        .filter(Boolean);

      const uniqueLocations = new Set(locations);
      if (uniqueLocations.size > 2) {
        reasons.push(`Device used from ${uniqueLocations.size} different countries in 24 hours`);
        riskScore += 0.5;
      }
    }

    return { reasons, riskScore };
  }

  /**
   * Analyze behavioral patterns using UserActivityLog
   */
  private static async analyzeBehavioralPatterns(userId: string, ipAddress: string) {
    const reasons: string[] = [];
    let riskScore = 0;

    // Get recent user activity
    const recentActivity = await db.userActivityLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Check for unusual login patterns
    const loginAttempts = recentActivity.filter(activity => 
      activity.action === 'LOGIN' || activity.action === 'FAILED_LOGIN'
    );

    if (loginAttempts.length > 10) {
      reasons.push(`Unusual number of login attempts (${loginAttempts.length})`);
      riskScore += 0.3;
    }

    // Check for failed login attempts
    const failedLogins = loginAttempts.filter(attempt => !attempt.success);
    if (failedLogins.length > 5) {
      reasons.push(`Multiple failed login attempts (${failedLogins.length})`);
      riskScore += 0.4;
    }

    // Check for rapid action sequences
    if (recentActivity.length > 50) {
      reasons.push(`Unusually high activity level (${recentActivity.length} actions in 24h)`);
      riskScore += 0.2;
    }

    // Check for actions from multiple IPs
    const uniqueIPs = new Set(recentActivity.map(activity => activity.ip));
    if (uniqueIPs.size > 3) {
      reasons.push(`Activity from ${uniqueIPs.size} different IP addresses`);
      riskScore += 0.3;
    }

    return { reasons, riskScore };
  }

  /**
   * Track user activity and detect fraud patterns
   */
  static async trackUserActivity(data: {
    userId: string;
    action: string;
    ipAddress: string;
    userAgent?: string;
    deviceFingerprint?: string;
    success?: boolean;
    details?: any;
  }) {
    // Log the activity
    const activity = await db.userActivityLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        ip: data.ipAddress,
        userAgent: data.userAgent,
        deviceId: data.deviceFingerprint,
        success: data.success,
        details: data.details
      }
    });

    // Update or create device fingerprint
    if (data.deviceFingerprint) {
      // Check if device fingerprint exists
      const existingFingerprint = await db.deviceFingerprint.findFirst({
        where: {
          userId: data.userId,
          deviceId: data.deviceFingerprint
        }
      });

      if (existingFingerprint) {
        // Update existing fingerprint
        await db.deviceFingerprint.update({
          where: { id: existingFingerprint.id },
          data: {
            ip: data.ipAddress,
            userAgent: data.userAgent,
            lastSeen: new Date()
          }
        });
      } else {
        // Create new fingerprint
        await db.deviceFingerprint.create({
          data: {
            userId: data.userId,
            deviceId: data.deviceFingerprint,
            ip: data.ipAddress,
            userAgent: data.userAgent,
            location: await getUserAnalytics(data.ipAddress),
            isProxy: (await checkIPSuspicious(data.ipAddress)).isSuspicious
          }
        });
      }
    }

    // Check for fraud patterns
    const fraudRisk = await this.analyzeUserRisk(
      data.userId, 
      data.ipAddress, 
      data.userAgent, 
      data.deviceFingerprint
    );

    // Create fraud event if risk is high
    if (fraudRisk.riskScore > 0.7) {
      await this.createFraudEvent({
        userId: data.userId,
        eventType: 'SUSPICIOUS_ACTIVITY',
        severity: fraudRisk.riskScore > 0.9 ? 'CRITICAL' : 
                 fraudRisk.riskScore > 0.8 ? 'HIGH' : 'MEDIUM',
        description: `High-risk activity detected: ${data.action}`,
        evidence: {
          activityId: activity.id,
          fraudRisk,
          action: data.action,
          details: data.details
        },
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      });
    }

    return activity;
  }

  /**
   * Create fraud detection event
   */
  static async createFraudEvent(data: {
    userId?: string;
    eventType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    evidence?: any;
    ipAddress?: string;
    userAgent?: string;
    orderId?: string;
    productId?: string;
    sellerId?: string;
    actionsTaken?: string[];
  }) {
    const riskScore = data.severity === 'CRITICAL' ? 1.0 :
                     data.severity === 'HIGH' ? 0.8 :
                     data.severity === 'MEDIUM' ? 0.5 : 0.2;

    return await db.fraudDetectionEvent.create({
      data: {
        ...data,
        riskScore,
        evidence: data.evidence ? JSON.stringify(data.evidence) : null,
        location: data.ipAddress ? await getUserAnalytics(data.ipAddress) : null
      }
    });
  }

  /**
   * Get fraud events for admin review
   */
  static async getFraudEvents(filters: {
    status?: string;
    severity?: string;
    eventType?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    return await db.fraudDetectionEvent.findMany({
      where: {
        ...(filters.status && { status: filters.status }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.eventType && { eventType: filters.eventType })
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0
    });
  }

  /**
   * Get device fingerprint analysis
   */
  static async getDeviceAnalysis(deviceId: string) {
    const deviceFingerprints = await db.deviceFingerprint.findMany({
      where: { deviceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true
          }
        }
      }
    });

    const activityLogs = await db.userActivityLog.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return {
      deviceFingerprints,
      activityLogs,
      associatedUsers: deviceFingerprints.length,
      totalActivity: activityLogs.length,
      suspiciousActivity: activityLogs.filter(log => !log.success).length
    };
  }
}

/**
 * Unified Analytics Service
 */
export class PlatformAnalyticsService {
  /**
   * Generate analytics for any context
   */
  static async generateAnalytics(
    context: AnalyticsContext,
    date: Date = new Date(),
    type: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'DAILY'
  ) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Build query based on context
    const whereClause: any = {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay
      },
      status: { in: ['COMPLETED', 'PROCESSING'] }
    };

    if (context.sellerId) {
      whereClause.sellerId = context.sellerId;
    }

    if (context.productId) {
      whereClause.productId = context.productId;
    }

    // Get orders for the context
    const orders = await db.order.findMany({
      where: whereClause
    });

    // Get abandoned carts for the context
    const abandonedCarts = await db.abandonedCart.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        },
        ...(context.sellerId && { sellerId: context.sellerId }),
        ...(context.productId && { productId: context.productId })
      }
    });

    // Calculate core metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    
    const totalCheckouts = totalOrders + abandonedCarts.length;
    const conversionRate = totalCheckouts > 0 ? (totalOrders / totalCheckouts) * 100 : 0;

    // Build context-specific metrics
    let metrics: any = {};

    if (!context.sellerId && !context.productId) {
      // Platform-wide metrics
      const fraudEvents = await db.fraudDetectionEvent.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      const chargebacks = await db.order.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: 'REFUNDED'
        }
      });

      metrics = {
        platformMetrics: {
          totalSellers: await db.seller.count(),
          totalBuyers: await db.user.count({ where: { role: 'MEMBER' } }),
          cartAbandonmentRate: totalCheckouts > 0 ? (abandonedCarts.length / totalCheckouts) * 100 : 0,
          fraudAttempts: fraudEvents,
          chargebacks,
          disputes: 0 // Would need to track disputes separately
        }
      };
    } else if (context.sellerId) {
      // Seller-specific metrics
      const uniqueCustomers = new Set(orders.map(order => order.userId)).size;
      
      const reviews = await db.review.findMany({
        where: {
          sellerId: context.sellerId,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: 'PUBLISHED'
        }
      });

      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0;

      const chargebacks = await db.order.count({
        where: {
          sellerId: context.sellerId,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: 'REFUNDED'
        }
      });

      metrics = {
        sellerMetrics: {
          uniqueCustomers,
          repeatCustomers: 0, // Would need to calculate based on historical data
          customerRetentionRate: 0, // Would need to calculate based on historical data
          averageRating,
          totalReviews: reviews.length,
          chargebacks,
          disputes: 0,
          refunds: chargebacks
        }
      };
    } else if (context.productId) {
      // Product-specific metrics
      metrics = {
        productMetrics: {
          addToCart: 0, // Would need to track add to cart events
          timeOnPage: 0, // Would need to track page view events
          searchRanking: 0, // Would need to track search events
          shares: 0, // Would need to track social events
          favorites: 0 // Would need to track favorite events
        }
      };
    }

    // Check if analytics record already exists
    const existing = await db.platformAnalytics.findFirst({
      where: {
        date: startOfDay,
        type,
        sellerId: context.sellerId || null,
        productId: context.productId || null,
        category: context.category || null,
        country: context.country || null
      }
    });

    if (existing) {
      // Update existing record
      return await db.platformAnalytics.update({
        where: { id: existing.id },
        data: {
          totalOrders,
          totalRevenue,
          averageOrderValue,
          conversionRate,
          metrics,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new record
      return await db.platformAnalytics.create({
        data: {
          date: startOfDay,
          type,
          sellerId: context.sellerId || null,
          productId: context.productId || null,
          category: context.category || null,
          country: context.country || null,
          totalOrders,
          totalRevenue,
          averageOrderValue,
          conversionRate,
          metrics
        }
      });
    }
  }

  /**
   * Get analytics for any context
   */
  static async getAnalytics(
    context: AnalyticsContext,
    startDate: Date,
    endDate: Date,
    type: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'DAILY'
  ) {
    const whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate
      },
      type
    };

    if (context.sellerId) {
      whereClause.sellerId = context.sellerId;
    }

    if (context.productId) {
      whereClause.productId = context.productId;
    }

    if (context.category) {
      whereClause.category = context.category;
    }

    if (context.country) {
      whereClause.country = context.country;
    }

    return await db.platformAnalytics.findMany({
      where: whereClause,
      orderBy: { date: 'asc' }
    });
  }

  /**
   * Get platform-wide analytics
   */
  static async getPlatformAnalytics(startDate: Date, endDate: Date) {
    return await this.getAnalytics({}, startDate, endDate);
  }

  /**
   * Get seller analytics
   */
  static async getSellerAnalytics(sellerId: string, startDate: Date, endDate: Date) {
    return await this.getAnalytics({ sellerId }, startDate, endDate);
  }

  /**
   * Get product analytics
   */
  static async getProductAnalytics(productId: string, startDate: Date, endDate: Date) {
    return await this.getAnalytics({ productId }, startDate, endDate);
  }

  /**
   * Get category analytics
   */
  static async getCategoryAnalytics(category: string, startDate: Date, endDate: Date) {
    return await this.getAnalytics({ category }, startDate, endDate);
  }

  /**
   * Get geographic analytics
   */
  static async getGeographicAnalytics(country: string, startDate: Date, endDate: Date) {
    return await this.getAnalytics({ country }, startDate, endDate);
  }

  /**
   * Track product view
   */
  static async trackProductView(productId: string, userId?: string, ipAddress?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get or create product analytics for today
    const existing = await db.platformAnalytics.findFirst({
      where: {
        date: today,
        type: 'DAILY',
        sellerId: null,
        productId,
        category: null,
        country: null
      }
    });

    if (existing) {
      await db.platformAnalytics.update({
        where: { id: existing.id },
        data: {
          totalViews: { increment: 1 },
          uniqueVisitors: userId ? { increment: 1 } : { increment: 0 }
        }
      });
    } else {
      await db.platformAnalytics.create({
        data: {
          date: today,
          type: 'DAILY',
          sellerId: null,
          productId,
          category: null,
          country: null,
          totalViews: 1,
          uniqueVisitors: userId ? 1 : 0
        }
      });
    }
  }

  /**
   * Track product purchase
   */
  static async trackProductPurchase(productId: string, orderAmount: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await db.platformAnalytics.findFirst({
      where: {
        date: today,
        type: 'DAILY',
        sellerId: null,
        productId,
        category: null,
        country: null
      }
    });

    if (existing) {
      await db.platformAnalytics.update({
        where: { id: existing.id },
        data: {
          totalOrders: { increment: 1 },
          totalRevenue: { increment: orderAmount },
          conversionRate: {
            set: ((existing.totalOrders + 1) / existing.totalViews) * 100
          }
        }
      });
    } else {
      await db.platformAnalytics.create({
        data: {
          date: today,
          type: 'DAILY',
          sellerId: null,
          productId,
          category: null,
          country: null,
          totalOrders: 1,
          totalRevenue: orderAmount,
          conversionRate: 0
        }
      });
    }
  }
}

// Enhanced Analytics Services for User Behavior Tracking
export class UserBehaviorService {
  static async trackBehaviorEvent(data: {
    userId?: string;
    sessionId: string;
    eventType: string;
    pageUrl: string;
    referrerUrl?: string;
    elementId?: string;
    elementType?: string;
    elementText?: string;
    interactionData?: any;
    timeOnPage?: number;
    scrollDepth?: number;
    mouseMovements?: number;
    clicks?: number;
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: any;
    isFirstVisit?: boolean;
    visitNumber?: number;
    sessionDuration?: number;
  }) {
    try {
      const event = await db.userBehaviorEvent.create({
        data: {
          userId: data.userId,
          sessionId: data.sessionId,
          eventType: data.eventType,
          pageUrl: data.pageUrl,
          referrerUrl: data.referrerUrl,
          elementId: data.elementId,
          elementType: data.elementType,
          elementText: data.elementText,
          interactionData: data.interactionData,
          timeOnPage: data.timeOnPage,
          scrollDepth: data.scrollDepth,
          mouseMovements: data.mouseMovements,
          clicks: data.clicks,
          deviceId: data.deviceId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          location: data.location,
          isFirstVisit: data.isFirstVisit,
          visitNumber: data.visitNumber,
          sessionDuration: data.sessionDuration,
        }
      });

      // Update session metrics
      await this.updateSessionMetrics(data.sessionId, data.eventType);

      return event;
    } catch (error) {
      console.error('Error tracking behavior event:', error);
      throw error;
    }
  }

  private static async updateSessionMetrics(sessionId: string, eventType: string) {
    try {
      const session = await db.userSession.findUnique({
        where: { sessionId }
      });

      if (session) {
        const updates: any = {};
        
        switch (eventType) {
          case 'PAGE_VIEW':
            updates.pageViews = { increment: 1 };
            break;
          case 'SEARCH':
            updates.searches = { increment: 1 };
            break;
          case 'PRODUCT_VIEW':
            updates.productViews = { increment: 1 };
            break;
          case 'ADD_TO_CART':
            updates.cartAdditions = { increment: 1 };
            break;
          case 'PURCHASE':
            updates.purchases = { increment: 1 };
            updates.converted = true;
            break;
        }

        if (Object.keys(updates).length > 0) {
          await db.userSession.update({
            where: { sessionId },
            data: updates
          });
        }
      }
    } catch (error) {
      console.error('Error updating session metrics:', error);
    }
  }

  static async getBehaviorAnalytics(filters: {
    userId?: string;
    sessionId?: string;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    deviceId?: string;
  } = {}) {
    try {
      const where: any = {};

      if (filters.userId) where.userId = filters.userId;
      if (filters.sessionId) where.sessionId = filters.sessionId;
      if (filters.eventType) where.eventType = filters.eventType;
      if (filters.deviceId) where.deviceId = filters.deviceId;
      if (filters.startDate || filters.endDate) {
        where.timestamp = {};
        if (filters.startDate) where.timestamp.gte = filters.startDate;
        if (filters.endDate) where.timestamp.lte = filters.endDate;
      }

      const events = await db.userBehaviorEvent.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true
            }
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      return events;
    } catch (error) {
      console.error('Error getting behavior analytics:', error);
      throw error;
    }
  }
}

export class SearchAnalyticsService {
  static async trackSearch(data: {
    userId?: string;
    sessionId: string;
    query: string;
    searchType: string;
    filters?: any;
    sortBy?: string;
    resultsCount: number;
    resultsShown: number;
    searchTime?: number;
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: any;
  }) {
    try {
      const searchAnalytics = await db.searchAnalytics.create({
        data: {
          userId: data.userId,
          sessionId: data.sessionId,
          query: data.query,
          queryLength: data.query.length,
          searchType: data.searchType,
          filters: data.filters,
          sortBy: data.sortBy,
          resultsCount: data.resultsCount,
          resultsShown: data.resultsShown,
          searchTime: data.searchTime,
          deviceId: data.deviceId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          location: data.location,
        }
      });

      return searchAnalytics;
    } catch (error) {
      console.error('Error tracking search:', error);
      throw error;
    }
  }

  static async trackSearchClick(data: {
    searchId: string;
    clickedResult: number;
    clickedProductId?: string;
    clickedSellerId?: string;
    timeToClick?: number;
  }) {
    try {
      const updated = await db.searchAnalytics.update({
        where: { id: data.searchId },
        data: {
          clickedResult: data.clickedResult,
          clickedProductId: data.clickedProductId,
          clickedSellerId: data.clickedSellerId,
          timeToClick: data.timeToClick,
        }
      });

      return updated;
    } catch (error) {
      console.error('Error tracking search click:', error);
      throw error;
    }
  }

  static async getPopularSearches(days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const searches = await db.searchAnalytics.groupBy({
        by: ['query'],
        where: {
          timestamp: { gte: startDate }
        },
        _count: {
          query: true
        },
        _avg: {
          timeToClick: true,
          resultsCount: true
        },
        orderBy: {
          _count: {
            query: 'desc'
          }
        },
        take: 20
      });

      return searches.map(search => ({
        query: search.query,
        count: search._count.query,
        avgTimeToClick: search._avg.timeToClick,
        avgResultsCount: search._avg.resultsCount
      }));
    } catch (error) {
      console.error('Error getting popular searches:', error);
      throw error;
    }
  }

  static async getSearchAnalytics(filters: {
    userId?: string;
    sessionId?: string;
    searchType?: string;
    startDate?: Date;
    endDate?: Date;
    query?: string;
  } = {}) {
    try {
      const where: any = {};

      if (filters.userId) where.userId = filters.userId;
      if (filters.sessionId) where.sessionId = filters.sessionId;
      if (filters.searchType) where.searchType = filters.searchType;
      if (filters.query) where.query = { contains: filters.query, mode: 'insensitive' };
      if (filters.startDate || filters.endDate) {
        where.timestamp = {};
        if (filters.startDate) where.timestamp.gte = filters.startDate;
        if (filters.endDate) where.timestamp.lte = filters.endDate;
      }

      const searches = await db.searchAnalytics.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true
            }
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      return searches;
    } catch (error) {
      console.error('Error getting search analytics:', error);
      throw error;
    }
  }
}

export class ProductInteractionService {
  static async trackProductInteraction(data: {
    userId?: string;
    productId: string;
    sessionId: string;
    interactionType: string;
    interactionData?: any;
    timeOnProduct?: number;
    imagesViewed?: number;
    descriptionRead?: boolean;
    reviewsViewed?: number;
    sellerInfoViewed?: boolean;
    sourceType?: string;
    sourceId?: string;
    referrerUrl?: string;
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: any;
  }) {
    try {
      const interaction = await db.productInteraction.create({
        data: {
          userId: data.userId,
          productId: data.productId,
          sessionId: data.sessionId,
          interactionType: data.interactionType,
          interactionData: data.interactionData,
          timeOnProduct: data.timeOnProduct,
          imagesViewed: data.imagesViewed,
          descriptionRead: data.descriptionRead,
          reviewsViewed: data.reviewsViewed,
          sellerInfoViewed: data.sellerInfoViewed,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          referrerUrl: data.referrerUrl,
          deviceId: data.deviceId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          location: data.location,
        }
      });

      return interaction;
    } catch (error) {
      console.error('Error tracking product interaction:', error);
      throw error;
    }
  }

  static async getProductAnalytics(productId: string, startDate?: Date, endDate?: Date) {
    try {
      const where: any = { productId };
      
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = startDate;
        if (endDate) where.timestamp.lte = endDate;
      }

      const interactions = await db.productInteraction.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              seller: {
                select: {
                  id: true,
                  shopName: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              email: true,
              username: true
            }
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      // Aggregate metrics
      const metrics = {
        totalViews: interactions.filter(i => i.interactionType === 'VIEW').length,
        totalClicks: interactions.filter(i => i.interactionType === 'CLICK').length,
        totalAddToCart: interactions.filter(i => i.interactionType === 'ADD_TO_CART').length,
        totalFavorites: interactions.filter(i => i.interactionType === 'FAVORITE').length,
        totalShares: interactions.filter(i => i.interactionType === 'SHARE').length,
        avgTimeOnProduct: interactions
          .filter(i => i.timeOnProduct)
          .reduce((sum, i) => sum + (i.timeOnProduct || 0), 0) / 
          interactions.filter(i => i.timeOnProduct).length || 0,
        avgImagesViewed: interactions
          .filter(i => i.imagesViewed)
          .reduce((sum, i) => sum + (i.imagesViewed || 0), 0) / 
          interactions.filter(i => i.imagesViewed).length || 0,
        descriptionReadRate: interactions.filter(i => i.descriptionRead).length / interactions.length || 0,
        sellerInfoViewedRate: interactions.filter(i => i.sellerInfoViewed).length / interactions.length || 0,
        sourceBreakdown: interactions.reduce((acc, i) => {
          const source = i.sourceType || 'unknown';
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return {
        interactions,
        metrics
      };
    } catch (error) {
      console.error('Error getting product analytics:', error);
      throw error;
    }
  }

  static async getTopProducts(days: number = 7, limit: number = 10) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const topProducts = await db.productInteraction.groupBy({
        by: ['productId'],
        where: {
          timestamp: { gte: startDate },
          interactionType: 'VIEW'
        },
        _count: {
          productId: true
        },
        orderBy: {
          _count: {
            productId: 'desc'
          }
        },
        take: limit
      });

      // Get product details
      const productIds = topProducts.map(p => p.productId);
      const products = await db.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          price: true,
          images: true,
          seller: {
            select: {
              id: true,
              shopName: true
            }
          }
        }
      });

      return topProducts.map(product => ({
        productId: product.productId,
        views: product._count.productId,
        product: products.find(p => p.id === product.productId)
      }));
    } catch (error) {
      console.error('Error getting top products:', error);
      throw error;
    }
  }
}

export class UserSessionService {
  static async createSession(data: {
    userId?: string;
    sessionId: string;
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: any;
    browser?: string;
    os?: string;
    deviceType?: string;
    isFirstVisit?: boolean;
    visitNumber?: number;
    returningUser?: boolean;
  }) {
    try {
      // First check if session already exists
      const existingSession = await db.userSession.findUnique({
        where: { sessionId: data.sessionId }
      });

      if (existingSession) {
        // Session already exists, return it
        return existingSession;
      }

      // Create new session
      const session = await db.userSession.create({
        data: {
          userId: data.userId,
          sessionId: data.sessionId,
          deviceId: data.deviceId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          location: data.location,
          browser: data.browser,
          os: data.os,
          deviceType: data.deviceType,
          isFirstVisit: data.isFirstVisit,
          visitNumber: data.visitNumber,
          returningUser: data.returningUser,
        }
      });

      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  static async endSession(sessionId: string, conversionValue?: number) {
    try {
      const session = await db.userSession.findUnique({
        where: { sessionId }
      });

      if (session) {
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);

        await db.userSession.update({
          where: { sessionId },
          data: {
            endTime,
            duration,
            isActive: false,
            conversionValue: conversionValue || session.conversionValue
          }
        });
      }
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  static async getSessionAnalytics(filters: {
    userId?: string;
    deviceId?: string;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
  } = {}) {
    try {
      const where: any = {};

      if (filters.userId) where.userId = filters.userId;
      if (filters.deviceId) where.deviceId = filters.deviceId;
      if (filters.isActive !== undefined) where.isActive = filters.isActive;
      if (filters.startDate || filters.endDate) {
        where.startTime = {};
        if (filters.startDate) where.startTime.gte = filters.startDate;
        if (filters.endDate) where.startTime.lte = filters.endDate;
      }

      const sessions = await db.userSession.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true
            }
          }
        },
        orderBy: { startTime: 'desc' }
      });

      return sessions;
    } catch (error) {
      console.error('Error getting session analytics:', error);
      throw error;
    }
  }
} 