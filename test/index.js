'use strict';

var test = require('tape')
var mInternalChain = require('../')
var mChain = require('../../microstar-chain')
var mCrypto = require('../../microstar-crypto')

var level = require('level-test')()
var level = require('level')
// var rimraf = require('rimraf')
// rimraf.sync('./test.db')

var pull = require('pull-stream')
var async = require('async')

var db = level('./test.db', { valueEncoding: 'json' })

mCrypto.keys('h4dfDIR+i3JfCw1T2jKr/SS/PJttebGfMMGwBvhOzS4=', function (err, keys) {
  tests(keys)
})

function tests (keys) {
  var settings = {
    crypto: mCrypto,
    keys: keys,
    db: db,
    indexes: mInternalChain.indexes
  }

  settings.indexes.push(['public_key', 'chain_id', 'type', 'content[0]', 'sequence'])

  var raw_messages = [{
    content: 'Fa',
    timestamp: 1418804138168,
    type: 'holiday-carols:syllable',
    chain_id: 'holiday-carols:2014'
  }, {
    content: 'La',
    timestamp: 1418804138169,
    type: 'holiday-carols:syllable',
    chain_id: 'holiday-carols:2014'
  }, {
    content: 'Laa',
    timestamp: 1418804138170,
    type: 'holiday-carols:syllable',
    chain_id: 'holiday-carols:2014'
  }]

  var encrypted_messages = [{
    chain_id: 'holiday-carols:2014',
    content: 'ADP1A0CFVa9sxCmeaUEW1SttYeA=',
    previous: null,
    public_key: 'N3DyaY1o1EmjPLUkRQRu41/g/xKe/CR/cCmatA78+zY=7XuCMMWN3y/r6DeVk7YGY8j/0rWyKm3TNv3S2cbmXKk=',
    sequence: 0,
    signature: 'l5z5Wr6fx+zKyZ3u+3wpfJs9d+IPJjBcjmycP7I9+JLyjBew32W3sEph4rASqHOawGTw861P07/e3lbAuEsIAw==',
    timestamp: 1418804138168,
    type: 'holiday-carols:syllable'
  }, {
    chain_id: 'holiday-carols:2014',
    content: 'NIRugXxD2RdLC5pZxGgQUjROOt4=',
    previous: '7tnF9BOZCvP772uR1NWyLv9TQ2Z0T+32riey4gsoxu7U/dBVsrJfWSnrAH2A2WX6VKT1NEXmDow7V+WBS6rTFA==',
    public_key: 'N3DyaY1o1EmjPLUkRQRu41/g/xKe/CR/cCmatA78+zY=7XuCMMWN3y/r6DeVk7YGY8j/0rWyKm3TNv3S2cbmXKk=',
    sequence: 1,
    signature: 'UVbFCY/La8WA45gsfiEQHPH9LhVQguj+7c3Ryhmh9DBpxshiEfWJxzksWZqV5dUBuVNgvseCkONeij+O/2p4Ag==',
    timestamp: 1418804138169,
    type: 'holiday-carols:syllable'
  }, {
    chain_id: 'holiday-carols:2014',
    content: 'jUz99DHe7OGdSD1kcLIXB6xPoN4s',
    previous: 'CIu7YG77MOSBCxfHWHKfhROwH77u4D4nWBOXoDnJZXz0X/Ne9QQursF92vr200byapCHclPawEOPFRyvH45mqw==',
    public_key: 'N3DyaY1o1EmjPLUkRQRu41/g/xKe/CR/cCmatA78+zY=7XuCMMWN3y/r6DeVk7YGY8j/0rWyKm3TNv3S2cbmXKk=',
    sequence: 2,
    signature: 'FPxqA5KBQmRfC3ARQYRvzPHGqeRB18jOLHJuSWFUC0PY5x/cDBHPkEZDs7bo4G3/xbaD25y//G7G4G4IKSPLBg==',
    timestamp: 1418804138170,
    type: 'holiday-carols:syllable'
  }]

  var decrypted_messages = [{
    chain_id: 'holiday-carols:2014',
    content: 'Fa',
    previous: null,
    public_key: 'N3DyaY1o1EmjPLUkRQRu41/g/xKe/CR/cCmatA78+zY=7XuCMMWN3y/r6DeVk7YGY8j/0rWyKm3TNv3S2cbmXKk=',
    sequence: 0,
    signature: 'l5z5Wr6fx+zKyZ3u+3wpfJs9d+IPJjBcjmycP7I9+JLyjBew32W3sEph4rASqHOawGTw861P07/e3lbAuEsIAw==',
    timestamp: 1418804138168,
    type: 'holiday-carols:syllable'
  }, {
    chain_id: 'holiday-carols:2014',
    content: 'La',
    previous: '7tnF9BOZCvP772uR1NWyLv9TQ2Z0T+32riey4gsoxu7U/dBVsrJfWSnrAH2A2WX6VKT1NEXmDow7V+WBS6rTFA==',
    public_key: 'N3DyaY1o1EmjPLUkRQRu41/g/xKe/CR/cCmatA78+zY=7XuCMMWN3y/r6DeVk7YGY8j/0rWyKm3TNv3S2cbmXKk=',
    sequence: 1,
    signature: 'UVbFCY/La8WA45gsfiEQHPH9LhVQguj+7c3Ryhmh9DBpxshiEfWJxzksWZqV5dUBuVNgvseCkONeij+O/2p4Ag==',
    timestamp: 1418804138169,
    type: 'holiday-carols:syllable'
  }, {
    chain_id: 'holiday-carols:2014',
    content: 'Laa',
    previous: 'CIu7YG77MOSBCxfHWHKfhROwH77u4D4nWBOXoDnJZXz0X/Ne9QQursF92vr200byapCHclPawEOPFRyvH45mqw==',
    public_key: 'N3DyaY1o1EmjPLUkRQRu41/g/xKe/CR/cCmatA78+zY=7XuCMMWN3y/r6DeVk7YGY8j/0rWyKm3TNv3S2cbmXKk=',
    sequence: 2,
    signature: 'FPxqA5KBQmRfC3ARQYRvzPHGqeRB18jOLHJuSWFUC0PY5x/cDBHPkEZDs7bo4G3/xbaD25y//G7G4G4IKSPLBg==',
    timestamp: 1418804138170,
    type: 'holiday-carols:syllable'
  }]


  test('write', function (t) {
    // pull(
    //   pull.values(raw_messages),
    //   mInternalChain.write(settings, function (err) {
    //     t.error(err)

    //     pull(
    //       mChain.sequential(settings, settings.keys.public_key, 'holiday-carols:2014'),
    //       pull.collect(function (err, arr) {
    //         t.error(err)
    //         t.deepEqual(arr, encrypted_messages, '.write(db, indexes)')
    //         t.end()
    //       })
    //     )
    //   })
    // )

    async.series([
      function (callback) {
        pull(
          pull.values([raw_messages[0], raw_messages[1]]),
          mInternalChain.write(settings, callback)
        )
      },
      function (callback) {
        setTimeout(function () {
          mInternalChain.writeOne(settings, raw_messages[2], callback)
        }, 1000)
      }
    ], function (err) {
      if (err) { throw err }
      pull(
        mChain.sequential(settings, settings.keys.public_key, 'holiday-carols:2014'),
        pull.collect(function (err, arr) {
          t.error(err)
          t.deepEqual(arr, encrypted_messages, '.write(db, indexes)')
          t.end()
        })
      )
    })
  })

  test('sequential', function (t) {
    t.plan(2)

    pull(
      mInternalChain.sequential(settings, settings.keys.public_key, 'holiday-carols:2014'),
      pull.collect(function (err, arr) {
        if (err) { throw err }
        t.deepEqual(arr, [decrypted_messages[0], decrypted_messages[1], decrypted_messages[2]], 'Sequential without supplied sequence')
      })
    )

    pull(
      mInternalChain.sequential(settings, settings.keys.public_key, 'holiday-carols:2014', 1),
      pull.collect(function (err, arr) {
        if (err) { throw err }
        t.deepEqual(arr, [decrypted_messages[1], decrypted_messages[2]], 'Sequential with supplied sequence')
      })
    )
  })

  test('validate', function (t) {
    t.plan(2)

    pull(
      pull.values([encrypted_messages[1], encrypted_messages[2]]),
      mInternalChain.validate(settings, encrypted_messages[0]),
      pull.collect(function (err, arr) {
        if (err) { throw err }
        t.deepEqual(arr, [encrypted_messages[1], encrypted_messages[2]], 'Partial chain with supplied initial message.')
      })
    )

    pull(
      pull.values([encrypted_messages[0], encrypted_messages[1], encrypted_messages[2]]),
      mInternalChain.validate(settings),
      pull.collect(function (err, arr) {
        if (err) { throw err }
        t.deepEqual(arr, [encrypted_messages[0], encrypted_messages[1], encrypted_messages[2]], 'Partial chain without supplied initial message.')
      })
    )
  })
}