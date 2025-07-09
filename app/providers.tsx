'use client'

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { usePostHog } from 'posthog-js/react'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize PostHog only on the client side
    if (typeof window !== 'undefined') {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only', // Only create profiles for identified users
        capture_pageview: false, // We'll handle page views manually for better control
        capture_pageleave: true, // Automatically capture when users leave the page
        autocapture: true, // Automatically capture clicks, form submissions, etc.
        disable_session_recording: false, // Enable session recordings
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            // Log PostHog initialization in development
            console.log('PostHog initialized successfully')
          }
        }
      })
    }
  }, [])

  return (
    <PHProvider client={posthog}>
      {children}
    </PHProvider>
  )
}

// Component to handle automatic page view tracking
export function PostHogPageview() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    if (pathname && posthog) {
      // Capture page view with current path and search params
      const url = searchParams?.toString() 
        ? `${pathname}?${searchParams.toString()}`
        : pathname
      
      posthog.capture('$pageview', {
        $current_url: url,
        path: pathname,
        search: searchParams?.toString() || ''
      })
    }
  }, [pathname, searchParams, posthog])

  return null
} 