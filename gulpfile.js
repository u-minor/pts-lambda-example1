const gulp = require('gulp')
const $ = require('gulp-load-plugins')()
const argv = require('yargs').argv

gulp.task('build', () =>
  require('run-sequence')('clean', 'lambda')
)

gulp.task('clean', (done) =>
  require('del')(['build/*', '!build/node_modules', 'dist/*'], done)
)

gulp.task('prepareCode', () =>
  gulp.src('src/**/*.js')
    .pipe(gulp.dest('build'))
)

gulp.task('preparePackages', () =>
  gulp.src('./package.json')
    .pipe(gulp.dest('build'))
    .pipe($.install({production: true}))
)

gulp.task('lambda', ['prepareCode', 'preparePackages'], () => {
  const lambdaConfig = require('js-yaml').safeLoad(require('fs').readFileSync('lambda.yml', 'utf8'))

  return gulp.src(['build/**', '!build/package.json'])
    .pipe($.zip('lambda.zip'))
    .pipe($.awslambda(lambdaConfig.lambda, lambdaConfig.config))
    .pipe(gulp.dest('dist'))
})
