/*
 * Copyright © 2020 Ingram Micro Inc. All rights reserved.
 */

const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');


const webpackConfig = {
  mode: process.env.NODE_ENV,

  entry: ['./lib/index'],

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'rql.js',
    libraryTarget: 'umd',
    library: 'lib',
    umdNamedDefine: true,
    globalObject: '(typeof self !== \'undefined\' ? self : this)',
  },

  resolve: {
    extensions: ['.js'],
    alias: {
      '@': path.resolve(__dirname, 'lib'),
    },
  },

  module: {
    rules: [
      {
        test: /\.(js)$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: [
          path.resolve(__dirname, 'lib'),
          path.resolve(__dirname, 'tests'),
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [
          path.resolve(__dirname, 'lib'),
          path.resolve(__dirname, 'tests'),
        ],
        exclude: /node_modules/,
      },
    ],
  },

  optimization: {
    minimizer: [new UglifyJsPlugin()],
  },
};


module.exports = webpackConfig;
