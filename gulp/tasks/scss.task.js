const { assign } = require('lodash');
const util = require('gulp-util');

module.exports = (gulp, config, plugin) => {
	const productionStage = config.releaseStage === 'production';

	const scss = () => {
		const source = `${config.path.src}/styles/app.scss`;

		return gulp
			.src(source)
			.pipe(plugin.plumber())
			.pipe(
				plugin.sass.sync(
					assign({}, config.sass, {
						errLogToConsole: !productionStage,
						outputStyle: productionStage ? 'compressed' : 'nested'
					})
				)
			)
			.pipe(plugin.autoprefixer(config.autoprefixer))
			.pipe(gulp.dest(`${config.path.dist}/css`))
			.on('end', function() {
				util.beep();
			});
	};

	gulp.task('scss', ['imagemin'], scss);
	gulp.task('scss:watch', scss);
};
