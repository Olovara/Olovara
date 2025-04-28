/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io', // Replace with your image domain
        pathname: '/**', // This will allow any path under this domain
      },
      {
        protocol: 'https',
        hostname: 'example.com', // Add other domains as needed
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;