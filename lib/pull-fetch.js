
const { request: requestHttp } = require('http') 
const { request: requestHttps } = require('https')
const { source } = require('stream-to-pull-stream')
const { parse } = require('url')

function fetch (options) {
  if (typeof options === 'string') options = parse(options)
  const protocol = options.protocol
  const request = protocol === 'https:' ? requestHttps : requestHttp
  
  const req = request(options) 

  return (read) => {
    return new Promise((resolve, reject) => {
      
      if (read) {
        (function next () {
          read(null, (end, chunk) => {
            if (end === true) return req.end(response)
            if (end) return reject(end)
            req.write(chunk, next)
          })
        })()
      } else {
        req.end(response)
      }

      function response () {
        const source = (end, cb) => {
          if (end) return cb(end)
          req.on('response', res => {
            res.on('data', chunk => cb(null, chunk))
            res.on('end', () => cb(true))
            res.on('error', err => cb(err))
          })
        }

        resolve(Object.assign({ source }, req))
      }

    })
  }
}

module.exports = fetch
