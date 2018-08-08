var gulp = require('gulp'),
    gutil = require('gulp-util'),
    coffee = require('gulp-coffee'),
    concat = require('gulp-concat'),
    compass = require('gulp-compass'),
    connect = require('gulp-connect'),
    gulpif = require('gulp-if'),
    uglify = require('gulp-uglify'),
    composer = require('gulp-uglify/composer'),
    uglifyES = require('uglify-es'),
    minifyHTML = require('gulp-minify-html'),
    jsonMinify = require('gulp-jsonminify'),
    imageMin = require('gulp-imagemin'),
    pngCrush = require('imagemin-pngcrush'),
    browserify = require('gulp-browserify');

gulp.task('log', function() {
  gutil.log('Workflows are awesome');
});

// Set Working ENVIRONMENT
var env,
    coffeeSources,
    sassSources,
    htmlSources,
    jsonSources,
    outputDir,
    sassStyle;

// run as $ NODE_ENV=production gulp
env = process.env.NODE_ENV || 'development';

if(env === 'development') {
  outputDir = 'builds/development';
  sassStyle = 'expanded';
}
else {
  outputDir = 'builds/production';
  sassStyle = 'compressed';
}

coffeeSources = ['components/coffee/tagline.coffee'];

jsSources = [
  'components/scripts/rclick.js',
  'components/scripts/pixgrid.js',
  'components/scripts/tagline.js',
  'components/scripts/template.js'
];

sassSources = [ 'components/sass/style.scss' ];
jsonSources = [outputDir + '/js/*.json'];
jsonDevelopmentSources = [ 'builds/development/js/*.json' ];
htmlSources = [outputDir + '/*.html'];
htmlDevelopmentSources = 'builds/development/*.html';
imagesSources = [ 'builds/development/images/**/*.*' ];

var minify = composer(uglifyES, console);

gulp.task('coffee', function() {
  gulp.src(coffeeSources)
    .pipe(coffee({ bare: true })
    .on('error', gutil.log))
    .pipe(gulp.dest('components/scripts'))
});

gulp.task('js', function() {
  var options = {};
  gulp.src(jsSources)
  .pipe(concat('script.js'))
  .pipe(browserify())
  .pipe(gulpif(env === 'production', minify(options)))
  .pipe(gulp.dest(outputDir + '/js'))
  .pipe(connect.reload())
});

gulp.task('compass', function() {
  gulp.src(sassSources)
    .pipe(compass({
      sass: 'components/sass',
      image: outputDir + '/images',
      style: sassStyle
    })
    .on('error', gutil.log))
    .pipe(gulp.dest(outputDir + '/css'))
    .pipe(connect.reload())
});

gulp.task('connect', function() {
  connect.server({
    root: outputDir,
    livereload: true
  })
});

gulp.task('json', function() {
  gulp.src(jsonDevelopmentSources)
  .pipe(gulpif(env === 'production', jsonMinify()))
  .pipe(gulpif(env === 'production', gulp.dest('builds/production/js')))
  .pipe(connect.reload())
});

gulp.task('html', function() {
  gulp.src(htmlDevelopmentSources)
  .pipe(gulpif(env === 'production', minifyHTML()))
  .pipe(gulpif(env === 'production', gulp.dest(outputDir)))
  .pipe(connect.reload())
});

gulp.task('images', function() {
  gulp.src(imagesSources)
  .pipe(gulpif(env === 'production', imageMin({
    progressive: true,
    svgoPlugins: [ {removeViewBox: false } ],
    use: [pngCrush()]
  })))
  .pipe(gulpif(env === 'production', gulp.dest(outputDir + '/images')))
  .pipe(connect.reload())
});

// Watch for changes on a given target and recompile
gulp.task('watch', function() {
  gulp.watch(coffeeSources, ['coffee']);
  gulp.watch(jsSources, ['js']);
  gulp.watch('components/sass/*.scss', ['compass']);
  gulp.watch(jsonDevelopmentSources, ['json']);
  gulp.watch(htmlDevelopmentSources, ['html']);
  gulp.watch(imagesSources, ['images']);
});

// ASSIGN DEFAULT BUILD
gulp.task('default', ['html', 'json', 'coffee', 'js', 'compass', 'images', 'connect', 'watch'])
