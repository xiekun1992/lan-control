const dgram = require('dgram')
const server = dgram.createSocket('udp4')
const inputAuto = require('@xiekun1992/node-addon-keyboard-auto')()
const { screen } = require('electron')

const port = 8888
const address = '0.0.0.0'

let width, height, scaleFactor

server.on('message', (msg, rinfo) => {
  msg = JSON.parse(msg)
  // console.log(msg)
  if (global.appState.state.remote) {
    switch(msg.type) {
      case 'mousemove': 
        // console.log(msg.x, msg.y, width, height, scaleFactor)
        inputAuto.mousemove(
          msg.x * width / global.appState.state.remote.mapArea.width * scaleFactor,
          msg.y * height / global.appState.state.remote.mapArea.height * scaleFactor
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
function destroy() {
  if (server) {
    inputAuto.release()
    server.close(() => {})
  }
}

module.exports = {
  destroy,
  init() {
    ({ bounds: { width, height }, scaleFactor } = screen.getPrimaryDisplay())
    return new Promise((resolve, reject) => {
      server.bind(port, address, () => {
        resolve()
        console.log(`replay UDP server listening ${address}:${port}`)
      })
    })
  }
}