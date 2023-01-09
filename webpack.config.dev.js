const { resolve } = require('path');
const webpack = require('webpack');

const { PrefetchPlugin, NamedModulesPlugin, HotModuleReplacementPlugin } = webpack;
const pathToNodeModules = resolve(__dirname, 'node_modules');
const PORT = 1337;

const config = {
	devtool: 'eval-source-map',
	module: {
		rules: [
			{
				test: /\.font\.js$/,
				use: [
					'style-loader',
					'css-loader',
					{
						loader: 'webfonts-loader'
					}
				]
			}
		]
	},
	plugins: [
		new PrefetchPlugin(pathToNodeModules, 'fabric/dist/fabric.js'),
		new PrefetchPlugin(pathToNodeModules, 'dragula/dragula.js'),
		new PrefetchPlugin(pathToNodeModules, 'babel-runtime/core-js/symbol.js'),
		new PrefetchPlugin(pathToNodeModules, 'babel-runtime/core-js/object/keys.js'),
		new NamedModulesPlugin(),
		new HotModuleReplacementPlugin()
	],
	devServer: {
		contentBase: './dist',
		//watchContentBase: true,
		hot: true,
		port: PORT,
		historyApiFallback: {
			index: 'index.html'
		},
		proxy: {
			'/api': 'http://localhost:3000'
		},
		https: false
	}
};

module.exports = config;
