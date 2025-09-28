import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      '@codemirror', 
      '@uiw/react-codemirror',
      'lucide-react',
      'react-select', 
      'lucide-react', 
      '@apollo/client', 
      'graphql',
      'react-toastify',
      'recharts',
      'd3',
      'gsap',
      'node-sql-parser'
    ],
    webpackBuildWorker: true,
  },
  
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: './analyze/client.html',
          openAnalyzer: false,
        })
      );
    }

    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 10000,
        maxSize: 200000,
        cacheGroups: {
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 40,
          },
          codemirrorCore: {
            test: /[\\/]node_modules[\\/]@codemirror\/(view|state|commands)[\\/]/,
            name: 'codemirror-core',
            chunks: 'all',
            priority: 30,
          },
          codemirrorExtensions: {
            test: /[\\/]node_modules[\\/]@codemirror\/(lang-|autocomplete|language)[\\/]/,
            name: 'codemirror-ext',
            chunks: 'all',
            priority: 28,
          },
          gsap: {
            test: /[\\/]node_modules[\\/](gsap|@gsap)[\\/]/,
            name: 'gsap',
            chunks: 'all',
            priority: 25,
            enforce: true,
          },
          charts: {
            test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
            name: 'charts',
            chunks: 'all',
            priority: 24,
            enforce: true,
          },
          sqlParser: {
            test: /[\\/]node_modules[\\/]node-sql-parser[\\/]/,
            name: 'sql-parser',
            chunks: 'all',
            priority: 22,
            enforce: true,
          },
          apollo: {
            test: /[\\/]node_modules[\\/](@apollo|graphql)[\\/]/,
            name: 'apollo',
            chunks: 'all',
            priority: 20,
          },
          reactSelect: {
            test: /[\\/]node_modules[\\/]react-select[\\/]/,
            name: 'react-select',
            chunks: 'all',
            priority: 18,
          },
          radixUI: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix-ui',
            chunks: 'all',
            priority: 16,
          },
          lucide: {
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            name: 'lucide',
            chunks: 'all',
            priority: 15,
          },
          database: {
            test: /[\\/]node_modules[\\/](pg|mysql2|mssql|sqlite3|oracledb)[\\/]/,
            name: 'database',
            chunks: 'all',
            priority: 12,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            minChunks: 2,
          },
        },
      };
      
      // Enhanced tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      config.optimization.providedExports = true;
      config.optimization.innerGraph = true;
      
      config.resolve.alias = {
        ...config.resolve.alias,
        'react/jsx-runtime.js': 'react/jsx-runtime',
        'react/jsx-dev-runtime.js': 'react/jsx-dev-runtime',
      };
      
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    return config;
  },
  
  compress: true,
  
  images: {
    unoptimized: true, 
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  poweredByHeader: false,
  reactStrictMode: true,
  
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
};

export default nextConfig;
