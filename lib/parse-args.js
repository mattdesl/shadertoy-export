var minimist = require('minimist')

module.exports = function parseArgs (args) {
  return minimist(args, {
    alias: {
      size: 's',
      output: 'o',
      api: 'a',
      wait: 'w',
      scale: 'S',
      frame: 'f',
      chunkSize: 'chunk-size'
    },
    boolean: ['api', 'frame', 'verbose'],
    string: ['output', 'size'],
    default: {
      chunkSize: 256,
      scale: 1,
      size: '256,256'
    }
  })
}