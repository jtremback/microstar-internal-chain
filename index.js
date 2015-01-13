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

// Formats messages and then writes them to db
function write (settings, callback) {
  return pull(
    mChain.createSequences(settings),
    encryptContent(settings),
    mChain.createEnvelopes(settings),
    mChain.createDocs(settings),
    llibrarian.write(settings, callback)
  )
}

function read (settings, query, callback) {
  return pull(
    mChain.read(settings, query, callback),
    decryptContent(settings)
  )
}

function encryptContent (settings) {
  return pull.asyncMap(function (message, callback) {
    mCrypto.hash(message.chain_id + message.sequence, function (err, hash) {
      if (err) { return callback(err) }
      // 24 byte nonce from a 32 char string? this is really fishy. fix later
      var nonce = hash.substring(0, 32)

      mCrypto.secretbox(message.content, nonce, settings.keys.secret_key, function (err, cipher) {
        message.content = cipher
        return callback(err, message)
      })
    })
  })
}

function decryptContent (settings) {
  return pull.asyncMap(function (message, callback) {
    mCrypto.hash(message.chain_id + message.sequence, function (err, hash) {
      if (err) { return callback(err) }
      // 24 byte nonce from a 32 char string? this is really fishy. fix later
      var nonce = hash.substring(0, 32)

      mCrypto.secretbox.open(message.content, nonce, settings.keys.secret_key, function (err, content) {
        message.content = content
        return callback(err, message)
      })
    })
  })
}

function sequential (settings, public_key, chain_id, sequence) {
  return pull(
    mChain.sequential(settings, public_key, chain_id, sequence),
    decryptContent(settings)
  )
}