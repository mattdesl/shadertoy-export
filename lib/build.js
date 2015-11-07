var path = require('path')
var browserify = require('browserify')
var fs = require('fs')

var browserifyOpts = {
  cache: {},
  debug: true,
  packageCache: {},
  commondir: false, // needed for __dirname and __filename
  basedir: __dirname,
  browserField: true,
  builtins: false,
  insertGlobalVars: {
    process: function () { return 'window.process' }
  }
}

module.exports = setupBuild
function setupBuild (cb) {
  cb = cb || function () {}
  if (process.env.NODE_ENV === 'development') {
    var file = path.resolve(__dirname, '..', 'bundle.js')
    var output = fs.createWriteStream(file)
    output.on('close', cb)
    browserify('client.js', browserifyOpts)
      .bundle()
      .pipe(output)
  } else {
    process.nextTick(cb)
  }
}

if (require.main === module) {
  setupBuild()
}
