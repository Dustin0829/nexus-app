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
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Enable compression
  compress: true,
  webpack: (config, { isServer }) => {
    // Stub optional Node-only deps in browser bundles to prevent resolution errors
    if (!isServer) {
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        'pino-pretty': false,
        'sonic-boom': false,
      }
    }
    
    // Handle IndexedDB and storage-related modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'indexeddb': false,
      'localforage': false,
    }

    // Optimize bundle splitting
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          wagmi: {
            test: /[\\/]node_modules[\\/](wagmi|@wagmi|viem)[\\/]/,
            name: 'wagmi',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    }
    
    return config
  },
}

export default nextConfig
