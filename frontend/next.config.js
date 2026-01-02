/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'rcm.baldazzi.fr'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'rcm.baldazzi.fr',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'rcm.baldazzi.fr',
        pathname: '/uploads/**',
      },
    ],
  },
  // Configuration des alias pour la résolution des modules
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
    };
    return config;
  },
}

module.exports = nextConfig




