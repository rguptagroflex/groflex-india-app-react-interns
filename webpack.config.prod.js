const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const { Plugin: WebpackCommonShakePlugin } = require('webpack-common-shake');
const {
	optimize: { ModuleConcatenationPlugin, UglifyJsPlugin }
} = webpack;

const extractIconFontCSS = new ExtractTextPlugin({
	filename: 'css/iconfont.css'
});

const config = {
	module: {
		rules: [
			{
				test: /\.font\.js$/,
				use: extractIconFontCSS.extract({
					fallback: 'style-loader',
					use: [
						{
							loader: 'css-loader',
							options: {
								sourceMap: false,
								minimize: true
							}
						},
						{
							loader: 'webfonts-loader'
						}
					]
				})
			}
		]
	},
	plugins: [
		new WebpackCommonShakePlugin({ warnings: { global: false } }),
		new ModuleConcatenationPlugin(),
		new UglifyJsPlugin({
			mangle: {
				keep_fnames: true
			},
			compress: {
				keep_fnames: true,
				warnings: false
			},
			sourceMap: false
		}),
		extractIconFontCSS
	]
};

module.exports = config;
