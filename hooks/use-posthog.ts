'use client'

import { usePostHog } from 'posthog-js/react'
import { useCallback } from 'react'

// Custom hook for PostHog analytics
export function useAnalytics() {
  const posthog = usePostHog()

  // Track custom events
  const track = useCallback((event: string, properties?: Record<string, any>) => {
    if (posthog) {
      posthog.capture(event, properties)
    }
  }, [posthog])

  // Track user identification
  const identify = useCallback((userId: string, userProperties?: Record<string, any>) => {
    if (posthog) {
      posthog.identify(userId, userProperties)
    }
  }, [posthog])

  // Track user properties
  const setUserProperties = useCallback((properties: Record<string, any>) => {
    if (posthog) {
      posthog.setPersonProperties(properties)
    }
  }, [posthog])

  // Track feature flags
  const getFeatureFlag = useCallback((flagKey: string) => {
    if (posthog) {
      return posthog.getFeatureFlag(flagKey)
    }
    return null
  }, [posthog])

  // Track page views manually
  const trackPageView = useCallback((url?: string) => {
    if (posthog) {
      posthog.capture('$pageview', {
        $current_url: url || window.location.href
      })
    }
  }, [posthog])

  // Track user actions
  const trackUserAction = useCallback((action: string, properties?: Record<string, any>) => {
    if (posthog) {
      posthog.capture(`user_${action}`, {
        timestamp: new Date().toISOString(),
        ...properties
      })
    }
  }, [posthog])

  return {
    track,
    identify,
    setUserProperties,
    getFeatureFlag,
    trackPageView,
    trackUserAction,
    posthog
  }
}

// Predefined tracking functions for common marketplace events
export const useMarketplaceAnalytics = () => {
  const { track, identify, setUserProperties } = useAnalytics()

  const trackProductView = useCallback((productId: string, productName: string, category?: string) => {
    track('product_viewed', {
      product_id: productId,
      product_name: productName,
      category,
      timestamp: new Date().toISOString()
    })
  }, [track])

  const trackAddToCart = useCallback((productId: string, productName: string, price: number) => {
    track('product_added_to_cart', {
      product_id: productId,
      product_name: productName,
      price,
      timestamp: new Date().toISOString()
    })
  }, [track])

  const trackPurchase = useCallback((orderId: string, total: number, items: any[]) => {
    track('purchase_completed', {
      order_id: orderId,
      total,
      item_count: items.length,
      items: items.map(item => ({
        product_id: item.productId,
        product_name: item.productName,
        price: item.price,
        quantity: item.quantity
      })),
      timestamp: new Date().toISOString()
    })
  }, [track])

  const trackSearch = useCallback((query: string, resultsCount: number) => {
    track('search_performed', {
      query,
      results_count: resultsCount,
      timestamp: new Date().toISOString()
    })
  }, [track])

  const trackSellerAction = useCallback((action: string, sellerId: string, properties?: Record<string, any>) => {
    track(`seller_${action}`, {
      seller_id: sellerId,
      timestamp: new Date().toISOString(),
      ...properties
    })
  }, [track])

  return {
    trackProductView,
    trackAddToCart,
    trackPurchase,
    trackSearch,
    trackSellerAction,
    identify,
    setUserProperties
  }
} 