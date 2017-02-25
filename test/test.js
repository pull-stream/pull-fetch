var test = require('tape')
var nock = require('nock')
var pull = require('pull-stream');
var fetch = require('../');

test('fetch contents regularly', function (t) {

  t.test('fetch', function(t) {

    t.test('result should be returned', function(t) {

      var body;
      nock('https://example.com')
        .post('/')
        .reply(function(uri, requestBody) {
          body = requestBody;
          return [201, 'ok'];
        });

      pull(
        pull.values([ { foo: 'bar' } ]),
        pull.map(JSON.stringify),
        fetch('https://example.com/', { method: 'POST', body: 'application/json' }),
        pull.asyncMap((resp, done) => pull(resp, pull.collect(done))),
        pull.map(Buffer.concat),
        pull.drain((data) => {
          t.equal(body, '{"foo":"bar"}', 'POST body was correctly sent');
          t.deepEqual(data, new Buffer('ok'), 'result is buffer containing response');
        }, t.end));
    });

    nock.cleanAll();
    t.end();
  });

  t.test('result', function(t) {

    t.test('result should be returned', function(t) {

      nock('https://example.com')
        .get('/')
        .reply(200, '{"msg": "success"}')

      pull(
        fetch.result('https://example.com'),
        pull.drain((data) => {
          t.deepEqual(data, new Buffer('{"msg": "success"}'), 'result is buffer containing response');
        }, t.end));
    });

    nock.cleanAll();
    t.end();
  });

  t.test('json', function(t) {

    t.test('result should be parsed and returned', function(t) {

      nock('https://example.com')
        .get('/')
        .reply(200, '{"msg": "success"}')

      pull(
        fetch.json('https://example.com'),
        pull.drain((data) => {
          t.deepEqual(data, {'msg': 'success'}, 'returned json is parsed');
        }, t.end));
    });

    nock.cleanAll()
    t.end();
  });

  t.end();
});
