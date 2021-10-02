const gulp = require('gulp')
const path = require('path')
const runElectron = require("gulp-run-electron")
const ts = require('gulp-typescript')

const tsProject = ts.createProject('tsconfig.json');

gulp.task('scripts', function() {
  return gulp.src(["src/*.ts", 'src/**/*.ts'])
            .pipe(tsProject())
            .js
            .pipe(gulp.dest('src_build'))
})

gulp.task('assets', function() {
  return gulp.src(['src/**/*.jpg', 'src/**/*.png', 'src/**/*.css', 'src/**/*.html'])
            .pipe(gulp.dest('src_build'))
})

gulp.task('electron', function() {
  return gulp.src(".")
              .pipe(runElectron(["--dev"], {cwd: path.resolve(__dirname, 'src_build')}))
})

gulp.task('rerun-electron', function(cb) {
  return runElectron.rerun(cb)
})

gulp.task('default', () => {
  gulp.series(gulp.task('scripts'), gulp.task('assets'), gulp.task('electron')).call()
  gulp.watch('src/**/*.ts', gulp.series(gulp.task('scripts'), gulp.task('assets'), gulp.task('rerun-electron')));
})