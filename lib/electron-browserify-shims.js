var color = require('term-color')
var remote = global.require('remote')
var process = remote.process
global.process = process

window.onerror = function (msg, file, line, col, err) {
  process.stderr.write(err.message + '\n')
  remote.getCurrentWindow().close()
  return false
}
