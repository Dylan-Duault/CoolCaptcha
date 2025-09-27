const path = require('path');

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
        use: ['raw-loader']
      },
      {
        test: /\.html$/i,
        use: ['raw-loader']
      }
    ]
  },
  devServer: {
    static: {
      directory: path.join(__dirname),
    },
    compress: true,
    port: 9999,
  }
};