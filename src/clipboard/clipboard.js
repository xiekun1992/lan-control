const http = require('http')
const { clipboard } = require('electron')
const clipboardAuto = require('@xiekun1992/node-addon-clipboard-auto')

let prevContent = ''
let captureInited = false

module.exports = {
  capture() {
    if (!captureInited) {
      captureInited = true
    console.log('clipboard capture')
    clipboardAuto.capture(() => {
      console.log('clipboard capture callback')
      this.sync()
    })
    }
  },
  release() {
    if (captureInited) {
      captureInited = false
    clipboardAuto.release()
    }
  },
  sync() {
    const text = clipboard.readText()
    // console.log('clipboard sync', text)
    if (text && prevContent !== text) {
      this.send(text)
    }
  },
  send(content) {
    // console.log('clipboard send', global.device.remote)
    if (!global.device.remote) {
      return
    }
    const req = http.request({
      hostname: global.device.remote.if,
      port: 2000,
      path: '/text',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'proxy-connection': 'keep-alive',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36'
      }
    }, (res) => {
      // console.log(`STATUS: ${res.statusCode}`)
    })
    
    req.on('error', (e) => {
      console.error(`problem with request: ${e.message}`)
    })
    req.write(JSON.stringify({
      text: content
    }))
    req.end()
  },
  start() {
    http.createServer((req, res) => {
      req.setEncoding('utf-8')
      let body = ''
      req.on('data', (chunk) => {
        body += chunk
      })
      req.on('end', () => {
        body = JSON.parse(body)
        switch (req.url) {
          case '/text': 
            prevContent = body.text
            clipboard.writeText(body.text)
            break
        }
        res.statusCode = 200
        res.end()
      })
      req.on('error', console.log)
      // console.log(req.url, req.body)
    }).listen(2000)
  }
}