module.exports = (gulp, config) => {
	gulp.task('watch', [], () => {
		gulp.watch([`${config.path.src}/index.html`], ['html:watch']);
		gulp.watch([`${config.path.src}/**/*.scss`], ['scss:watch']);
	});
};
