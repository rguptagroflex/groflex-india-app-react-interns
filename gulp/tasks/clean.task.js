const rmdir = require('rimraf')

module.exports = (gulp, config) => {
  gulp.task('clean', (callback) => rmdir(config.path.dist, callback))
}
