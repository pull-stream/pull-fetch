
const test = require('tape')
const fetch = require('./lib/pull-fetch.js')
const { pull, collect, values, map, onEnd } = require('pull-stream') 
const { createServer } = require('http')

const P = process.env.TEST_PORT || 8000

test('GET request', t => {
  t.plan(4)

  const server = createServer((request, response) => {
    t.is(request.method, 'GET', 'method')
    t.is(request.url, '/foobar', 'url')
    t.true(request.headers['x-foobar'], 'request header')

    response.setHeader('X-Bazqux', 'Hi')
    response.write('Ping')
    setTimeout(() => response.end('ping'), 100)
  })
  
  server.listen(P, async () => {
    const response = await fetch({
      host: 'localhost',
      method: 'GET',
      path: '/foobar',
      port: P,
      headers: {
        'X-Foobar': 'Hello world'
      }
    })()

    pull(
      response,
      map(x => x + ''), // coerce to strings
      collect((err, data) => {
        if (err) t.error(err)
        else t.same(data, ['Ping', 'ping'], 'response data')
        server.close()
      })
    )
  })
})

test('POST request', t => {
  t.plan(5)

  const server = createServer((request, response) => {
    t.is(request.method, 'POST', 'method')
    t.is(request.url, '/foobar', 'url')
    t.true(request.headers['x-foobar'], 'header')
    
    const data = []

    request.on('data', chunk => {
      data.push(chunk + '')
    })

    request.on('end', () => {
      t.same(data, ['Ping', 'ping'], 'request data')
      
      response.write('Pong')
      setTimeout(() => response.end('pong'), 100)
    })
  })
  
  server.listen(P, async () => {
    const response = await fetch({
      host: 'localhost',
      method: 'POST',
      path: '/foobar',
      port: P,
      headers: {
        'X-Foobar': 'Hello world'
      }
    })(
      values(['Ping', 'ping'])
    )

    pull(
      response,
      map(x => x + ''), // coerce to strings
      collect((err, data) => {
        if (err) t.error(err)
        else t.same(data, ['Pong', 'pong'], 'response data')
        server.close()
      })
    )
  })
})

test('shorthand', t => {
  t.plan(3)

  const server = createServer((request, response) => {
    t.is(request.method, 'GET', 'method')
    t.is(request.url, '/foobar', 'url')
    response.write('Ping')
    setTimeout(() => response.end('ping'), 100)
  })

  server.listen(P, async () => {
    const response = await fetch(`http://localhost:${P}/foobar`)()

    onEnd(err => {
      t.error(err)
      server.close()
    })(response.source)
  })
})
