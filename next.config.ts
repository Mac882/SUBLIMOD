import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* No activamos turbopack aquí para evitar el error de Vercel */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;