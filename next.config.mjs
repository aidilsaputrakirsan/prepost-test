/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure redirects to handle route groups properly
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/panel',
        permanent: true,
      },
    ];
  },
  // Configure headers
  async headers() {
    return [
      {
        // Apply these headers to all routes
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
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add explicit CSS optimization settings
  webpack: (config, { isServer }) => {
    // Force full CSS optimization even in production
    if (!isServer) {
      config.optimization.minimize = true;
    }
    return config;
  },
  // Handle static assets properly
  images: {
    domains: [],
    unoptimized: process.env.NODE_ENV !== 'production',
  },
  // Enable experimental features that might help with CSS
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;