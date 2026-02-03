/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '**' },
      { protocol: 'http', hostname: 'k.kakaocdn.net', pathname: '**' },
      { protocol: 'https', hostname: 'k.kakaocdn.net', pathname: '**' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    return [
      {
        source: '/api/proxy/:path*',
        destination: apiUrl + '/:path*',
      },
      {
        source: '/media/:path*',
        destination: apiUrl + '/media/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
