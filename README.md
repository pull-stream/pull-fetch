# pull-fetch [![NPM version](https://badge.fury.io/js/pull-fetch.svg)](https://npmjs.org/package/pull-fetch) [![Build Status](https://travis-ci.org/jamen/pull-fetch.svg?branch=master)](https://travis-ci.org/jamen/pull-fetch)

> Fetch function for pull stream

```js
pull(
  pull.values([ 'Hello', 'World' ])
  fetch.result('http://example.com/', { method: 'POST' }),
  pull.map(result => result.toString()),
  pull.log()
)
```

A fetch module for pull streams.  It is inspired from [whatwg `fetch`](https://fetch.spec.whatwg.org/#dom-global-fetch), but not closely related.

## Installation

```sh
$ npm install --save pull-fetch
```

## Usage

### `fetch(url, [options])`

HTTP request the `url` and receive a response pull stream.

When you set `options.body = true`, it turns into a through stream and tries to read data for the request.  Otherwise it is just readable.

#### Options

All options are passed into [`http.request`](https://nodejs.org/api/http.html#http_http_request_options_callback)/[`https.request`](https://nodejs.org/api/https.html#https_https_request_options_callback), in addition to:

 - `body` (`String`): Enables streaming data in as a request body.  Value is the `Content-Type` of the data.

#### Example

```js
pull(
  pull.values([ { foo: 'bar' } ]),
  // Stringify objects for request:
  stringify(),
  // Make a POST request with body:
  fetch('https://example.com', { method: 'POST', body: 'application/json' }),
  // Handle response stream in an async way
  pull.mapAsync((resp, done) => {
    return pull(resp, pull.collect(done))
  }),
  pull.log()
)
```

### `fetch.result(url, [options])`

A wrapper around `fetch` that resolves the stream into a buffer.  Parameters are the same.

It is used as more simple version of `fetch`, if you just want the end value.

#### Example

```js
pull(
  fetch.result('https://example.com'),
  pull.log()
)
```

### `fetch.json(url, [options])`

A wrapper around `fetch.result` that parses as JSON.  Parameters are the same.

#### Example

```js
pull(
  fetch.json('https://api.github.com/users/jamen', options),
  stringify(),
  pull.log()
)
```

## License

MIT © [Jamen Marz](https://github.com/jamen)
