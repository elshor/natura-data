/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
const webpack = require('webpack');

module.exports = {
	entry:'./src/index.ts',
	output:{
		library:{
			type:'umd2'
		}
	},
	module: {
    rules: [
			{
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
			{
        test: /\.ya?ml$/,
        use: 'yaml-loader'
      }
    ]
  },
	resolve:{
    extensions: ['.js','.ts'],
		fallback:{
			stream: require.resolve('stream-browserify'),
			querystring:require.resolve('querystring-es3'),
			url:require.resolve('util'),
			events: false,
			util:false,
			https: false,// require.resolve('https-browserify'),
			buffer: require.resolve('buffer'),
			path: false,
			request:false,
			http: false,
			assert: false,
			fs: false,
			punycode: false,
			child_process: false,
			os: require.resolve('os-browserify/browser'),
			crypto: require.resolve('crypto-browserify'),
			tls: false,
			net: false,
			process: require.resolve('process/browser')
		}
	},
	plugins: [
		new webpack.ProvidePlugin({
					 process: 'process/browser',
					 Buffer: ['buffer', 'Buffer'],
		}),
],

}