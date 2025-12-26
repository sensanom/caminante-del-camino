const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  reactStrictMode: true,
  // ⚠️ NO incluyas `turbopack` → usa Webpack (más estable con Leaflet)
  // experimental: {
  //   turbopack: false,  // ← no es necesario; ausencia = Webpack por defecto en build
  // },
});

module.exports = nextConfig;
