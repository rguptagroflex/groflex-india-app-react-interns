const glob = require('glob');
const gulp = require('gulp');
const config = require('./gulp/config');
const gulpLoadPlugins = require('gulp-load-plugins');

const plugin = gulpLoadPlugins();

glob.sync('./gulp/tasks/**/*.task.js').forEach((fileName) => {
	config.releaseStage = plugin.util.env.env || 'development';
	require(fileName)(gulp, config, plugin);
});
