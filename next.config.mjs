/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Stub optional Node-only deps in browser bundles to prevent resolution errors
    if (!isServer) {
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        'pino-pretty': false,
        'sonic-boom': false,
      }
    }
    return config
  },
}

export default nextConfig
