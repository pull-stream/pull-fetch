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
  var req = null

  if (options.body) {
    options.header = Object.assign({
      'content-type': options.body
    }, options.header)

    req = request(options)
    // Return through function for reading body
    return function (read) {
      return function (end, cb) {
        read(end, function (end, data) {
          if (end) return cb(end)
          req.write(data)
          req.on('error', cb)
          req.on('response', resp => cb(null, toPull.source(resp)))
          req.end()
        })
      }
    }
  } else {
    req = request(options)
    // Return a source function for no body
    var ended = false
    return function (end, cb) {
      if (end || ended) return cb(end || ended)
      req.on('error', err => {
        ended = err
        cb(err)
      })
      req.on('response', resp => {
        ended = true
        cb(null, toPull.source(resp))
      })
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
