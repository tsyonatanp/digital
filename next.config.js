/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress viewport warnings in development
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Enhanced logging
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
  // Experimental features for better performance
  experimental: {
    // Optimize bundle size
    optimizePackageImports: ['lucide-react'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https: blob:;
              font-src 'self';
              connect-src 'self' https://api.openweathermap.org https://api.rss2json.com https://www.ynet.co.il https://www.one.co.il https://www.globes.co.il https://api.hebcal.com;
              frame-ancestors 'none';
              base-uri 'self';
              form-action 'self';
            `.replace(/\s{2,}/g, ' ').trim()
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  },
  
  // Webpack configuration to suppress warnings
  webpack: (config, { isServer }) => {
    // Suppress specific warnings
    config.ignoreWarnings = [
      /viewport/,
      /metadata viewport/,
    ];
    
    return config;
  },
};

module.exports = nextConfig; 