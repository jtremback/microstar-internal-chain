'use strict';

var pull = require('pull-stream')
var mMessage = require('../microstar-message')
var mChain = require('../microstar-chain')
var mCrypto = require('../microstar-crypto')
var llibrarian = require('../level-librarian')
var _ = require('lodash')
var pl = require('pull-level')
var stringify = require('stable-stringify')

module.exports = {
  write: write,
  writeOne: llibrarian.makeWriteOne(write),
  read: read,
  readOne: llibrarian.makeReadOne(read),
  sequential: sequential,
  copy: mChain.copy,
  format: mChain.format,
  validate: mChain.validate,
  index_defs: mChain.index_defs
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
  var previous

  return pull(
    pull.asyncMap(function (message, callback) {
      if (!previous) {
        // Get previous message from db
        llibrarian.readOne(settings, {
          k: ['public_key', 'chain_id', 'sequence'],
          v: [settings.keys.public_key, message.chain_id],
          peek: 'last'
        }, function (err, prev) {
          if (prev) { prev = prev.value }
          format(settings, message, prev, function (err, batch, enveloped_enc) {
            previous = enveloped_enc
            callback(err, batch)
          })
        })
      } else {
        format(settings, message, previous, function (err, batch, enveloped_enc) {
          previous = enveloped_enc
          callback(err, batch)
        })
      }
    }),
    pull.flatten(),
    pl.write(settings.db, settings.level_opts, callback)
  )
}

function format (settings, message, prev, callback) {
  encryptContent(settings, message, prev, function (err, message_enc) {
    if (err) { return callback(err) }

    mMessage.createEnvelope(settings, message_enc, prev, function (err, enveloped_enc) {
      if (err) { return callback(err) }

      settings.crypto.hash(stringify(enveloped_enc), function (err, hashed_enc) {
        // Fully encrypted document. This is what will be saved.
        var doc_enc = { key: hashed_enc, value: enveloped_enc }
        doc_enc.type = 'put'

        // Document used to generate indexes. Has unencrypted content.
        var doc_mixed = { key: hashed_enc, value: _.cloneDeep(enveloped_enc) }
        doc_mixed.value.content = message.content

        // Make index docs
        var batch = Object.keys(settings.index_defs).map(function (key) {
          return llibrarian.makeIndexDoc(doc_mixed, settings.index_defs[key])
        })

        batch.push(doc_enc)

        return callback(err, batch, enveloped_enc)
      })
    })
  })
}

function encryptContent (settings, message, prev, callback) {
  // Add chain_id and message sequence together to get non-repeating nonce.
  mCrypto.hash(message.chain_id + (prev ? prev.sequence + 1 : 0), function (err, hash) {
    if (err) { return callback(err) }
    // 24 byte nonce from a 32 char string? this is really fishy. fix later
    var nonce = hash.substring(0, 32)

    mCrypto.secretbox(JSON.stringify(message.content), nonce, settings.keys.secret_key, function (err, cipher) {
      message = _.cloneDeep(message)
      message.content = cipher
      return callback(err, message)
    })
  })
}

function read (settings, query) {
  return pull(
    mChain.read(settings, query),
    decryptContent(settings)
  )
}

function decryptContent (settings) {
  return pull.asyncMap(function (message, callback) {
    mCrypto.hash(message.chain_id + message.sequence, function (err, hash) {
      if (err) { return callback(err) }
      // 24 byte nonce from a 32 char string? this is really fishy. fix later
      var nonce = hash.substring(0, 32)
      mCrypto.secretbox.open(message.content, nonce, settings.keys.secret_key, function (err, content) {
        message.content = JSON.parse(content)
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