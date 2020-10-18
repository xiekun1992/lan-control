const http = require('http')
const { clipboard } = require('electron')
const clipboardAuto = require('@xiekun1992/node-addon-clipboard-auto')

let skip = false

module.exports = {
  capture() {
    clipboardAuto.capture(() => {
      if (skip) {
        return
      }
      this.sync()
    })
  },
  sync() {
    const text = clipboard.readText()
    if (text) {
      this.send(text)
    }
  },
  send(content) {
    const req = http.request({
      hostname: global.device.remote.if,
      port: 2000,
      path: '/text',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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
            skip = true
            clipboard.writeText(body.text)
            skip = false
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