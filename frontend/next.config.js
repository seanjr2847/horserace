/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // API 프록시 설정 (개발 환경)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*', // FastAPI 백엔드
      },
    ]
  },

  // 환경 변수
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
  },

  // 이미지 최적화
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
