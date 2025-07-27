/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // 👈 This disables ESLint errors from failing your Vercel build
  },
};

export default nextConfig;
