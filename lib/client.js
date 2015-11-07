var createFBO = require('gl-fbo')
var pixelStream = require('gl-pixel-stream')
var PNGEncoder = require('png-stream/encoder')
var path = require('path')
var keycode = require('keycode')
var request = require('xhr-request')
var createApp = require('./shadertoy')
var isAbsPath = require('path-is-absolute')
var fs = require('fs')
var util = require('util')
var stdoutStream = require('stdout-stream')
var noop = function (){}

var argv = require('./parse-args')(process.argv.slice(2))

//e.g. https://www.shadertoy.com/view/XslGRr
var entry = argv._[0]
if (!entry) {
  throw new Error('must provide an entry point\n' +
    'examples:\n  shadertoy https://www.shadertoy.com/view/XslGRr --api > image.png\n' +
    '  shadertoy XslGRr --api -o=output/image.png\n' +
    '  shadertoy index.glsl --input tex01.png')
}

if (argv.api) {
  if (entry.indexOf('http') === 0) {
    entry = entry.match(/view\/(.*)$/)[1]
  }
  
  if (argv.verbose) process.stderr.write('Requesting shader...\n')
  var api = 'https://www.shadertoy.com/api/v1/shaders/' + entry + '?key=fdHKwH'
  request(api, { json: true }, function (err, body) {
    if (err) throw err
    fromApi(body)
  })
} else {
  entry = isAbsPath(entry) ? entry : path.resolve(process.cwd(), entry)
  fs.readFile(entry, 'utf8', function (err, src) {
    if (err) throw err
    create(src, filterInputs(argv.input))
  })
}

function filterInputs (inputs) {
  inputs = Array.isArray(inputs) ? inputs : [ inputs ]
  return inputs // TODO: could make this UX better by doing -i=01
}

function fromApi (response) {
  var shaderObj = response.Shader
  if (!shaderObj) {
    throw new Error('No ShaderToy found by the given parameters.\n' +
      'Make sure the ID ' + entry + ' is saved as "Public + API".')
  }
  var pass = shaderObj.renderpass[0]
  pass.inputs.sort(function (a, b) {
    return a.channel - b.channel
  })

  var channels = pass.inputs.map(function (input) {
    return input.src.replace(/^\/+/, '')
  })
  
  create(pass.code, channels)
}

function create (shader, channels) {
  if (argv.verbose) process.stderr.write('Creating application...\n')
  var app = createApp(shader, {
    // whether to render only one frame or not
    once: false,
    scale: argv.scale,
    channels: channels
  })
  
  if (typeof argv.wait === 'number') {
    app.on('loaded', function () {
      setTimeout(onProdSave, argv.wait)
    })
  } else {
    app.on('loaded', onProdSave)
  }
  
  var gl = app.gl

  app.once('tick', function () {
    if (argv.verbose) process.stderr.write('Rendering...\n')
  })

  var shape = argv.size.split(',').map(function (x) {
    return parseInt(x, 10)
  })

  if (shape.length !== 2) {
    throw new Error('the --size option must be a width,height tuple')
  }

  var fbo = createFBO(gl, shape, {
    depth: false,
    stencil: false
  })

  window.addEventListener('keydown', function (ev) {
    var code = keycode(ev)
    var w = code === 's'
    var ctrlW = ev.ctrlKey && w
    var cmdW = ev.metaKey && w
    if (ctrlW || cmdW) save()
  })
  
  function onProdSave () {
    if (!argv.frame) {
      save(function () {
        global.require('remote').getCurrentWindow().close()
      })
    }
  }

  function save (cb) {
    cb = cb || noop
    
    if (argv.frame && !argv.output) {
      process.stderr.write('Must specify --output with --frame option.\n')
      return process.nextTick(cb)
    }
    
    fbo.bind()
    app.render(shape[0], shape[1])
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    
    var encoder = new PNGEncoder(shape[0], shape[1], { colorSpace: 'rgba' })
    
    var output
    if (argv.output) {
      var file = isAbsPath(argv.output) ? argv.output : path.resolve(process.cwd(), argv.output)
      output = fs.createWriteStream(file)
      output.on('close', function () {
        process.stderr.write(util.format('Saved %dx%d image to %s\n', shape[0], shape[1], file))
        cb()
      })
    } else {
      output = stdoutStream
      encoder.on('end', cb)
    }
    
    pixelStream(gl, fbo.handle, shape, {
      flipY: true,
      chunkSize: argv.chunkSize
    }).pipe(encoder)
    encoder.pipe(output)
  }
}