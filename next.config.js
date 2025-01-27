const webpack = require('webpack');

module.exports = {
  experimental: {
    esmExternals: 'loose',
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
