const { join } = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const extractSCSS = new ExtractTextPlugin({
	filename: '_iconfont.scss',
	allChunks: false
});

const config = {
	entry: [
		join(__dirname, '/src/assets/fonts/build.js')
	],
	output: {
		path: join(__dirname, '/generated/iconfont'),
		publicPath: '/',
		filename: 'iconfont.js'
	},
	module: {
		rules: [
			{
				test: /\.font\.js$/,
				use: extractSCSS.extract({
					use: [
						'css-loader',
						{
							loader: 'webfonts-loader'
						}
					]
				})
			}
		]
	},
	resolve: {
		extensions: [ '.js' ]
	},
	plugins: [
		new webpack.DefinePlugin({ ENV: { dev: JSON.stringify(true) } }),
		extractSCSS
	]
};

module.exports = config;
