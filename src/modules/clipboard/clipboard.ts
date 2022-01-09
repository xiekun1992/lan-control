import http from 'http'
import { clipboard } from 'electron'
const clipboardAuto = require('@xiekun1992/node-addon-clipboard-auto')

interface ClipboardRequestParam {
  text: string
}

class Clipboard implements LAN.AppModule {
  prevContent: string = ''
  captureInited: boolean = false

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
      this.captureInited = false
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
      port: 2001,
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
    global.appState.httpServer.post('/text', (req, res) => {
      req.setEncoding('utf-8')
      const bodyObj: ClipboardRequestParam = req.body
      this.prevContent = bodyObj.text
      clipboard.writeText(bodyObj.text)
      res.status(200).end()
    })
    this._capture()
  }
}

module.exports = new Clipboard()