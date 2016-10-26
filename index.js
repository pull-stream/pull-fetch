var httpRequest = require('http').request
var httpsRequest = require('https').request
var toPull = require('stream-to-pull-stream')
var parseUrl = require('url').parse
var pull = require('pull-stream')

// Export
module.exports = fetch

// Attach methods
fetch.result = result
fetch.json = json

/**
 * Create an HTTP request through pull streams
 * The response itself is also a pull stream.
 * (See `fetch.result` and `fetch.json` also)
 *
 * ```js
 * pull(
 *   fetch('https://example.com'),
 *   pull.mapAsync((resp, done) => {
 *     // handle response stream in an async way
 *   }),
 *   pull.log()
 * )
 * ```
 */
function fetch (url, options) {
  options = Object.assign(parseUrl(url), options)
  var request = options.protocol === 'https:' ? httpsRequest : httpRequest
  var body = options.body
  var req = null

  return function (end, cb) {
    if (!req) {
      req = request(options, function (resp) {
        cb(null, toPull.source(resp))
      })

      // Write body
      if (body) {
        // Stringify if body is object
        if (typeof body === 'object' && !(body instanceof Buffer)) {
          body = JSON.stringify(body)
        }
        req.write(options.body)
      }

      req.on('error', cb)
      req.end()
    }
  }
}

/**
 * Resolves to the final contents automatically.
 * For simple requesting, no response streaming.
 *
 * ```js
 * pull(
 *   fetch.result('https://example.com'),
 *   pull.log()
 * )
 * ```
 */
function result (url, options) {
  return pull(
    fetch(url, options),
    pull.asyncMap((resp, done) => pull(resp, pull.collect(done))),
    pull.map(Buffer.concat)
  )
}

/**
 * A wrapper around `fetch.result` that parses as JSON.
 *
 * ```js
 * pull(
 *   fetch.json('https://api.github.com/...', options),
 *   stringify(),
 *   pull.log()
 * )
 * ```
 */
function json (url, option) {
  return pull(result(url, option), pull.map(JSON.parse))
}
