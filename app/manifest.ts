import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OLOVARA - Handmade Marketplace',
    short_name: 'OLOVARA',
    description: 'Discover unique handmade products from talented artisans around the world',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['shopping', 'lifestyle', 'business'],
    lang: 'en',
    orientation: 'portrait',
    scope: '/',
  }
} 