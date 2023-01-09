module.exports = (gulp, config, plugin) => {
	gulp.task('imagemin', [], () => {
		const productionStage = config.releaseStage === 'production';

		return gulp
			.src(`${config.path.src}/assets/images/**/*.*`)
			.pipe(productionStage ? plugin.imagemin() : plugin.util.noop())
			.pipe(gulp.dest(`${config.path.dist}/assets/images`));
	});
};
