const http = require('http')

function request(option) {
  return new Promise((resolve, rejects) => {
    console.log(option)
    const req = http.request(option, res => {
      res.setEncoding('utf8')
      let body = Buffer.alloc(0)
      res.on('data', chunk => {
        body = Buffer.concat([body, chunk])
      })
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        })
      })
    })
    req.on('error', rejects)
    req.end()
  })
}

function connectDevice(ip, position, thisDevice) {
  return request({
    method: 'POST',
    port: 2001,
    hostname: ip,
    path: `/connection?position=${encodeURIComponent(position)}&device=${encodeURIComponent(JSON.stringify(thisDevice))}`
  })
}
function disconnectDevice(ip, position, thisDevice) {
  return request({
    method: 'DELETE',
    port: 2001,
    hostname: ip,
    path: `/connection?position=${encodeURIComponent(position)}&device=${encodeURIComponent(JSON.stringify(thisDevice))}`
  })
}

module.exports = {
  connectDevice,
  disconnectDevice
}