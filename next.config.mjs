/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        aggregateTimeout: 300,
        poll: 1000,
        ignored: /node_modules/,
      };
    }
    
    return config;
  },
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP'],
  },
  assetPrefix: undefined,
  output: 'standalone',
  distDir: '.next',
  poweredByHeader: false,
};

export default nextConfig; 