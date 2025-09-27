const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'captcha.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'CoolCaptcha',
    libraryTarget: 'umd',
    libraryExport: 'default'
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          'raw-loader',
          {
            loader: 'string-replace-loader',
            options: {
              search: /\s+/g,
              replace: ' ',
              flags: 'g'
            }
          }
        ]
      },
      {
        test: /\.html$/i,
        use: [
          'raw-loader',
          {
            loader: 'string-replace-loader',
            options: {
              multiple: [
                { search: /\s+/g, replace: ' ', flags: 'g' },
                { search: />\s+</g, replace: '><', flags: 'g' }
              ]
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new Dotenv()
  ],
  optimization: {
    minimize: true,
    usedExports: true,
    sideEffects: false
  },
  devServer: {
    static: {
      directory: path.join(__dirname),
    },
    compress: true,
    port: 9999,
  }
};