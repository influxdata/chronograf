const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, './src/index.tsx'),
  devtool: 'inline-source-map',
  // stats: 'minimal',
  devServer: {
    contentBase: 'build',
    proxy: {
      '/chronograf/v1': {
        target: 'http://localhost:8888',
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
      shared: path.resolve(__dirname, './src/shared'),
      style: path.resolve(__dirname, './src/style'),
      utils: path.resolve(__dirname, './src/utils'),
    },
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {transpileOnly: true},
      },
      {
        test: /\.js/,
        exclude: /node_modules/,
        options: {cacheDirectory: true},
        loader: 'babel-loader',
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(ico|png|cur|jpg|ttf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
        loader: 'file-loader',
      },
      // TODO: ESLint
      // TODO: TSLint
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './src/index.template.html'),
      inject: 'body',
    }),
    new ForkTsCheckerWebpackPlugin({silent: true}),
  ],
  output: {
    filename: '[name].[hash].dev.js',
    path: path.resolve(__dirname, './build'),
    publicPath: '/',
  },
}
