/** @type {import('next').NextConfig} */
const nextConfig = {
  // Generate consistent build ID to prevent server action mismatches
  // This is critical when deploying to multiple instances or after rebuilds
  generateBuildId: async () => {
    // Use environment variable if set (for consistent builds across deployments)
    // Otherwise use timestamp to ensure fresh builds
    return process.env.BUILD_ID || `build-${Date.now()}`;
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
    // Improve Server Action stability
    serverActions: {
      bodySizeLimit: '2mb',
      // Allow server actions to work with custom server
      allowedOrigins: process.env.NODE_ENV === 'production' 
        ? ['https://yarnnu.com', 'https://www.yarnnu.com']
        : ['http://localhost:3000'],
    },
  },
  // Clear build cache on issues
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Ensure proper handling of server actions Note: In development, components may render twice. This is expected and helps find problems.
  reactStrictMode: true,
  // Ensure HTTPS redirects are handled properly
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://yarnnu.com/:path*',
        permanent: true,
      },
      // Redirect www to non-www
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.yarnnu.com',
          },
        ],
        destination: 'https://yarnnu.com/:path*',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io', // UploadThing domain
        pathname: '/**', // Allow any path under this domain
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com', // Placeholder images
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Unsplash images
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com', // Add other domains as needed
        pathname: '/**',
      },
    ],
  },
  // SEO optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // Add security headers TODO: Remove becuase this is duplicate
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ]
  },
};

module.exports = nextConfig; 