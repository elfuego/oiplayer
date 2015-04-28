// gulp tasks to minify script and css

var gulp = require('gulp'),
    fs = require('fs'),
    filter = require('gulp-filter'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    minifyCSS = require('gulp-minify-css');
    
gulp.task('watch', function() {
    // watch all files, run default when something changes
    gulp.watch('**/*.*', ['default']);
});

gulp.task('jsmin', function() {
    gulp.src('js/*.js')
        .pipe(filter(['**/*', '!*.min.js']))
        .pipe(concat('jquery.oiplayer.min.js'))
        .pipe(uglify({ 
                mangle: true,
                compress: { drop_console: true }
            }))
        .pipe(gulp.dest('./js/'));
});

gulp.task('cssmin', function(){
    gulp.src('css/*.css')
    .pipe(concat('oiplayer.min.css'))
    .pipe(minifyCSS()) 
    .pipe(gulp.dest('./css/'));
});

gulp.task('default', ['jsmin', 'cssmin'], function() {
    //console.log('default task finished :)');
});