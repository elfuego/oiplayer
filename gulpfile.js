// gulp tasks to minify script and css

var gulp = require('gulp'),
    //fs = require('fs'),
    del = require('del'),
    filter = require('gulp-filter'),
    less = require('gulp-less'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    cleanCSS = require('gulp-clean-css'),
    prettify = require('gulp-jsbeautifier'),
    notify = require('gulp-notify'),
    lint = require('gulp-jshint'),
    stylish = require('jshint-stylish');

var browserSync = require('browser-sync'),
    reload = browserSync.reload;


gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: '.'
        },
        browser: "google chrome",
        watchOptions: {
            ignoreInitial: true,
            ignored: '*.txt, *.png, *.json, gulpfile.js'
        },
        files: [
            "./**/*.*",
            "!.*",
            "!gulpfile.js",
            "!./node_modules/",
            "!./oiplayer.bbprojectd/"
        ],
        reloadDelay: 500,
        reloadDebounce: 1000
    });
});

gulp.task('prettify', function(){
    gulp.src([
            './js/**/*', 
            '!./js/*.min.js'
        ])
        .pipe(prettify({config:'./jsbeautify.json'}))
        .pipe(prettify.reporter())
        .pipe(gulp.dest('./js/'));
});

gulp.task('jslint', function(){
    gulp.src([
            './js/**/*', 
            '!./js/*.min.js'
        ])
        .pipe(lint())
        .pipe(lint.reporter(stylish))
        //.pipe(lint.reporter('fail'))
        .on('error', notify.onError( (err) => {
                return { icon: false, title: 'JS LINT ERROR', message: err.message };
            }));
});

gulp.task('jsmin', function() {
    gulp.src('js/*.js')
        .pipe(filter([
            '**/*', 
            '!*.min.js'
        ]))
        .pipe(concat('jquery.oiplayer.min.js'))
        .pipe(uglify({ 
                mangle: true,
                compress: { drop_console: true }
            }))
        .pipe(gulp.dest('./js/'));
});

gulp.task('less', function() {
    gulp.src('less/oiplayer.less')
        .pipe(sourcemaps.init())
        .pipe(less())
        .on('error', notify.onError( (error) => {
            return { icon: 'Icon.png', title: 'LESS ERROR ON LINE ' + error.line, message: error.message };
        }))
        .pipe(autoprefixer())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./css/'));
});

gulp.task('cssmin', function(){
    gulp.src('css/oiplayer.css')
        .pipe(concat('oiplayer.min.css'))
        .pipe(cleanCSS({compatibility: 'ie8'})) 
        .pipe(gulp.dest('./css/'));
});

gulp.task('clean', function() {
    return del([
            'css/*.min.css'
        ]);
});

// gulp.task('images-watch', ['images'], reload);
gulp.task('js-watch', ['jslint', 'jsmin'], reload);
gulp.task('less-watch', ['less', 'cssmin'], reload);

gulp.task('default', ['jslint', 'jsmin', 'less', 'cssmin'], function() {
    gulp.watch(['./js/*.js', '!./js/*.min.js'], ['js-watch']);
    gulp.watch(['./less/*.less'], ['less-watch']);
    gulp.watch(['./*.html'], reload);

    gulp.start('browser-sync');
});
