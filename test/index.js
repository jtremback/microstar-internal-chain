'use strict';

var test = require('tape')
var mInternalChain = require('../')
var mChain = require('../../microstar-chain')
var mCrypto = require('../../microstar-crypto')
var level = require('level-test')()
var pull = require('pull-stream')

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

  var encrypted_messages = [{
    chain_id: 'holiday-carols:2014',
    content: 'pqlIp4ba4obeTe+jRdOHyk9K',
    previous: null,
    public_key: 'N3DyaY1o1EmjPLUkRQRu41/g/xKe/CR/cCmatA78+zY=7XuCMMWN3y/r6DeVk7YGY8j/0rWyKm3TNv3S2cbmXKk=',
    sequence: 0,
    signature: 'a1lBGmXRpYkzQPir+pfW3tlE6ysHruzu0b0T4Xk1ZwkQ1iol4Tm+0HFVaOvdGFZ3zCqJ07MhmhcZqurQXD+BDQ==',
    timestamp: 1418804138168,
    type: 'holiday-carols:syllable'
  }, {
    chain_id: 'holiday-carols:2014',
    content: 'DZqHwGaCCoPWkHiTmEK4OVpj',
    previous: '12U7+dILx7WWrYJ43YLMHx3loTK0ErFsaYco2DVade9kLVDbsiHhh/ybB9ZIuLnC0qZHvUrWh5ydZ0JBSFlKOw==',
    public_key: 'N3DyaY1o1EmjPLUkRQRu41/g/xKe/CR/cCmatA78+zY=7XuCMMWN3y/r6DeVk7YGY8j/0rWyKm3TNv3S2cbmXKk=',
    sequence: 1,
    signature: 'xDARDYqDQuUnxOS8GxFGuY4pI7egyDI/zysW+/pqBA1r/GpMJXPpHv0eYP6ssTR3KFQGeI7N7oEwPiEqdOeVBw==',
    timestamp: 1418804138169,
    type: 'holiday-carols:syllable'
  }, {
    chain_id: 'holiday-carols:2014',
    content: 'UdR3Wq6Cve8nA6JwTCDbAMJioA==',
    previous: 'C6b46Tlkjfxi9+/16ESki8rfIA4FQpQ20jeVbITDxpsBKtvnf6m32zlLrALlByr9q0N91npxTAAhs7+pcW6Qwg==',
    public_key: 'N3DyaY1o1EmjPLUkRQRu41/g/xKe/CR/cCmatA78+zY=7XuCMMWN3y/r6DeVk7YGY8j/0rWyKm3TNv3S2cbmXKk=',
    sequence: 2,
    signature: 'KnG1yiJc4jNkrOfx++G9OBx7UTP6pd+O4/qvwdZskmOR98Sso37pxunzgMkhbOzBDJ0HQhXKjFFBfiWrfczSBQ==',
    timestamp: 1418804138170,
    type: 'holiday-carols:syllable'
  }]

  var decrypted_messages = [{
    chain_id: 'holiday-carols:2014',
    content: 'Fa',
    previous: null,
    public_key: 'N3DyaY1o1EmjPLUkRQRu41/g/xKe/CR/cCmatA78+zY=7XuCMMWN3y/r6DeVk7YGY8j/0rWyKm3TNv3S2cbmXKk=',
    sequence: 0,
    signature: 'a1lBGmXRpYkzQPir+pfW3tlE6ysHruzu0b0T4Xk1ZwkQ1iol4Tm+0HFVaOvdGFZ3zCqJ07MhmhcZqurQXD+BDQ==',
    timestamp: 1418804138168,
    type: 'holiday-carols:syllable'
  }, {
    chain_id: 'holiday-carols:2014',
    content: 'La',
    previous: '12U7+dILx7WWrYJ43YLMHx3loTK0ErFsaYco2DVade9kLVDbsiHhh/ybB9ZIuLnC0qZHvUrWh5ydZ0JBSFlKOw==',
    public_key: 'N3DyaY1o1EmjPLUkRQRu41/g/xKe/CR/cCmatA78+zY=7XuCMMWN3y/r6DeVk7YGY8j/0rWyKm3TNv3S2cbmXKk=',
    sequence: 1,
    signature: 'xDARDYqDQuUnxOS8GxFGuY4pI7egyDI/zysW+/pqBA1r/GpMJXPpHv0eYP6ssTR3KFQGeI7N7oEwPiEqdOeVBw==',
    timestamp: 1418804138169,
    type: 'holiday-carols:syllable'
  }, {
    chain_id: 'holiday-carols:2014',
    content: 'Laa',
    previous: 'C6b46Tlkjfxi9+/16ESki8rfIA4FQpQ20jeVbITDxpsBKtvnf6m32zlLrALlByr9q0N91npxTAAhs7+pcW6Qwg==',
    public_key: 'N3DyaY1o1EmjPLUkRQRu41/g/xKe/CR/cCmatA78+zY=7XuCMMWN3y/r6DeVk7YGY8j/0rWyKm3TNv3S2cbmXKk=',
    sequence: 2,
    signature: 'KnG1yiJc4jNkrOfx++G9OBx7UTP6pd+O4/qvwdZskmOR98Sso37pxunzgMkhbOzBDJ0HQhXKjFFBfiWrfczSBQ==',
    timestamp: 1418804138170,
    type: 'holiday-carols:syllable'
  }]


  test('write', function (t) {
    pull(
      pull.values(raw_messages),
      mInternalChain.write(settings, function (err) {
        t.error(err)

        pull(
          mChain.sequential(settings, settings.keys.public_key, 'holiday-carols:2014'),
          pull.collect(function (err, arr) {
            t.error(err)
            t.deepEqual(arr, encrypted_messages, '.write(db, indexes)')
            t.end()
          })
        )
      })
    )
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