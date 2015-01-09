'use strict';

var pull = require('pull-stream')
var mChain = require('../microstar-chain')
var mCrypto = require('../microstar-crypto')
var llibrarian = require('../level-librarian')

module.exports = {
  write: write,
  writeOne: llibrarian.makeWriteOne(write),
  read: read,
  readOne: llibrarian.makeReadOne(read),
  indexes: mChain.indexes
}

// settings = {
//   crypto: JS,
//   keys: JS,
//   db: db
// }
//
// message = {
//   content: JSON,
//   type: String,
//   chain_id: String
// }

function write (settings, callback) {
  return pull(
    pull.asyncMap(function (message, callback) {
      mCrypto.makeNonce(function (nonce) {
        message.nonce = nonce
        message.content = mCrypto.secretbox(message.content, nonce, settings.keys.secret_key, callback)
      })
    }),
    mChain.write(settings, callback)
  )
}

function read (settings, query, callback) {
  return pull(
    mChain.read(settings, query, callback),
    pull.asyncMap(function (message, callback) {
      message.content = mCrypto.secretbox(message.content, message.nonce, settings.keys.secret_key, callback)
    })
  )
}
