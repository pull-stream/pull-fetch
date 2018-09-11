
const { request: requestHttp } = require('http') 
const { request: requestHttps } = require('https')
const { parse } = require('url')

function fetch (options) {
  if (typeof options === 'string') options = parse(options)
  const protocol = options.protocol
  const request = protocol === 'https:' ? requestHttps : requestHttp

  const req = request(options) 
  let sinkCb = null
  let ended = false
  const buffer = []

  req.on('response', res => {
    res.on('data', chunk => {
      if(sinkCb){                 // if we are waiting, provide the chunk immediately
        sinkCb(null, chunk)
      } else {                    // otherwise store it in buffer ('data' event can be emitted faster then sink reads from source)
        buffer.push(chunk)
      }
    })
    res.on('end', () => {
      if(ended) return
      if(sinkCb){
        sinkCb(ended = true)
      }
    })
    res.on('error', err => {
      if(ended) return
      if(sinkCb){
        sinkCb(ended = err)
      }
    })

  })

  return (read) => {
    return new Promise((resolve, reject) => {
      req.on('error', err => {
        reject(err)
      })
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
          sinkCb = null  //for storing reference to sink callback
          if (end) {
            req.abort()  //will abort receiving chunks and will emit 'end' event
            sinkCb = cb
          } else if(buffer.length>0){
            cb(null, buffer.shift())
          } else {
            sinkCb = cb  //there is nothing in the buffer, so no callback yet, we should wait for next chunk, or for 'end' event
          }
        }

        resolve(Object.assign({ source }, req))
      }

    })
  }
}

module.exports = fetch  
