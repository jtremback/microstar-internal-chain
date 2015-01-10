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
  sequential: sequential,
  copy: mChain.copy,
  format: mChain.format,
  validate: mChain.validate,
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
    encryptContent(settings),
    mChain.write(settings, callback)
  )
}

function read (settings, query, callback) {
  return pull(
    mChain.read(settings, query, callback),
    decryptContent(settings)
  )
}

function encryptContent (settings) {
  return pull(
    pull.asyncMap(function (message, callback) {
      mCrypto.makeNonce(function (err, nonce) {
        message.nonce = nonce
        message.content = mCrypto.secretbox(message.content, nonce, settings.keys.secret_key, callback)
      })
    })
  )
}

function decryptContent (settings) {
  return pull(
    pull.asyncMap(function (message, callback) {
      message.content = mCrypto.secretbox(message.content, message.nonce, settings.keys.secret_key, callback)
    })
  )
}

function sequential (settings, pub_key, chain_id, sequence) {
  return pull(
    mChain.sequential(settings, pub_key, chain_id, sequence),
    decryptContent(settings)
  )
}