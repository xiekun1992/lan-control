import dgram from 'dgram'
import { screen } from 'electron'
const inputAuto = require('@xiekun1992/node-addon-keyboard-auto')()

class Replay {
  port: number = 8888
  address: string = '0.0.0.0'
  width: number = 0
  height: number = 0
  scaleFactor: number = 0
  server: dgram.Socket = dgram.createSocket('udp4')
  constructor() {
    this.server.on('message', (message: string, rinfo: any) => {
      const msg = JSON.parse(message)
      // console.log(msg)
      if (global.appState.state.remote) {
        switch(msg.type) {
          case 'mousemove': 
            // console.log(msg.x, msg.y, width, height, scaleFactor)
            inputAuto.mousemove(
              msg.x * this.width / global.appState.state.remote.mapArea.width * this.scaleFactor,
              msg.y * this.height / global.appState.state.remote.mapArea.height * this.scaleFactor
            )
            break
          case 'mousedown': 
            inputAuto.mousedown(msg.button)
            break
          case 'mouseup': 
            inputAuto.mouseup(msg.button)
            break
          case 'mousewheel': 
            if (global.appState.platform.linux) {
              inputAuto.mousewheel(msg.direction / -Math.abs(msg.direction))
            } else {
              inputAuto.mousewheel(msg.direction)
            }
            break
          case 'mousewheel': 
            if (global.appState.platform.linux) {
              inputAuto.mousewheel(msg.direction / -Math.abs(msg.direction))
            } else {
              inputAuto.mousewheel(msg.direction)
            }
            break
          case 'keydown': 
            inputAuto.keydown(msg.char)
            break
          case 'keyup': 
            inputAuto.keyup(msg.char)
            break
        }
      }
    })
  }
  destroy() {
    if (this.server) {
      inputAuto.release()
      this.server.close(() => {})
    }
  }
  init() {
    ({ bounds: { width: this.width, height: this.height }, scaleFactor: this.scaleFactor } = screen.getPrimaryDisplay())
    return new Promise((resolve: Function, reject) => {
      this.server.bind(this.port, this.address, () => {
        resolve()
        console.log(`replay UDP server listening ${this.address}:${this.port}`)
      })
    })
  }
}

export default new Replay()