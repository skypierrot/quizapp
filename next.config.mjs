/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Next.js 15 호환 설정
  serverExternalPackages: ['@prisma/client'],
  
  // Turbopack 설정 (stable)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Turbopack 사용 시 Webpack 설정 비활성화
  webpack: (config, { dev, isServer }) => {
    // Turbopack을 사용할 때는 기본 설정만 유지
    if (process.env.TURBOPACK) {
      return config;
    }

    if (dev && !isServer) {
      // Docker 환경에서 파일 감시 설정 최적화
      config.watchOptions = {
        aggregateTimeout: 500,
        poll: 2000,
        ignored: [
          /node_modules/,
          /\.git/,
          /\.next/,
          /\.env/,
          /\.env.*/,
        ],
      };

      // Webpack HMR 안정성 개선
      config.optimization = {
        ...config.optimization,
        moduleIds: 'named',
        chunkIds: 'named',
      };

      // 모듈 해결 안정성 개선
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
        },
      };

      // HMR 관련 플러그인 설정
      if (config.plugins) {
        config.plugins = config.plugins.filter(plugin => {
          // HMR 관련 플러그인만 유지
          return plugin.constructor.name !== 'HotModuleReplacementPlugin' || 
                 (plugin.constructor.name === 'HotModuleReplacementPlugin' && dev);
        });
      }

      // Webpack HMR 안정성을 위한 추가 설정
      config.infrastructureLogging = {
        level: 'error',
      };

      // 모듈 로딩 오류 방지를 위한 설정
      config.stats = {
        ...config.stats,
        errorDetails: false,
        children: false,
      };
    }
    
    // CSS 처리 설정 추가 (Turbopack 사용 시에는 제외)
    if (!process.env.TURBOPACK) {
      config.module.rules.push({
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  'tailwindcss',
                  'autoprefixer',
                ],
              },
            },
          },
        ],
      });
    }
    
    return config;
  },

  // 이미지 최적화 (이전 커밋과 동일)
  images: {
    domains: ['localhost'],
  },

  // React 19 및 Next.js 15 최적화 설정
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP'],
    // React 19 최적화
    optimizePackageImports: ['@next/font', 'lucide-react'],
    // CSS 최적화 (critters 모듈 문제로 임시 비활성화)
    optimizeCss: false,
    // Webpack HMR 안정성 개선
    webpackBuildWorker: false,
  },

  // 출력 설정 (이전 커밋과 동일)
  assetPrefix: undefined,
  output: 'standalone',
  distDir: '.next',
  poweredByHeader: false,

  // 리다이렉트 설정
  async redirects() {
    return [
      {
        source: '/quiz',
        destination: '/',
        permanent: false,
      },
    ];
  },

  // CORS 설정 (개발 환경)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Hydration 오류 방지를 위한 추가 헤더
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // 추가 보안 및 안정성 헤더
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Hydration 안정성을 위한 추가 헤더
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },

  // React 19 컴파일러 최적화
  compiler: {
    // 개발 환경에서 콘솔 유지
    removeConsole: false,
  },

  // 개발 환경 최적화
  devIndicators: {
    position: 'bottom-right',
  },

  // Hydration 안정성을 위한 추가 설정
  onDemandEntries: {
    // 개발 환경에서 페이지 유지 시간 증가
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig; 