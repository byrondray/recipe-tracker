const webpack = require('webpack');

module.exports = {
  experimental: {
    esmExternals: 'loose',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'recipe-midterm-app.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
      ...config.resolve.fallback,
    };
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      })
    );
    return config;
  },
};
