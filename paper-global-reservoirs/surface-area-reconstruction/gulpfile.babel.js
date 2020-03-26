'use strict';

import "babel-polyfill";
import babel from 'gulp-babel';
import gulp from 'gulp';
import concat from 'gulp-concat';
import merge from 'merge-stream';
import each from 'gulp-each';
import path from 'path';
import * as git from 'gulp-git';

gulp.task('generate-playground-scripts', function () {
    let scripts = [
        {
            output: 'gallery.js',
            input: [
                './src/scripts/gallery.js',
                './src/imports.js',
                './src/utils.js',
                './src/utils-text.js',
                './src/utils-gallery.js',
                './src/algorithms.js',
                './src/algorithms-aster.js',
                './src/algorithms-asterT.js',
                './src/algorithms-landsat.js',
                './src/algorithms-modis.js',
                './src/algorithms-proba.js',
                './src/algorithms-sentinel1.js',
                './src/algorithms-sentinel2.js',
                './src/collections.js',
                './src/scripts/footer.js'
            ]
        },
        {
            output: 'surface-water.js',
            input: [
                './src/imports.js',
                './src/scripts/surface-water.js',
                './src/utils.js',
                './src/utils-text.js',
                './src/algorithms.js',
                './src/algorithms-aster.js',
                './src/algorithms-asterT.js',
                './src/algorithms-landsat.js',
                './src/algorithms-modis.js',
                './src/algorithms-proba.js',
                './src/algorithms-sentinel1.js',
                './src/algorithms-sentinel2.js',
                './src/collections.js',
                './src/scripts/footer.js'
            ]
        },
        {
            output: 'chart.js',
            input: [
                './src/scripts/chart.js',
                './src/imports.js',
                './src/utils.js',
                './src/algorithms.js',
                './src/collections.js',
                './src/scripts/footer.js'
            ]
        },
        {
            output: 'water-occurrence.js',
            input: [
                './src/imports.js',
                './src/scripts/water-occurrence.js',
                './src/utils.js',
                './src/algorithms.js',
                './src/algorithms-aster.js',
                './src/algorithms-asterT.js',
                './src/algorithms-landsat.js',
                './src/algorithms-modis.js',
                './src/algorithms-proba.js',
                './src/algorithms-sentinel1.js',
                './src/algorithms-sentinel2.js',
                './src/collections.js',
                './src/scripts/footer.js'
            ]
        }
    ];

    let outputs = scripts.map((script) => {
        console.log('Merging ' + script.output + ' ...');
        return gulp.src(script.input)
            .pipe(each((content, file, callback) => {
		let fileName = path.basename(file.path)
                callback(null, '// ============================= generated: ' + fileName + '\n' + content)
            }))
            .pipe(concat(script.output))
            .pipe(babel({ presets: ['es2015'] }))
            .pipe(gulp.dest('./dist/'))
    });

    return merge(outputs);
});

gulp.task('default', ['generate-playground-scripts'], function () {
});

gulp.task('commit', function(){
  return gulp.src(['./dist', './src', './tests', './gulpfile.babel.js', './package.json'])
    .pipe(git.commit('client-side changes'));
});

gulp.task('push', ['generate-playground-scripts', 'commit'], function (done) {
   git.push('origin', 'master', function (err) {
     if (err) throw err;
     if (done) done();
   });
});
