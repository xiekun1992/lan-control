const dgram = require('dgram')
const server = dgram.createSocket('udp4')
const inputAuto = require('@xiekun1992/node-addon-keyboard-auto')()
const { screen } = require('electron')

const port = 8888
const address = '0.0.0.0'

let width, height

server.on('message', (msg, rinfo) => {
  msg = JSON.parse(msg)
  // console.log(msg)
  if (global.device.remote) {
    switch(msg.type) {
      case 'mousemove': 
        inputAuto.mousemove(
          msg.x * width / global.device.remote.mapArea.width,
          msg.y * height / global.device.remote.mapArea.height
        )
        break
      case 'mousedown': 
        inputAuto.mousedown(msg.button)
        break
      case 'mouseup': 
        inputAuto.mouseup(msg.button)
        break
      case 'mousewheel': 
        if (global.linux) {
          inputAuto.mousewheel(msg.direction / -Math.abs(msg.direction))
        } else {
          inputAuto.mousewheel(msg.direction)
        }
        break
      case 'mousewheel': 
        if (global.linux) {
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


module.exports = {
  start() {
    ({ width, height} = screen.getPrimaryDisplay().bounds)
    return new Promise((resolve, reject) => {
      server.bind(port, address, () => {
        resolve()
        console.log('server started!!')
      })
    })
  }
}