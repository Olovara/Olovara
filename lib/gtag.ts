// lib/gtag.ts
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: {
        page_path?: string;
        [key: string]: any;
      }
    ) => void;
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID

// Track page views
export const pageview = (url: string) => {
  if (!GA_TRACKING_ID) {
    console.warn('GA_TRACKING_ID is not defined')
    return
  }
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  })
}

// Track custom events
export const event = ({ action, params }: { action: string; params: any }) => {
  if (!GA_TRACKING_ID) {
    console.warn('GA_TRACKING_ID is not defined')
    return
  }
  window.gtag('event', action, params)
}