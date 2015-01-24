'use strict';

var pull = require('pull-stream')
var mMessage = require('../microstar-message')
var mChain = require('../microstar-chain')
var mCrypto = require('../microstar-crypto')
var llibrarian = require('../level-librarian')
var _ = require('lodash')
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
  var previous

  return pull(
    // mChain.createDocs(settings),
    // llibrarian.addIndexDocs(settings.indexes),
    pull.asyncMap(function (doc, callback) {
      var key = doc.key
      var message = doc.value
      if (!previous) {
        // Get previous message from db
        llibrarian.readOne(settings, {
          k: ['public_key', 'chain_id', 'sequence'],
          v: [settings.keys.public_key, message.value.chain_id],
          peek: 'last'
        }, function (err, prev) {
          if (prev) { prev = prev.value }
          format(settings, message.value, prev, function (err, message) {
            previous = message
            callback(err, message)
          })
        })
      } else {
        format(settings, message.value, previous, function (err, message) {
          previous = message
          callback(err, message)
        })
      }
    })
    // pl.write(settings.db, settings.level_opts, callback)
    // llibrarian.write(settings, callback)
  )
}

function encryptContent (settings, message, prev, callback) {
  // Add chain_id and message sequence together to get non-repeating nonce.
  mCrypto.hash(message.chain_id + (prev ? prev.sequence + 1 : 0), function (err, hash) {
    if (err) { return callback(err) }
    // 24 byte nonce from a 32 char string? this is really fishy. fix later
    var nonce = hash.substring(0, 32)

    mCrypto.secretbox(JSON.stringify(message.content), nonce, settings.keys.secret_key, function (err, cipher) {
      message.content = cipher
      return callback(err, message)
    })
  })
}

function createDoc (settings, message, callback) {
  settings.crypto.hash(stringify(message), function (err, hashed) {
    return callback(err, {
      key: hashed,
      value: message
    })
  })
}

function format (settings, message, prev, callback) {
  encryptContent(settings, message, prev, function (err, message_enc) {
    if (err) { return callback(err) }

    mMessage.createEnvelope(settings, message_enc, prev, function (err, enveloped_enc) {
      if (err) { return callback(err) }

      settings.crypto.hash(stringify(enveloped_enc), function (err, hashed_enc) {
        var enveloped_mixed = _.cloneDeep(enveloped_enc)
        enveloped_mixed.content = message.content

        var doc_mixed = { key: hashed_enc, value: enveloped_mixed }
        var doc_enc = { key: hashed_enc, value: enveloped_enc }

        return callback(err, llibrarian.makeIndexDocs(doc_mixed, settings.indexes))
      })
    })
  })
}

// function format (settings, message, prev, callback) {
//   // Add chain_id and message sequence together to get non-repeating nonce.
//   mCrypto.hash(message.chain_id + (prev ? prev.sequence + 1 : 0), function (err, hash) {
//     if (err) { return callback(err) }
//     // 24 byte nonce from a 32 char string? this is really fishy. fix later
//     var nonce = hash.substring(0, 32)

//     mCrypto.secretbox(JSON.stringify(message.content), nonce, settings.keys.secret_key, function (err, cipher) {
//       message.content = cipher
//       mMessage.createEnvelope(settings, message, prev, function (err, message) {
//         prev = message
//         return callback(err, message, prev)
//       })
//     })
//   })
// }

function read (settings, query, callback) {
  return pull(
    mChain.read(settings, query, callback),
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