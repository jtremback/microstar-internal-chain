'use strict';

var pull = require('pull-stream')
var mMessage = require('../microstar-message')
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
function write (settings, a, b) {
  var previous
  var initial
  var callback
  if (typeof a === 'function') {
    callback = a
  } else {
    initial = a
    callback = b
  }
  return pull(
    pull.asyncMap(function (message, callback) {
      if (!previous && !initial) {
        // Get previous message from db
        llibrarian.readOne(settings, {
          k: ['public_key', 'chain_id', 'sequence'],
          v: [settings.keys.public_key, message.chain_id],
          peek: 'last'
        }, function (err, prev) {
          if (prev) { prev = prev.value }
          format(settings, message, prev || initial, function (err, message) {
            previous = message
            callback(err, message)
          })
        })
      } else {
        format(settings, message, previous || initial, function (err, message) {
          previous = message
          callback(err, message)
        })
      }
    }),
    mChain.createDocs(settings),
    llibrarian.write(settings, callback)
  )
}

// function format (settings, message, prev, callback) {
//   message = mMessage.createSequence(settings, message, prev)
//   mMessage.createEnvelope(settings, message, prev, function (err, message) {
//     prev = message
//     return callback(err, message, prev)
//   })
// }

// // Formats messages and then writes them to db
// function write (settings, initial, callback) {
//   var previous
//   return pull(
//     pull.asyncMap(function (message, callback) {
//       if (!previous && !initial) {
//         // Get previous message from db
//         llibrarian.readOne(settings, {
//           k: ['pub_key', 'chain_id', 'sequence'],
//           v: [settings.keys.publicKey, message.chain_id],
//           peek: 'last'
//         }, function (err, last) {
//           format(settings, message, last || initial, function (err, message, last) {
//             previous = last
//             callback(err, message)
//           })
//         })
//       } else {
//         format(settings, message, previous || initial, function (err, message, last) {
//           previous = last
//           callback(err, message)
//         })
//       }
//     }),
//     mChain.createDocs(settings),
//     llibrarian.write(settings, callback)
//   )
// }

function format (settings, message, prev, callback) {
  message = mMessage.createSequence(settings, message, prev)
  mCrypto.hash(message.chain_id + message.sequence, function (err, hash) {
    if (err) { return callback(err) }
    // 24 byte nonce from a 32 char string? this is really fishy. fix later
    var nonce = hash.substring(0, 32)

    mCrypto.secretbox(JSON.stringify(message.content), nonce, settings.keys.secret_key, function (err, cipher) {
      message.content = cipher
      mMessage.createEnvelope(settings, message, prev, function (err, message) {
        prev = message
        return callback(err, message, prev)
      })
    })
  })
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

      mCrypto.secretbox(JSON.stringify(message.content), nonce, settings.keys.secret_key, function (err, cipher) {
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