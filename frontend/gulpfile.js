// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var gp_jshint = require('gulp-jshint');
var gp_html5Lint = require('gulp-html5-lint');
var gp_csslint = require('gulp-csslint');

var gp_concat = require('gulp-concat');
var gp_uglify = require('gulp-uglify');
var gp_rename = require('gulp-rename');
var gp_sourcemaps = require('gulp-sourcemaps');
var gp_htmlmin = require('gulp-htmlmin');
var gp_csso = require('gulp-csso');


// Lint Tasks
gulp.task('lint_js', function() {
    return gulp.src(['src/js/*.js'])
        .pipe(gp_jshint())
        .pipe(gp_jshint.reporter('default'));
});

gulp.task('lint_html', function() {
    return gulp.src(['src/*.html'])
        .pipe(gp_html5Lint());
});

gulp.task('lint_css', function() {
  gulp.src(['src/css/*.css'])
    .pipe(gp_csslint())
    .pipe(gp_csslint.reporter());
});

gulp.task('lint', ['lint_html', 'lint_js', 'lint_css'])

// Minify Tasks
gulp.task('minify_js', function(){
    return gulp.src('src/js/*.js')
        .pipe(gp_sourcemaps.init())
        // .pipe(gp_concat('concat.js'))
        .pipe(gulp.dest('dist/js'))
        // .pipe(gp_rename('uglify.js'))
        .pipe(gp_uglify())
        .pipe(gp_sourcemaps.write('./'))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('minify_html', function() {
  return gulp.src('src/*.html')
    .pipe(gp_htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('dist'))
});

gulp.task('minify_css', function () {
    return gulp.src('src/css/*.css')
        .pipe(gp_csso())
        .pipe(gulp.dest('dist/css'));
});

// Default Task
gulp.task('default', ['minify_js', 'minify_html', 'minify_css']);
