const webpack = require('webpack');
const merge = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const {
	env: { npm_lifecycle_event: SCRIPT }
} = require('process');

const isProductionBuild = SCRIPT === 'build' || SCRIPT === 'build:windows';
const commonConfig = require('./webpack.config.common');
const environmentConfig = isProductionBuild ? require('./webpack.config.prod') : require('./webpack.config.dev');
const environment = JSON.stringify(isProductionBuild ? 'production' : 'development');

const config = merge(commonConfig, environmentConfig, {
	plugins: [
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': environment,
			ENV: { dev: JSON.stringify(!isProductionBuild) }
		}),
		new CopyWebpackPlugin([{ from: 'src/assets/fonts/segoeUI', to: 'css' }], { copyUnmodified: true })
	]
});

module.exports = config;
