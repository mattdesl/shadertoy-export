var triangle = require('a-big-triangle')
var createLoop = require('canvas-loop')
var createShader = require('gl-shader')
var createTouch = require('touches')
var createTexture = require('gl-texture2d')
var newArray = require('new-array')
var now = require('right-now')
var loadImage = require('img')
var noop = function () {}

var defaultFragmentShader = [
  'precision mediump float;',
  'void main() {',
  'gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);',
  '}'
].join('\n')

var defaultVertexShader = [
  'attribute vec4 position;',
  'void main() {',
  'gl_Position = position;',
  '}'
].join('\n')

module.exports = createApp
function createApp (gl, opt) {
  opt = opt || {}
  
  var fragment = opt.fragment || defaultFragmentShader
  var vertex = opt.vertex || defaultVertexShader
  
  var canvas = gl.canvas
  var loop = createLoop(canvas, opt)
  
  var channels = (opt.channels || [])
  var remaining = channels.length
  
  if (remaining === 0) { // no textures to load...
    process.nextTick(loop.emit.bind(loop, 'loaded'))
  }
  
  channels = channels.map(function (src) {
    return createAsyncTexture(gl, src, function (err) {
      if (err) console.error("Could not load", src)
      remaining--
      if (remaining === 0) {
        loop.emit('loaded')
      }
    })
  })
  
  var extensions = gl.getSupportedExtensions()
  extensions.forEach(function (ext) {
    gl.getExtension(ext)
  })

  var nMouse = newArray(4, 0)
  var shader = createShader(gl, vertex, fragment)

  // temporary vectors
  var iMouse = newArray(4, 0)
  var iResolution = newArray(3, 0)
  var iDate = newArray(4, 0)
  var iGlobalTime = 0
  var iSampleRate = 44100 // unused
  var iChannelTime = newArray(4, 0) // unused
  var iChannelResolution = newArray(4).map(function () {
    return newArray(3)
  })

  // handle dragging in the same way as ShaderToy
  var dragging = false
  createTouch(canvas, { filtered: true })
    .on('start', function (ev, position) {
      dragging = true
      updateClick(position)
    })
    .on('end', function (ev, position) {
      dragging = false
      updateClick(position)
    })
    .on('move', function (ev, position) {
      if (dragging) updateMouse(position)
    })

  loop.render = render
  loop.canvas = canvas
  loop.gl = gl
  loop.shader = shader

  loop.on('tick', function () {
    render()
  })

  if (opt.once) {
    loop.render()
  } else {
    loop.start()
  }

  return loop

  function updateClick (position) {
    updateMouse(position)
    nMouse[2] = nMouse[0]
    nMouse[3] = nMouse[1]
  }

  function updateMouse (position) {
    nMouse[0] = position[0] / window.innerWidth
    nMouse[1] = 1 - (position[1] / window.innerHeight)
  }

  function render (width, height) {
    width = typeof width === 'number' ? width : gl.drawingBufferWidth
    height = typeof height === 'number' ? height : gl.drawingBufferHeight
    gl.viewport(0, 0, width, height)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    shader.bind()

    var date = new Date()
    iDate[0] = date.getFullYear()
    iDate[1] = date.getMonth()
    iDate[2] = date.getDate()
    iDate[3] = now() / 1000
    iGlobalTime = iDate[3]

    iResolution[0] = width
    iResolution[1] = height
    iResolution[2] = loop.scale

    iMouse[0] = nMouse[0] * width
    iMouse[1] = nMouse[1] * height
    iMouse[2] = nMouse[2] * width
    iMouse[3] = nMouse[3] * height

    for (var i = 3; i >= 0; i--) {
      var tex = channels[i]
      gl.activeTexture(gl.TEXTURE0 + i)
      if (tex) {
        iChannelResolution[0] = tex.width
        iChannelResolution[1] = tex.height
        iChannelResolution[2] = 1
        tex.bind(i)
      }
    }

    shader.uniforms.iChannel0 = 0
    shader.uniforms.iChannel1 = 1
    shader.uniforms.iChannel2 = 2
    shader.uniforms.iChannel3 = 3
    shader.uniforms.iSampleRate = iSampleRate
    shader.uniforms.iChannelTime = iChannelTime
    shader.uniforms.iDate = iDate
    shader.uniforms.iResolution = iResolution
    shader.uniforms.iGlobalTime = iGlobalTime
    shader.uniforms.iMouse = iMouse
    triangle(gl)
  }
}

function createAsyncTexture (gl, src, cb) {
  var binding = {
    width: 0,
    height: 0,
    bind: noop
  }
  cb = cb || noop
  if (typeof src === 'string') {
    loadImage(src, { crossOrigin: 'Anonymous' }, function (err, img) {
      if (err) return cb(err)
      var tex = createTexture(gl, img)
      tex.minFilter = gl.LINEAR_MIPMAP_LINEAR
      tex.magFilter = gl.LINEAR
      tex.wrap = gl.REPEAT
      tex.generateMipmap()
      binding.width = img.width
      binding.height = img.height
      binding.bind = function (slot) {
        tex.bind(slot)
      }
      cb(null, binding)
    })
  } else {
    // assume gl-texture2d object
    if (src && typeof src.bind === 'function') {
      binding = src
    }
    process.nextTick(function () {
      cb(null, binding)
    })
  }
  return binding
}
