const fs = require('q-io/fs');
const fsNative = require('fs');
const cheerio = require('cheerio');
const async = require('async');
const rmdir = require('rimraf');

const parseOptions = (util, config) => {
	return {
		dir: util.env.dir,
		env: util.env.env
	};
};

module.exports = (gulp, config, plugin) => {
	const writeIndexSettings = callback => {
		const opts = parseOptions(plugin.util, config);
		const index = `${config.path.dist}/index.html`;

		fs.read(index).then(content => {
			const settings = { releaseStage: opts.env };
			const script = `<script>window.settings = ${JSON.stringify(settings)};</script>`;
			const $ = cheerio.load(content);

			$('head').append(script);

			fsNative.writeFile(index, $.html(), null, function(err) {
				callback(err);
			});
		});
	};

	const minifyHtml = callback => {
		const htmlmin = plugin.htmlmin;

		return gulp
			.src(`${config.path.dist}/index.html`)
			.pipe(htmlmin({ collapseWhitespace: true }))
			.pipe(gulp.dest(config.path.dist))
			.on('end', callback);
	};

	const clearRev = callback => {
		rmdir(config.path.deploy, callback);
	};

	const createRev = callback => {
		const RevAll = plugin.revAll;

		return gulp
			.src([
				`${config.path.dist}/**`,
				`!${config.path.dist}/css/eot/**`,
				`!${config.path.dist}/css/otf/**`,
				`!${config.path.dist}/css/svg/**`,
				`!${config.path.dist}/css/ttf/**`,
				`!${config.path.dist}/css/woff/**`,
				`!${config.path.dist}/css/woff2/**`,
				`!${config.path.dist}/assets/images/svg/**`
			])
			.pipe(new RevAll(config.revAll).revision())
			.pipe(gulp.dest(config.path.deploy))
			.on('end', callback);
	};

	const copyWebFonts = callback => {
		return gulp
			.src(
				[
					`${config.path.dist}/css/eot/**`,
					`${config.path.dist}/css/otf/**`,
					`${config.path.dist}/css/svg/**`,
					`${config.path.dist}/css/ttf/**`,
					`${config.path.dist}/css/woff/**`,
					`${config.path.dist}/css/woff2/**`,
					`${config.path.dist}/assets/images/svg/**`
				],
				{ base: `${config.path.dist}` }
			)
			.pipe(gulp.dest(`${config.path.deploy}`))
			.on('end', callback);
	};

	gulp.task('rev:deploy', [], callback =>
		async.series([writeIndexSettings, minifyHtml, clearRev, createRev, copyWebFonts], callback)
	);

	gulp.task('deploy:local', ['rev:deploy']);
};
