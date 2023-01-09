const path = require('path');

const config = {
	files: ['../images/icons/*.svg'],
	fontName: 'invoizicons',
	classPrefix: 'icon-',
	baseClass: 'icon',
	fixedWidth: true,
	centerHorizontally: true,
	types: ['eot', 'woff', 'ttf'],
	cssTemplate: path.join(__dirname, 'templates', 'iconfont_scss.hbs'),
	startCodepoint: 0xe001,
	rename: function(file) {
		const name = path.basename(file, path.extname(file));
		const strippedName = name.substring(name.indexOf('-') + 1, name.length);
		return strippedName;
	}
};

module.exports = config;
