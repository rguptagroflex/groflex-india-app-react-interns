const fs = require('fs');
const { join } = require('path');

module.exports = (gulp, config, plugin) => {
	const preview = (callback) => {
		let svgFiles = '';

		fs.readdirSync(`${config.path.src}/assets/images/icons`).forEach(file => {
			svgFiles += `<div style="width: 260px; height: 60px; line-height: 60px; border: 1px #ddd solid; margin: 10px; float: left; display: flex;">`;
			svgFiles += `<img src="../src/assets/images/icons/${file}" style="height: 100%; padding: 12px; box-sizing: border-box;" /><span>${file}</span>`;
			svgFiles += `</div>`;
		});

		fs.writeFileSync(join('generated', 'preview.html'), `<html><title>Iconfont</title><head><style>body { margin: 20px; font-family: Arial, sans-serif; }</style></head><body>${svgFiles}</body></html>`);

		callback();
	};

	gulp.task('iconfont:preview', preview);
};
