var gulp = require('gulp');
var paths = require('../paths');
var eslint = require('gulp-eslint');

gulp.task('lint', function() {
  return gulp.src(paths.source)
    .pipe(eslint())
    .pipe(eslint.format())
    // failOnError:     bail immediately on any error
    // failAfterError:  aggregate all errors before bailing
    .pipe(eslint.failAfterError());
});
