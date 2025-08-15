/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Server Components 활성화 (Next.js 15 호환)
  serverExternalPackages: ['@prisma/client'],

  // 최소한의 Webpack 설정 (Next.js 15 기본값 유지)
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Docker 환경에서 파일 감시 설정만 추가
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      };
    }
    return config;
  },

  // 개발 환경 최적화 (Next.js 15 기본 설정 사용)

  // 이미지 최적화
  images: {
    domains: ['localhost', 'quiz.geniduck.org'],
    unoptimized: true,
  },

  // TypeScript 설정
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint 설정
  eslint: {
    ignoreDuringBuilds: false,
  },

  // 출력 설정
  output: 'standalone',

  // 트래일링 슬래시 설정
  trailingSlash: false,

  // 리다이렉트 설정
  async redirects() {
    return [
      {
        source: '/',
        destination: '/quiz',
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
        ],
      },
    ];
  },

  // Next.js 15 기본 실험적 기능만 활성화
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
};

export default nextConfig; 