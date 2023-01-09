module.exports = (gulp, config, plugin) => {
	const fileInclude = plugin.fileInclude;

	const buildHtml = () => {
		return gulp
			.src(`${config.path.src}/index.html`)
			.pipe(
				fileInclude({
					prefix: '@@',
					basepath: `${config.path.src}`,
					context: {
						releaseStage: config.releaseStage
					}
				})
			)
			.pipe(gulp.dest(config.path.dist));
	};

	gulp.task('build', ['scss'], buildHtml);
	gulp.task('html:watch', buildHtml);
};
