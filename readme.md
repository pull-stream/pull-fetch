
# pull-fetch

> A pull-stream HTTP client for Node.js

## Install 

```
npm i pull-fetch
```

## Usage

### `fetch(options)`

Make an HTTP request.  Options are the same as [`http.request`][1].  If it HTTPS it will switch the function.

Returns a [`pull-stream` sink][2] that reads data for the request.  If the request has not body (e.g. a GET request) then function returned can be called with nothing to proceed with the response.

Then the stream returns a promise that resolves into a response object.  It contains any property [`http.IncomingMessage`][3] has, plus `source` for streaming the response data as a [`pull-stream` source][4]

```js
const response = await fetch({
  host: 'api.example.com',
  path: '/foobar',
  method: 'POST'
})(
  values([ 'hello', 'world' ])
)

console.log(response.headers)

collect((err, data) => {
  data = Buffer.join(data).toString()
  consle.log(data)
})(response.source)
```

Or with no body:

```js
const response = await fetch('https://api.example.com/foobar')()

console.log(response.headers)

drain(x => process.stdout.write(x))(response.source)
```

Combining pull-streams and promises give an intuitive way to handle the requests.  There is little to no overhead with Node's APIs.

[1]: https://nodejs.org/api/http.html
[2]: https://github.com/pull-stream/pull-stream/blob/master/docs/spec.md#sink-streams
[3]: https://nodejs.org/api/http.html#http_class_http_incomingmessage
[4]: https://github.com/pull-stream/pull-stream/blob/master/docs/spec.md#pull-streams