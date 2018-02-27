/* eslint-disable no-var */
const webpack = require('webpack')
const path = require('path')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const package = require('../package.json')
const dependencies = package.dependencies

const babelLoader = {
  loader: 'babel-loader',
  options: {
    cacheDirectory: true,
    presets: [
      'react',
      [
        'es2015',
        {
          modules: false,
        },
      ],
      'es2016',
    ],
  },
}

const config = {
  node: {
    fs: "empty",
    module: "empty"
 },
  bail: true,
  devtool: 'eval',
  entry: {
    app: path.resolve(__dirname, '..', 'src', 'index.js'),
    vendor: Object.keys(dependencies),
  },
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, '../build'),
    filename: '[name].[chunkhash].js',
  },
  resolve: {
    alias: {
      app: path.resolve(__dirname, '..', 'app'),
      src: path.resolve(__dirname, '..', 'src'),
      shared: path.resolve(__dirname, '..', 'src', 'shared'),
      style: path.resolve(__dirname, '..', 'src', 'style'),
      utils: path.resolve(__dirname, '..', 'src', 'utils'),
    },
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    noParse: [
      path.resolve(
        __dirname,
        '..',
        'node_modules',
        'memoizerific',
        'memoizerific.js'
      ),
    ],
    loaders: [
      {
        test: /\.js$/,
        exclude: [/node_modules/, /(_s|S)pec\.js$/],
        loader: 'eslint-loader',
        enforce: 'pre',
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            'css-loader',
            'sass-loader',
            'resolve-url-loader',
            'sass-loader?sourceMap',
          ],
        }),
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'postcss-loader'],
        }),
      },
      {
        test: /\.(ico|png|cur|jpg|ttf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
        loader: 'file-loader',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react', 'stage-0'],
          cacheDirectory: false, // Using the cache directory on production builds has never been helpful.
        },
      },
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
          babelLoader,
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({
      postcss: require('./postcss'),
      options: {
        eslint: {
          failOnWarning: false,
          failOnError: false,
        },
      },
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      },
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    }),
    new ExtractTextPlugin('chronograf.css'),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '..', 'src', 'index.template.html'),
      inject: 'body',
      chunksSortMode: 'dependency',
      favicon: 'assets/images/favicon.ico',
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
    }),
    new webpack.optimize.CommonsChunkPlugin({
      names: ['vendor', 'manifest'],
    }),
    function() {
      /* Webpack does not exit with non-zero status if error. */
      this.plugin('done', function(stats) {
        if (
          stats.compilation.errors &&
          stats.compilation.errors.length &&
          process.argv.indexOf('--watch') == -1
        ) {
          console.log(
            stats.compilation.errors.toString({
              colors: true,
            })
          )
          process.exit(1)
        }
      })
    },
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(require('../package.json').version),
    }),
  ],
  target: 'web',
}

module.exports = config
