const { basename } = require('path');

const path = {
	dist: './dist',
	deploy: './deploy',
	gulp: './gulp',
	src: './src',
	rev: './rev'
};

const config = {
	path,

	autoprefixer: {
		browsers: '> 1% in DE'
	},

	revAll: {
		dontRenameFile: [/^\/index.html$/g, '.json'],
		transformFilename: (file, hash) => {
			const hashLength = 8;

			const split = basename(file.path).split('.');
			const fileName = split.shift();
			const fileExtension = split.join('.');
			const shortenedHash = hash.substr(0, hashLength);

			return `${fileName}-${shortenedHash}.${fileExtension}`;
		}
	},

	sass: {
		indentedSyntax: true
	}
};

module.exports = config;
