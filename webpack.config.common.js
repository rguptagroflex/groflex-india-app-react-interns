const { join, resolve } = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const config = {
	entry: ['whatwg-fetch', join(__dirname, '/src/index.js')],
	output: {
		path: join(__dirname, '/dist'),
		publicPath: '/',
		filename: 'js/app.js'
	},
	module: {
		rules: [
			{
				test: /\.svg$/,
				loader: 'html-loader',
				options: {
					minimize: true
				}
			},
			{
				test: /\.(png|jpg|jpeg)/,
				loader: 'url-loader'
			},
			{
				test: /\.js$/,
				loader: 'babel-loader',
				options: {
					babelrc: false,
					cacheDirectory: true,
					presets: [
						[
							'env',
							{
								targets: {
									chrome: 52,
									browsers: ['last 2 versions', 'safari 7']
								},
								modules: false,
								loose: true
							}
						],
						'react'
					],
					plugins: ['lodash', 'transform-runtime', 'transform-object-rest-spread']
				},
				exclude: [resolve(__dirname, 'node_modules')]
			},
			{
				test: /\.xlsx$/,
				loader: 'file-loader',
				options: {
					name: '[name].[ext]'
				}
			}
		]
	},
	plugins: [
		new CopyWebpackPlugin([
			{ from: 'src/lang', to: 'lang' }
		])
	],
	resolve: {
		alias: {
			assets: resolve(__dirname, 'src/assets/')
		},
		extensions: ['.js', '.json', '.css'],
		modules: [resolve(__dirname, 'src/app'), resolve(__dirname, 'src'), 'node_modules']
	}
};

module.exports = config;
