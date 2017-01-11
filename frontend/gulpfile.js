// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var del = require('del');

var gp_jshint = require('gulp-jshint');
var gp_html5Lint = require('gulp-html5-lint');
var gp_csslint = require('gulp-csslint');

var gp_uglify = require('gulp-uglify');
var gp_sourcemaps = require('gulp-sourcemaps');
var gp_htmlmin = require('gulp-htmlmin');
var gp_csso = require('gulp-csso');
var gp_imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');


// Cleaning Task
gulp.task('clean_dist', function() {
  return del.sync('dist');
});

// Lint Tasks
gulp.task('lint_js', function() {
    return gulp.src(['src/js/app.js', 'src/js/callYelp.js'])
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
    .pipe(gp_csslint.formatter('compact'));
});

gulp.task('lint', ['lint_html', 'lint_js', 'lint_css']);

// Minify Tasks
gulp.task('minify_js', function(){
    return gulp.src('src/js/*.js')
        .pipe(gp_sourcemaps.init())
        .pipe(gulp.dest('dist/js'))
        .pipe(gp_sourcemaps.write('./'))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('minify_bootstrap_js', function(){
    return gulp.src('src/Bootstrap/js/*.js')
        .pipe(gp_sourcemaps.init())
        .pipe(gulp.dest('dist/Bootstrap/js'))
        .pipe(gp_uglify())
        .pipe(gp_sourcemaps.write('./'))
        .pipe(gulp.dest('dist/Bootstrap/js'));
});

gulp.task('minify_html', function() {
  return gulp.src('src/*.html')
    .pipe(gp_htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('dist'));
});

gulp.task('minify_css', function () {
    return gulp.src('src/css/*.css')
        .pipe(gp_csso())
        .pipe(gulp.dest('dist/css'));
});

gulp.task('minify_bootstrap_css', function () {
    return gulp.src('src/Bootstrap/css/*.css')
        .pipe(gp_csso())
        .pipe(gulp.dest('dist/Bootstrap/css'));
});

gulp.task('minify_images', function () {
    return gulp.src('src/images/*')
        .pipe(gp_imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest('dist/images'));
});

gulp.task('minify', ['minify_html', 'minify_css', 'minify_images', 'minify_js', 'minify_bootstrap_css', 'minify_bootstrap_js']);

// Default Task
gulp.task('default', ['clean_dist', 'lint', 'minify']);
