'use strict';

var test = require('tape')
var mInternalChain = require('../')
var mCrypto = require('../../microstar-crypto')
var level = require('level-test')()
var pull = require('pull-stream')
var pl = require('pull-level')


var dbContents
var db1 = level('./test1.db', { valueEncoding: 'json' })

mCrypto.keys('h4dfDIR+i3JfCw1T2jKr/SS/PJttebGfMMGwBvhOzS4=', function (err, keys) {
  tests(keys)
})

function tests (keys) {
  var settings = {
    crypto: mCrypto,
    keys: keys,
    db: db1,
    indexes: mInternalChain.indexes
  }

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

  var messages = [{
    chain_id: 'holiday-carols:2014',
    content: 'Fa',
    previous: null,
    public_key: 'N3DyaY1o1EmjPLUkRQRu41/g/xKe/CR/cCmatA78+zY=7XuCMMWN3y/r6DeVk7YGY8j/0rWyKm3TNv3S2cbmXKk=',
    sequence: 0,
    signature: 'Cs8s0zZgqE/Tp+DCFDXuMYA6mNUtPTFGf//5rENPCx37g3L7BFhz0pBJ06GFK5E1i3C6o5H9BgX/Ltppf5EFBQ==',
    timestamp: 1418804138168,
    type: 'holiday-carols:syllable'
  }, {
    chain_id: 'holiday-carols:2014',
    content: 'La',
    previous: 'LWTQmsJ1E9fu+gSXDM03ckBXieL9/K8Jl2claIRcC6FFX5WYd1ojDsgo6KK1GafCinq2lAQlsIeVtU4RSpYL1w==',
    public_key: 'N3DyaY1o1EmjPLUkRQRu41/g/xKe/CR/cCmatA78+zY=7XuCMMWN3y/r6DeVk7YGY8j/0rWyKm3TNv3S2cbmXKk=',
    sequence: 1,
    signature: '/v1TqoggUpzuFx5sJ5jirlQsBOpGQBb1DJwP4ue1S5LzqKXIvZvlFe/WOLjyQTKXkqw9uQo2NH7eJPq4E7HbAQ==',
    timestamp: 1418804138169,
    type: 'holiday-carols:syllable'
  }, {
    chain_id: 'holiday-carols:2014',
    content: 'Laa',
    previous: '31+k7zPSRtH22OZxA4RXQRNQJ42gay0LNcGSUt19JhS/RElqw/O28+eRUQQdKJvSiQNjU1I5hyHf9OG7I1Np3g==',
    public_key: 'N3DyaY1o1EmjPLUkRQRu41/g/xKe/CR/cCmatA78+zY=7XuCMMWN3y/r6DeVk7YGY8j/0rWyKm3TNv3S2cbmXKk=',
    sequence: 2,
    signature: '+2r2xOcwEsP/h2inzDYx3OX2jk+03Zjnhp7pdagNcDFAE/fhdTX4Zmdx+Vi+divPumjIvHQYNSzy4qBI9c4dAQ==',
    timestamp: 1418804138170,
    type: 'holiday-carols:syllable'
  }]

  test('write', function (t) {

    pull(
      pull.values(raw_messages),
      mInternalChain.write(settings, function (err) {
        t.error(err)

        pull(
          mInternalChain.sequential(settings, settings.keys.public_key, 'holiday-carols:2014'),
          pull.collect(function (err, arr) {
            t.error(err)
            t.deepEqual(arr, messages, '.write(db, indexes)')
            t.end()
          })
        )
      })
    )

  })

  test('validate', function (t) {
    t.plan(2)


    pull(
      pull.values([messages[1], messages[2]]),
      mInternalChain.validate(settings, messages[0]),
      pull.collect(function (err, arr) {
        if (err) { throw err }
        t.deepEqual(arr, [messages[1], messages[2]], 'Partial chain with supplied initial message.')
      })
    )

    pull(
      pull.values([messages[0], messages[1], messages[2]]),
      mInternalChain.validate(settings),
      pull.collect(function (err, arr) {
        if (err) { throw err }
        t.deepEqual(arr, [messages[0], messages[1], messages[2]], 'Partial chain without supplied initial message.')
      })
    )
  })

  test('sequential', function (t) {
    t.plan(2)

    pull(
      mInternalChain.sequential(settings, settings.keys.public_key, 'holiday-carols:2014'),
      pull.collect(function (err, arr) {
        if (err) { throw err }
        t.deepEqual(arr, [messages[0], messages[1], messages[2]], 'Sequential without supplied sequence')
      })
    )

    pull(
      mInternalChain.sequential(settings, settings.keys.public_key, 'holiday-carols:2014', 1),
      pull.collect(function (err, arr) {
        if (err) { throw err }
        t.deepEqual(arr, [messages[1], messages[2]], 'Sequential with supplied sequence')
      })
    )
  })
}