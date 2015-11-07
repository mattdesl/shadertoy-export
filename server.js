var app = require('app')
var BrowserWindow = require('browser-window')
var path = require('path')
var argv = require('./lib/parse-args')(process.argv.slice(2))
var build = require('./lib/build')

process.on('uncaughtException', function (err) {
  process.stderr.write(err.message + '\n')
})

var mainWindow = null
app.on('window-all-closed', function () {
  app.quit()
})

app.on('ready', function () {
  var showFrame = argv.frame
  var size = showFrame ? 512 : 0
  mainWindow = new BrowserWindow({
    width: size,
    height: size,
    preload: require.resolve('./lib/electron-browserify-shims'),
    'use-content-size': true,
    'node-integration': true
  })
  
  build(function () {
    mainWindow.loadUrl(path.join('file://', __dirname, 'index.html'))
  })

  mainWindow.on('closed', function () {
    mainWindow = null
  })
})
