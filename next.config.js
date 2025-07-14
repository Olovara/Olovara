/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
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
        hostname: 'example.com', // Add other domains as needed
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig; 