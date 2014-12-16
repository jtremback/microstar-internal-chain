'use strict';

var krypt = require('krypt')
var pull = require('pull-stream')
var r = require('ramda')

var mChain = require('microstar-chain')

module.exports = function (settings) {
  return {
    write: r.lPartial(write, settings),
    read: r.lPartial(read, settings)
  }
}

module.exports.write = write
module.exports.read = read

// settings = {
//   crypto: JS,
//   keys: JS,
//   db: db
// }
//
// message = {
//   content: JSON,
//   type: String,
//   feed_id: String
// }

function write (settings, callback) {
  return pull(
    encryptContents(settings),
    mChain.write(settings, callback)
  )
}


function read (settings, query, callback) {
  return pull(
    mChain.read(settings, query, callback),
    decryptContents(settings)
  )
}

function readOne (settings, query, callback) {
  pull(
    read(settings, query, callback),
    pull.drain(function (data) {
      callback(null, data)
      return false
    })
  )
}

function encryptContents (settings) {
  return pull(
    pull.map(function (message) {
      message.content = krypt.encrypt(message, settings.keys.symmetric)
      return message
    })
  )
}

function decryptContents (settings) {
  return pull(
    pull.map(function (message) {
      message.content = krypt.decrypt(message, settings.keys.symmetric)
      return message
    })
  )
}