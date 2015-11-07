var createApp = require('./shader-app')
var getContext = require('get-canvas-context')

var prefix = [
  '#extension GL_OES_standard_derivatives : enable',
  'precision mediump float;',
  'uniform float iGlobalTime;',
  'uniform float iSampleRate;',
  'uniform vec3 iResolution;',
  'uniform vec4 iMouse;',
  'uniform vec4 iDate;',
  'uniform vec3 iChannelResolution[4];',
  'uniform float iChannelTime[4];',
  'uniform sampler2D iChannel0;',
  'uniform sampler2D iChannel1;',
  'uniform sampler2D iChannel2;',
  'uniform sampler2D iChannel3;'
].join('\n')

var suffix = [
  'void main() {',
    'gl_FragColor = vec4(0.0);',
    'vec2 uv = gl_FragCoord.xy;',
    'mainImage(gl_FragColor, uv);',
  '}'
].join('\n')

module.exports = createShaderToy
function createShaderToy (code, opt) {
  opt = opt || {}
  var gl = getContext('webgl', {
    alpha: true,
    preserveDrawingBuffer: true
  })

  var shader = prefix + '\n' + code + '\n' + suffix
  opt.fragment = shader
  
  var app = createApp(gl, opt)

  document.body.style.margin = '0'
  document.body.style.overflow = 'hidden'
  document.body.appendChild(gl.canvas)
  return app
}