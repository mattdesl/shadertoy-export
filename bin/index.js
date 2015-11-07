#!/usr/bin/env node
var spawn = require('child_process').spawn
var electron = require('electron-prebuilt')
var path = require('path')
var args = process.argv.slice(2)
var serverPath = path.resolve(__dirname, '../server.js')

// spawn electron
spawn(electron, [ serverPath ].concat(args), { stdio: 'inherit' })
