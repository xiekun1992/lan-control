import http from 'http'
import { clipboard } from 'electron'
const clipboardAuto = require('@xiekun1992/node-addon-clipboard-auto')

class Clipboard implements LAN.AppModule {
  prevContent: string = ''
  captureInited: boolean = false
  server: LAN.Nullable<http.Server> = null
  address: string = '0.0.0.0'
  port: number = 2000

  _capture() {
    if (!this.captureInited) {
      this.captureInited = true
      console.log('clipboard capture')
      clipboardAuto.capture(() => {
        console.log('clipboard capture callback')
        this.sync()
      })
    }
  }
  destroy() {
    if (this.captureInited) {
      clipboardAuto.release()
      if (this.server) {
        this.server.close(() => {
          this.server = null
          this.captureInited = false
        })
      }
    }
  }
  sync() {
    const text = clipboard.readText()
    // console.log('clipboard sync', text)
    if (text && this.prevContent !== text) {
      this._send(text)
    }
  }
  _send(content: Object) {
    if (!global.appState.state.remote) {
      return
    }
    const req = http.request({
      hostname: global.appState.state.remote.if,
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
  }
  init() {
    if (!this.server) {
      this.server = http.createServer((req, res) => {
        req.setEncoding('utf-8')
        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', () => {
          const bodyObj: LAN.ClipboardRequestParam = JSON.parse(body)
          switch (req.url) {
            case '/text': 
              this.prevContent = bodyObj.text
              clipboard.writeText(bodyObj.text)
              break
          }
          res.statusCode = 200
          res.end()
        })
        req.on('error', console.log)
        // console.log(req.url, req.body)
      })
      this.server.listen(this.port, this.address, () => {
        console.log(`clipboard HTTP server listening ${this.address}:${this.port}`)
        this._capture()
      })
    }
  }
}

module.exports = new Clipboard()