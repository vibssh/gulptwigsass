/**
 * =====================================
 * Name       :Gulp File
 * Project    : Twig SCSS 
 * Author     : Vaibhav Shringarpure
 * 
 * =====================================
 */

 'use strict';

 /**
  * Global Require
  */

 const gulp         = require('gulp'),
       path         = require('path'),
       fs           = require('fs'),
       data         = require('gulp-data'),
       twig         = require('gulp-twig'),
       prefix       = require('gulp-autoprefixer'),
       sass         = require('gulp-sass'),
       plumber      = require('gulp-plumber'),
       sourcemaps   = require('gulp-sourcemaps'),
       browserify   = require('browserify'),
       babelify     = require('babelify'),
       source       = require('vinyl-source-stream'),
       buffer       = require('vinyl-buffer'),
       uglify       = require('gulp-uglify'),
       clean        = require('gulp-clean'),
       browserSync  = require('browser-sync');

/**
 * Directories / Paths
 */

const paths = {
  dist    : './dist',
  sass    : './src/scss/**/*.scss',
  js      : './src/js/**/*.js',
  css     : './dist/assets/css/',
  script  : './dist/assets/js/',
  data    : './src/data/'
}

/**
 * Twig with data
 */

gulp.task('twig', function() {
  return gulp.src(['./src/templates/*.twig'])
            .pipe(plumber({
              handleError: function(err){
                console.log(err);
                this.emit('end');
              }
            }))
            .pipe(data(function(file){
              return JSON.parse(fs.readFileSync(paths.data + path.basename(file.path) + '.json'));
            }))
            .pipe(twig())
            .on('error', function(err){
              process.stderr.write(err.message + '\n');
              this.emit('end');
            })
            .pipe(gulp.dest(paths.dist));
});

/**
 * Recompile Twig file and reload Browser
 */

gulp.task('rebuild', ['twig'], function () {
  // BrowserSync Reload
  browserSync.reload();
});

/**
 * Wait for twig, js and sass tasks, then launch the browser-sync Server
 */
gulp.task('browser-sync', ['sass', 'js', 'twig'],  function() {
  browserSync({
    server: {
      baseDir: paths.dist
    },
    notify: false,
    browser: 'google chrome'
  });
});

/**
 * Scss files compile and put them in dist/assets/css folder
 */

gulp.task('sass', function() {
  return gulp.src(paths.sass)
      .pipe(sourcemaps.init())
      .pipe(plumber({
        handleError: function(err){
          console.log(err);
          this.emit('end');
        }
      }))
      .pipe(sass({
          includePaths: [paths.sass],
          outputStyle: 'compact'
        }).on('error', function(err){
          console.log(err.message);
          this.emit('end');
        })
      )
      .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], {
        cascade: true
      }))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(paths.css))
});

/**
 * Compile JS Files
 */

gulp.task('js', function () {
  return browserify({entries: './src/js/app.js', debug: true})
  .transform("babelify", { presets: ["@babel/preset-env"] })
  .bundle()
  .pipe(source('app.js'))
  .pipe(buffer())
  .pipe(sourcemaps.init())
  .pipe(uglify())
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(paths.script))
});


/**
 * Clean
 */
gulp.task('clean', function() {
  return gulp.src(['dist/*'], {read: false})
    .pipe(clean());
});


/**
 * Watch files
 */

gulp.task('watch', function () {
  gulp.watch(paths.js , ['js', browserSync.reload]);
  gulp.watch(paths.sass , ['sass', browserSync.reload]);
  gulp.watch([
      'src/templates/**/*.twig',
      'src/data/**/*.twig.json'
    ], 
    {cwd:'./'}, 
    ['rebuild']);
});

// Build task compile sass and twig.
gulp.task('build', ['sass','js', 'twig']);
/**
 * Default task, running just `gulp` will compile the sass,
 * compile the project site, launch BrowserSync then watch
 * files for changes
 */
gulp.task('default', ['clean'], function() {
  gulp.start(['browser-sync', 'watch']);
});