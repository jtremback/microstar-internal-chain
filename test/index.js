'use strict';

var test = require('tape')
var mInternalChain = require('../')
var mChain = require('../../microstar-chain')
var mCrypto = require('../../microstar-crypto')

var level = require('level-test')()
// var level = require('level')
// var rimraf = require('rimraf')
// rimraf.sync('./test.db')

var pull = require('pull-stream')
var async = require('async')
var pl = require('pull-level')

var db = level('./test.db', { valueEncoding: 'json' })

mCrypto.keys('h4dfDIR+i3JfCw1T2jKr/SS/PJttebGfMMGwBvhOzS4=', function (err, keys) {
  tests(keys)
})

var trace = require('get-trace')

function tracify (t) {
  function attach (func) {
    return function () {
      var args = []
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i])
      }
      args.push(trace(2))

      return func.apply(null, args)
    }
  }
  return {
    equal: attach(t.equal),
    deepEqual: attach(t.deepEqual),
    error: attach(t.error),
    end: t.end,
    plan: t.plan
  }
}

function tests (keys) {
  var settings = {
    crypto: mCrypto,
    keys: keys,
    db: db,
    index_defs: mInternalChain.index_defs
  }

  settings.index_defs.push(['public_key', 'chain_id', 'type', 'content', 'sequence'])

  var raw_messages = [{
    content: { a: 'Fa' },
    timestamp: 1418804138168,
    type: 'holiday-carols:syllable',
    chain_id: 'holiday-carols:2014'
  }, {
    content: { a: 'La' },
    timestamp: 1418804138169,
    type: 'holiday-carols:syllable',
    chain_id: 'holiday-carols:2014'
  }, {
    content: { a: 'Laa' },
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
    content: {
      a: 'Fa'
    },
    previous: null,
    public_key: 'N3DyaY1o1EmjPLUkRQRu41/g/xKe/CR/cCmatA78+zY=7XuCMMWN3y/r6DeVk7YGY8j/0rWyKm3TNv3S2cbmXKk=',
    sequence: 0,
    signature: '4t+EbLz3Rzit3m3hHMGfVGiNsfExEx0+fwTsUU2J5n6rxBgTBXf9QHAt6NieSBtTscRXM5vpn40yOJfG64lbCA==',
    timestamp: 1418804138168,
    type: 'holiday-carols:syllable'
  }, {
    chain_id: 'holiday-carols:2014',
    content: {
      a: 'La'
    },
    previous: 'c+I3xyPsmezInk3BNVA6r/U700Nqa79LGeAWKCM17sklMP7EHGCMxo2s0mqB882jc5ooAbLlduGKiskGZ7PoXQ==',
    public_key: 'N3DyaY1o1EmjPLUkRQRu41/g/xKe/CR/cCmatA78+zY=7XuCMMWN3y/r6DeVk7YGY8j/0rWyKm3TNv3S2cbmXKk=',
    sequence: 1,
    signature: 'AQ9qH0aIlLcfwYdLGnStKe/aPgJBe8NydopnTzgg+769D1gVAuQZh1sBR1hHgT+jdlQR4HviOiMv+ml05FgiBw==',
    timestamp: 1418804138169,
    type: 'holiday-carols:syllable'
  }, {
    chain_id: 'holiday-carols:2014',
    content: {
      a: 'Laa'
    },
    previous: 'BsePBkEiboTsqOFBHs7xUUP8ZRWitj16b72aZLU65tR00T10hfkcG+lEH5VObLEaTblfsmyGioH1gcbG5gd0+Q==',
    public_key: 'N3DyaY1o1EmjPLUkRQRu41/g/xKe/CR/cCmatA78+zY=7XuCMMWN3y/r6DeVk7YGY8j/0rWyKm3TNv3S2cbmXKk=',
    sequence: 2,
    signature: 'z8fxE9v63X0ohY2HlpVSbM6JYumO2YToFoe84X+5K2Fw2POU13cH84MGvSiZwRh+9pcKdrvW3XbliCGxfrZXBg==',
    timestamp: 1418804138170,
    type: 'holiday-carols:syllable'
  }]



  function sha1hex (input) {
    return require('crypto').createHash('sha1').update(JSON.stringify(input)).digest('hex')
  }

  test('write', function (t) {
    t = tracify(t)
    t.plan(1)

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
        pl.read(db),
        pull.collect(function (err, arr) {
          if (err) { throw err }
          t.deepEqual(sha1hex(arr), '20c38295e6ed83380ca61a97539908b1bf5b6070')
          t.end()
        })
      )
    })
  })

  test('sequential', function (t) {
    t = tracify(t)
    t.plan(2)

    pull(
      mInternalChain.sequential(settings, settings.keys.public_key, 'holiday-carols:2014'),
      pull.collect(function (err, arr) {
        if (err) { throw err }
        t.deepEqual(arr, [decrypted_messages[0], decrypted_messages[1], decrypted_messages[2]])
      })
    )

    pull(
      mInternalChain.sequential(settings, settings.keys.public_key, 'holiday-carols:2014', 1),
      pull.collect(function (err, arr) {
        if (err) { throw err }
        // Sequential with supplied sequence
        t.deepEqual(arr, [decrypted_messages[1], decrypted_messages[2]])
      })
    )
  })
}