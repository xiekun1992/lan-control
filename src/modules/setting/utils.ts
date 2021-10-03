import http from 'http'
import { Device } from '../../core/states/Device'

function request(option: http.RequestOptions) {
  return Promise.race([
    new Promise((resolve, rejects) => {
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
    }),
    new Promise((resolve, rejects) => {
      setTimeout(() => {
        rejects(new Error('request timeout'))
      }, 3000)
    })
  ])
}

function connectDevice(ip: string, position: string, thisDevice: Device) {
  return request({
    method: 'POST',
    port: 2001,
    hostname: ip,
    path: `/connection?position=${encodeURIComponent(position)}&device=${encodeURIComponent(JSON.stringify(thisDevice))}`
  })
}
function disconnectDevice(ip: string, position: string, thisDevice: Device) {
  return request({
    method: 'DELETE',
    port: 2001,
    hostname: ip,
    path: `/connection?position=${encodeURIComponent(position)}&device=${encodeURIComponent(JSON.stringify(thisDevice))}`
  })
}

module.exports = {
  connectDevice,
  disconnectDevice,
}