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
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://weatherwidget.org https://*.weatherwidget.org https://app.weatherwidget.org https://app3.weatherwidget.org;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https: blob:;
              font-src 'self';
              connect-src 'self' https: wss: data: blob:;
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