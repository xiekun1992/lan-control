const inputAuto = require('node-addon-keyboard-auto')()
const dgram = require('dgram')
const { release } = require('process')
const server = dgram.createSocket('udp4')
const { screen } = require('electron')
// const clipboardNet = require('../clipboard/clipboard')

let initialized = false
let address = null
const port = 8888
let shouldForward = false
let startEdge, stopEdge, controlling = false, mouseSet = false
let position // left, right

// 需要以管理员权限运行不然任务管理器获得焦点后会阻塞消息循环
inputAuto.event.on('mousemove', event => {
  // console.log(event)
  checkInsideValidRange(event)

  send({
    type: 'mousemove',
    x: event.x,
    y: event.y
  })
})
inputAuto.event.on('mousedown', event => {
  send({
    type: 'mousedown',
    button: event.button
  })
})
inputAuto.event.on('mouseup', event => {
  send({
    type: 'mouseup',
    button: event.button
  })
})
inputAuto.event.on('mousewheel', event => {
  send({
    type: 'mousewheel',
    direction: event.direction
  })
})
// let ctrl = false
inputAuto.event.on('keydown', event => {
  // console.log(event)
  const char = inputAuto.keycodeToChar(event.vkCode)
  // listen clipboard
  // if (char === 'controlright' || char === 'controlleft') {
  //   ctrl = true
  // }
  // console.log(inputAuto.keycodeToChar(event.vkCode))
  send({
    type: 'keydown',
    char
  })
})
inputAuto.event.on('keyup', event => {
  const char = inputAuto.keycodeToChar(event.vkCode)
  // listen clipboard
  // if (!shouldForward && char === 'c' && ctrl) {
  //   clipboardNet.sync()
  // }
  // if (char === 'controlright' || char === 'controlleft') {
  //   ctrl = false
  // }
  send({
    type: 'keyup',
    char
  })
})

function checkInsideValidRange(event) {
  if (!position) {
    return
  }
  if (!controlling && event.x >= stopEdge && position === 'right') {
    controlling = true
    // console.log(event, controlling, stopEdge, position)
    require('../overlay/overlay').createWindow(function() {
      const timer1 = setTimeout(() => {
        const timer2 = setTimeout(() => {
          clearTimeout(timer2)
          shouldForward = true
          mouseSet = true
        }, 10)
        inputAuto.mousemove(startEdge + 2, event.y)// 鼠标位置设置有问题
        clearTimeout(timer1)
      }, 100)
    })
    return
  }
  if (controlling && mouseSet) {
    if (event.x >= 0 && event.x <= 1366 && event.y >= 0 && event.y <= 768) {
      shouldForward = true
    } else if (event.x > 1366) {
      shouldForward = true
      inputAuto.mousemove(1366, event.y)
    } else if (event.y > 768) {
      shouldForward = true
      inputAuto.mousemove(event.x, 768)
    } else if (event.x <= startEdge) {
      // inputAuto.release()
      controlling = false
      shouldForward = false
      require('../overlay/overlay').hide()
      inputAuto.mousemove(stopEdge - 2, event.y)
      mouseSet = false
    } else {
      // shouldForward = false
    }
  }
}
function send(msg) {
  if (shouldForward && address) {
    server.send(JSON.stringify(msg), port, address)
  }
}

module.exports = {
  setConnectionPeer(targetAddress, devicePosition) {
    address = targetAddress
    position = devicePosition
  },
  startCapture() {
    // sync clipboard content
    // clipboardNet.sync()
    if (!initialized) {
      initialized = true
      const { width } = screen.getPrimaryDisplay().workAreaSize
      startEdge = 0
      stopEdge = width
      inputAuto.init()
    }
  },
  closeCapture() {
    if (initialized) {
      initialized = false
      inputAuto.release()
    }
  }
}