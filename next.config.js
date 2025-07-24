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