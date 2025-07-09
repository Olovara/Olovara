'use client'

import { useMarketplaceAnalytics } from '@/hooks/use-posthog'
import { useEffect } from 'react'

interface ProductAnalyticsProps {
  productId: string
  productName: string
  category?: string
  price: number
  userId?: string
  userRole?: string
}

// Component to track product-related analytics
export function ProductAnalytics({ 
  productId, 
  productName, 
  category, 
  price, 
  userId, 
  userRole 
}: ProductAnalyticsProps) {
  const { 
    trackProductView, 
    trackAddToCart, 
    identify, 
    setUserProperties 
  } = useMarketplaceAnalytics()

  // Track product view when component mounts
  useEffect(() => {
    trackProductView(productId, productName, category)
  }, [productId, productName, category, trackProductView])

  // Identify user if available
  useEffect(() => {
    if (userId) {
      identify(userId, {
        role: userRole,
        last_product_viewed: productId
      })
      
      setUserProperties({
        preferred_category: category,
        last_activity: new Date().toISOString()
      })
    }
  }, [userId, userRole, productId, category, identify, setUserProperties])

  // Function to track add to cart (call this when user adds product to cart)
  const handleAddToCart = () => {
    trackAddToCart(productId, productName, price)
  }

  // This component doesn't render anything, it just tracks analytics
  return null
}

// Hook for tracking product interactions
export function useProductTracking(productId: string, productName: string, price: number) {
  const { trackAddToCart, trackProductView } = useMarketplaceAnalytics()

  const trackView = () => {
    trackProductView(productId, productName)
  }

  const trackCartAdd = () => {
    trackAddToCart(productId, productName, price)
  }

  return {
    trackView,
    trackCartAdd
  }
} 