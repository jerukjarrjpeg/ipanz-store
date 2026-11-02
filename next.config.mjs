/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lint is not part of this project's toolchain; keep production builds dependency-light.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
