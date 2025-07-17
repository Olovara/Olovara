'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useMarketplaceAnalytics } from './use-posthog'

interface CartData {
  productId: string
  productName: string
  price: number
  quantity: number
  total: number
  isDigital: boolean
  sellerId?: string
  discountCode?: string
  discountAmount?: number
  currency?: string
  shippingCost?: number
  handlingFee?: number
  saleDiscount?: number
}

interface CheckoutStep {
  name: string
  completedAt: Date
  data?: any
}

export function useAbandonedCart(cartData: CartData) {
  const {
    trackCheckoutStarted,
    trackCheckoutStep,
    trackCheckoutAbandoned,
    trackCheckoutCompleted,
    trackCheckoutError
  } = useMarketplaceAnalytics()

  const [isTracking, setIsTracking] = useState(false)
  const [steps, setSteps] = useState<CheckoutStep[]>([])
  const [startTime] = useState(new Date())
  const [lastActivity, setLastActivity] = useState(new Date())
  const [currentStep, setCurrentStep] = useState<string>('')
  const [sessionId] = useState(() => `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [pageViews, setPageViews] = useState(1)
  const [scrollDepth, setScrollDepth] = useState(0)
  
  const activityTimeoutRef = useRef<NodeJS.Timeout>()
  const pageUnloadRef = useRef<boolean>(false)
  const hasStartedTrackingRef = useRef<boolean>(false)
  const isAbandonedRef = useRef<boolean>(false)

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = (scrollTop / docHeight) * 100
      setScrollDepth(Math.max(scrollDepth, scrollPercent))
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrollDepth])

  // Save abandoned cart to database
  const saveAbandonedCart = useCallback(async (reason: string) => {
    // Prevent duplicate saves
    if (isAbandonedRef.current) return
    isAbandonedRef.current = true

    try {
      const response = await fetch('/api/analytics/abandoned-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          productId: cartData.productId,
          productName: cartData.productName,
          price: cartData.price / 100, // Convert from cents to dollars
          quantity: cartData.quantity,
          total: cartData.total / 100, // Convert from cents to dollars
          isDigital: cartData.isDigital,
          sellerId: cartData.sellerId,
          stepsCompleted: steps.map(step => step.name),
          lastStep: currentStep,
          timeSpent: Math.floor((Date.now() - startTime.getTime()) / 1000),
          abandonmentReason: reason,
          fieldInteractions: [], // Will be populated by form tracking
          pageViews,
          scrollDepth,
          metadata: {
            discountCode: cartData.discountCode,
            discountAmount: cartData.discountAmount,
            steps: steps,
          },
        }),
      })

      if (!response.ok) {
        console.warn('Failed to save abandoned cart to database')
      }
    } catch (error) {
      console.warn('Error saving abandoned cart:', error)
    }
  }, [sessionId, cartData, steps, currentStep, startTime, pageViews, scrollDepth])

  // Track cart abandonment
  const abandonCart = useCallback((reason: string = 'unknown') => {
    if (!isTracking || pageUnloadRef.current || isAbandonedRef.current) return

    const timeSpent = Math.floor((Date.now() - startTime.getTime()) / 1000)
    
    trackCheckoutAbandoned({
      ...cartData,
      lastStep: currentStep,
      timeSpent,
      reason
    })

    // Save to database
    saveAbandonedCart(reason)

    setIsTracking(false)
  }, [isTracking, cartData, trackCheckoutAbandoned, startTime, currentStep, saveAbandonedCart])

  // Track when user starts checkout
  const startTracking = useCallback(() => {
    // Prevent multiple initializations
    if (isTracking || hasStartedTrackingRef.current) return
    
    hasStartedTrackingRef.current = true
    setIsTracking(true)
    trackCheckoutStarted(cartData)
    
    // Set up activity tracking
    const updateActivity = () => {
      setLastActivity(new Date())
    }

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true)
    })

    // Set up abandonment detection
    const checkAbandonment = () => {
      const timeSinceActivity = Date.now() - lastActivity.getTime()
      const abandonmentThreshold = 5 * 60 * 1000 // 5 minutes

      if (timeSinceActivity > abandonmentThreshold && !pageUnloadRef.current && !isAbandonedRef.current) {
        abandonCart('inactivity')
      }
    }

    activityTimeoutRef.current = setInterval(checkAbandonment, 30000) // Check every 30 seconds
  }, [isTracking, cartData, trackCheckoutStarted, lastActivity, abandonCart])

  // Track checkout step completion
  const completeStep = useCallback((stepName: string, stepData?: any) => {
    if (!isTracking || isAbandonedRef.current) return

    const step: CheckoutStep = {
      name: stepName,
      completedAt: new Date(),
      data: stepData
    }

    setSteps(prev => [...prev, step])
    setCurrentStep(stepName)
    setLastActivity(new Date())

    trackCheckoutStep(stepName, cartData, stepData)
  }, [isTracking, cartData, trackCheckoutStep])

  // Track successful checkout completion
  const completeCheckout = useCallback(() => {
    if (!isTracking || isAbandonedRef.current) return

    const timeSpent = Math.floor((Date.now() - startTime.getTime()) / 1000)
    const stepsCompleted = steps.map(step => step.name)

    trackCheckoutCompleted({
      ...cartData,
      timeSpent,
      stepsCompleted
    })

    setIsTracking(false)
  }, [isTracking, cartData, trackCheckoutCompleted, startTime, steps])

  // Track payment intent creation
  const trackPaymentIntentCreated = useCallback((paymentIntentData: any) => {
    if (!isTracking || isAbandonedRef.current) return

    completeStep('payment_intent_created', {
      clientSecret: paymentIntentData.clientSecret ? 'created' : 'failed',
      customerId: paymentIntentData.customerId,
      amount: paymentIntentData.amount,
      currency: paymentIntentData.currency,
      paymentMethod: 'embedded'
    })
  }, [isTracking, completeStep])

  // Track payment form displayed
  const trackPaymentFormDisplayed = useCallback(() => {
    if (!isTracking || isAbandonedRef.current) return

    completeStep('payment_form_displayed', {
      paymentMethod: 'embedded',
      hasAddresses: true
    })
  }, [isTracking, completeStep])

  // Track payment attempt
  const trackPaymentAttempt = useCallback((paymentMethod?: string) => {
    if (!isTracking || isAbandonedRef.current) return

    completeStep('payment_attempted', {
      paymentMethod: paymentMethod || 'card',
      paymentType: 'embedded'
    })
  }, [isTracking, completeStep])

  // Track payment processing
  const trackPaymentProcessing = useCallback(() => {
    if (!isTracking || isAbandonedRef.current) return

    completeStep('payment_processing', {
      paymentType: 'embedded'
    })
  }, [isTracking, completeStep])

  // Track checkout errors
  const trackError = useCallback((errorType: string, errorMessage: string) => {
    if (!isTracking || isAbandonedRef.current) return

    trackCheckoutError({
      type: errorType,
      message: errorMessage,
      step: currentStep,
      cartData
    })
  }, [isTracking, trackCheckoutError, currentStep, cartData])

  // Handle page unload/visibility change
  useEffect(() => {
    const handleBeforeUnload = () => {
      pageUnloadRef.current = true
      if (isTracking && !isAbandonedRef.current) {
        abandonCart('page_unload')
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden && isTracking) {
        // User switched tabs or minimized browser
        setLastActivity(new Date())
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isTracking, abandonCart])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activityTimeoutRef.current) {
        clearInterval(activityTimeoutRef.current)
      }
      
      // Remove event listeners
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
      const updateActivity = () => {
        setLastActivity(new Date())
      }
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true)
      })
      
      if (isTracking && !isAbandonedRef.current) {
        abandonCart('component_unmount')
      }
    }
  }, [isTracking, abandonCart])

  return {
    startTracking,
    completeStep,
    abandonCart,
    completeCheckout,
    trackError,
    trackPaymentIntentCreated,
    trackPaymentFormDisplayed,
    trackPaymentAttempt,
    trackPaymentProcessing,
    isTracking,
    currentStep,
    steps,
    timeSpent: Math.floor((Date.now() - startTime.getTime()) / 1000),
    sessionId
  }
}

// Hook for tracking specific checkout steps
export function useCheckoutStep(stepName: string, cartData: CartData) {
  const { completeStep, trackError } = useAbandonedCart(cartData)

  const markStepComplete = useCallback((stepData?: any) => {
    completeStep(stepName, stepData)
  }, [completeStep, stepName])

  const markStepError = useCallback((errorType: string, errorMessage: string) => {
    trackError(errorType, errorMessage)
  }, [trackError])

  return {
    markStepComplete,
    markStepError
  }
}

// Hook for tracking form interactions
export function useFormTracking(formName: string, cartData: CartData) {
  const { completeStep, trackError } = useAbandonedCart(cartData)
  const [fieldInteractions, setFieldInteractions] = useState<string[]>([])

  const trackFieldInteraction = useCallback((fieldName: string) => {
    setFieldInteractions(prev => prev.includes(fieldName) ? prev : [...prev, fieldName])
  }, [])

  const trackFormError = useCallback((fieldName: string, errorMessage: string) => {
    trackError('form_validation', `${fieldName}: ${errorMessage}`)
  }, [trackError])

  const trackFormComplete = useCallback((formData: any) => {
    completeStep(`${formName}_completed`, {
      fieldsInteracted: fieldInteractions,
      formData
    })
  }, [completeStep, formName, fieldInteractions])

  return {
    trackFieldInteraction,
    trackFormError,
    trackFormComplete,
    fieldInteractions
  }
} 