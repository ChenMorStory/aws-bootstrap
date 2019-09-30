const path = require('path')
const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const HtmlWebPackPlugin = require('html-webpack-plugin')
const OpenBrowserPlugin = require('opn-browser-webpack-plugin')

module.exports = (env, argv) => {

  const config = {
    entry: {
      main: './src/client/index.js'
    },
    output: {
      path: path.join(__dirname, 'dist'),
      publicPath: '/',
      filename: '[name].js',
      globalObject: 'this'
    },
    target: 'web',
    devtool: 'source-map',
    resolve: {
      extensions: ['.js', '.jsx'],
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            'style-loader', 'css-loader'
          ],
        },
        {
          enforce: 'pre',
          test: /\.jsx?$/,
          exclude: /node_modules/,
          loader: 'eslint-loader',
          options: {
            emitWarning: true,
            failOnError: false,
            failOnWarning: false
          }
        },
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          loader: 'babel-loader'
        },
        {
          test: /\.html$/,
          use: [
            {
              loader: 'html-loader',
              options: { minimize: argv.mode == 'production' }
            }
          ]
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf|png|svg|jpg|gif)$/,
          use: [(argv.mode == 'development' ? 'file-loader' : { loader: 'url-loader' })]
        }
      ]
    },
    plugins: [
      new HtmlWebPackPlugin({
        template: './src/client/index.html',
        filename: './index.html',
        favicon: './src/client/img/favicon.ico',
        excludeChunks: ['server']
      }),
      new webpack.NoEmitOnErrorsPlugin(),
      new webpack.WatchIgnorePlugin(['./dist', './build'])
    ]
  }

  if (argv.mode == 'development') {
    config.devtool = 'inline-source-map'

    config.devServer = {
      historyApiFallback: true,
      hot: true,
      inline: true,

      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api/*': {
          target: 'http://localhost:8080/',
          ws: true,
          secure: false
        }
      }
    }

    config.plugins.push(new webpack.HotModuleReplacementPlugin())
    config.plugins.push(new OpenBrowserPlugin({
      url: 'http://localhost:3000'
    }))
  }

  if (argv.mode == 'production') {
    config.optimization = {
      minimizer: [
        new TerserPlugin({
          cache: true,
          parallel: true,
          sourceMap: true
        }),
        new OptimizeCSSAssetsPlugin({})
      ]
    }
  }

  return config
}
