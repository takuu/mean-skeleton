var gulp = require('gulp')
    , usemin = require('gulp-usemin')
    , uglify = require('gulp-uglify')
    , rimraf = require('rimraf')
    , minifyHtml = require('gulp-minify-html')
    , minifyCss = require('gulp-minify-css')
    , compass = require('gulp-compass')
    , header = require('gulp-header')
    , inject = require('gulp-inject')
    , imagemin = require('gulp-imagemin')
    , templateCache = require('gulp-angular-templatecache')
    , ngmin = require('gulp-ngmin')
    , refresh = require('gulp-livereload')
    , jshint = require('gulp-jshint')
    , rev = require('gulp-rev')
    , lrserver = require('tiny-lr')()
    , express = require('express')
    , livereload = require('connect-livereload')
    , nodemon = require('gulp-nodemon');

// TODO: replace ngmin with ngtemplate


// Constants
var SERVER_PORT = 5000;
var LIVERELOAD_PORT = 35729;

// Header configuration
var pkg = require('./package.json');
var banner = ['/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  ' */',
  ''].join('\n');

// Compilation tasks
gulp.task('clean', function (cb) {
    rimraf.sync('./build');
    cb(null);
});

/*gulp.task('compass', function () {
    return gulp.src('./app/assets/stylesheets/*.scss')
        .pipe(compass({
            css: '.tmp/assets/stylesheets',
            sass: 'app/assets/stylesheets',
            image: 'app/assets/images'
        }))
        .on('error', function(err) {
            console.log(err.message);
        })
        .pipe(gulp.dest('./.tmp'))
        .pipe(refresh(lrserver));
});*/

gulp.task('lint', function() {
    return gulp.src(['./client/app/**/*.js','./client/components/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('views', function() {
    return gulp.src(['./client/app/**/*.html','./client/components/**/*.html'])
        .pipe(templateCache({
            module: 'app',
            root: 'assets/views'
        }))
        .pipe(gulp.dest('./.tmp/assets/javascripts'));
});

gulp.task('images', function() {
    return gulp.src('./client/app/assets/images/**/*.*')
        .pipe(imagemin())
        .pipe(gulp.dest('./build/assets/images'));
});

gulp.task('compile', ['clean', 'views', 'images', 'lint'], function() {
    var projectHeader = header(banner, { pkg : pkg } );

    gulp.src('.client/*.html')
        .pipe(inject(gulp.src('./.tmp/assets/javascripts/templates.js', {read: false}),
            {
                starttag: '<!-- inject:templates:js -->',
                ignorePath: '/.tmp'
            }
        ))
        .pipe(usemin({
            css:          [minifyCss(), rev(), projectHeader],
            html:         [minifyHtml({ empty: true })],
            js:           [ngmin(), uglify(), rev(), projectHeader],
            js_libs:      [rev()]
        }))
        .pipe(gulp.dest('build/'));
});

// Serve tasks
gulp.task('reload:html', function () {
    return gulp.src(['./client/app/**/*.html', './client/components/**/*.html'])
        .pipe(refresh(lrserver));
})

gulp.task('watch', function () {
    // gulp.watch('client/app/assets/stylesheets/**/*.scss', ['compass']);
    gulp.watch('client/app/**/*.html', ['reload:html']);
});

// serve just the frontend
gulp.task('serve:app', ['watch'], function() {
    var server = express();
    server.use(livereload({
      port: LIVERELOAD_PORT
    }));
    server.use(express.static('./.tmp'));
    server.use(express.static('./client'));
    server.listen(SERVER_PORT);

    lrserver.listen(LIVERELOAD_PORT);
});


// serve the backend / that serves the index.html ...
gulp.task('serve', function () {
  nodemon({ script: 'server/app.js', ext: 'html js', ignore: ['.tmp/**', 'node_modules/**'], nodeArgs: ['--debug']  })
    .on('change', ['lint'])
    .on('restart', function () {
      console.log('restarted!')
    })
})

gulp.task('serve:build', function() {
    var server = express();
    server.use(express.static('./build'));
    server.listen(SERVER_PORT);
});

gulp.task('default', ['compile']);