import dgram from 'dgram'
import { screen } from 'electron'
const inputAuto = require('@xiekun1992/node-addon-keyboard-auto')()

type KeyAction = {
  type: string;
  char: string;
}
type MouseAction = {
  type: string;
  button: number;
  direction: number;
  x: number;
  y: number;
}

class Replay {
  port: number = 8888
  address: string = '0.0.0.0'
  width: number = 0
  height: number = 0
  scaleFactor: number = 0
  server: dgram.Socket = dgram.createSocket('udp4')
  downKeyActions: Map<string, KeyAction> = new Map() // 存储按下的键或者鼠标，断连后自动释放操作
  downMouseActions: Map<number, MouseAction> = new Map() // 存储按下的键或者鼠标，断连后自动释放操作

  constructor() {
    this.server.on('message', (message: string, rinfo: any) => {
      const msg = JSON.parse(message)
      // console.log(msg)
      if (global.appState.state.remote && !global.appState.state.isController) {
        switch(msg.type) {
          case 'mousemove': 
            console.log('replay mousemove', msg.x, msg.y)
            inputAuto.mousemove(
              msg.x * this.width / global.appState.state.remote.mapArea.width * this.scaleFactor,
              msg.y * this.height / global.appState.state.remote.mapArea.height * this.scaleFactor
            )
            break
          case 'mousedown': 
            this.downMouseActions.set(msg.button, msg)
            inputAuto.mousedown(msg.button)
            break
          case 'mouseup': 
            this.downMouseActions.delete(msg.button)
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
            this.downKeyActions.set(msg.char, msg)
            inputAuto.keydown(msg.char)
            break
          case 'keyup': 
            this.downKeyActions.delete(msg.char)
            inputAuto.keyup(msg.char)
            break
        }
      }
    })
  }
  relaseActions() {
    for (const action of this.downKeyActions.values()) {
      inputAuto.keyup(action.char)
    }
    for (const action of this.downMouseActions.values()) {
      inputAuto.mouseup(action.button)
    }
  }
  destroy() {
    this.relaseActions()
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