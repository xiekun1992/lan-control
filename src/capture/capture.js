const inputAuto = require('@xiekun1992/node-addon-keyboard-auto')()
const dgram = require('dgram')
const server = dgram.createSocket('udp4')
const { screen } = require('electron')
// const clipboardNet = require('../clipboard/clipboard')

let initialized = false
let address = null
const port = 8888
let shouldForward = false
let controlling = false, mouseSet = false
let position // left, right
let leftmost = 0, rightmost = 0
// linux ubuntu with 1920x1080 resolution, the mouse movement range is 1919x1079
const screenWidthGap = global.linux? 1: 0
const screenHeightGap = global.linux? 1: 0
// use a small area to capture mouse movement, 800x600 is the smallest screen resolution
// the least screen size recommended is 1024x768, considering windows taskbar height is 40
let mapArea = {
  width: 800,
  height: 600,
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  init() {
    const primaryDisplay = screen.getPrimaryDisplay()
    mapArea.left = Math.floor((primaryDisplay.bounds.width - mapArea.width) / 2)
    mapArea.right = mapArea.left + mapArea.width
    mapArea.top = Math.floor((primaryDisplay.bounds.height - mapArea.height) / 2)
    mapArea.bottom = mapArea.top + mapArea.height
  }
}

// 需要以管理员权限运行不然任务管理器获得焦点后会阻塞消息循环
inputAuto.event.on('mousemove', event => {
  // console.log(event)
  checkInsideValidRange(event)

  send({
    type: 'mousemove',
    x: event.x - mapArea.left,
    y: event.y - mapArea.top
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
  send({
    type: 'keydown',
    char
  })
})
inputAuto.event.on('keyup', event => {
  const char = inputAuto.keycodeToChar(event.vkCode)
  send({
    type: 'keyup',
    char
  })
})

function checkInsideValidRange(event) {
  if (!position) {
    return
  }
  if (!controlling && ((event.x >= rightmost && position === 'right') || (event.x <= leftmost && position === 'left'))) {
    // console.log(mapArea)
    controlling = true
    
    require('../overlay/overlay').createWindow(function() {
      const timer1 = setTimeout(() => {
        const timer2 = setTimeout(() => {
          clearTimeout(timer2)
          shouldForward = true
          mouseSet = true
        }, 10)
        if (position === 'left') {
          inputAuto.mousemove(mapArea.right - 2, event.y)
        } else if (position === 'right') {
          inputAuto.mousemove(mapArea.left + 2, event.y)// 鼠标位置设置有问题
        }
        clearTimeout(timer1)
      }, 100)
    })
  } else if (controlling && mouseSet) {
    if (event.x >= mapArea.left && event.x <= mapArea.right && event.y >= mapArea.top && event.y <= mapArea.bottom) {
      shouldForward = true
    } else if (event.x > mapArea.right) {
      if (position === 'left') {
        controlling = false
        shouldForward = false
        require('../overlay/overlay').hide()
        inputAuto.mousemove(leftmost + 2, event.y)
        mouseSet = false
      } else {
        shouldForward = true
        inputAuto.mousemove(mapArea.right, event.y)
      }
    } else if (event.x < mapArea.left) {
      if (position === 'right') {
        controlling = false
        shouldForward = false
        require('../overlay/overlay').hide()
        inputAuto.mousemove(rightmost - 2, event.y)
        mouseSet = false
      } else {
        shouldForward = true
        inputAuto.mousemove(mapArea.left, event.y)
      }
    } else if (event.y > mapArea.bottom) {
      shouldForward = true
      inputAuto.mousemove(event.x, mapArea.bottom)
    } else if (event.y < mapArea.top) {
      shouldForward = true
      inputAuto.mousemove(event.x, mapArea.top)
    } else {
      // shouldForward = false
    }
  }
}
function send(msg) {
  // console.log(msg)
  if (shouldForward && address) {
    server.send(JSON.stringify(msg), port, address)
  }
}

module.exports = {
  /**
   * set remote ip and relative position
   * @param {string} targetAddress ip address, eg: 192.168.1.1
   * @param {string} devicePosition relative position, eg: left or right
   */
  setConnectionPeer(targetAddress, devicePosition) {
    address = targetAddress
    position = devicePosition
  },
  startCapture() {
    mapArea.init()
    // sync clipboard content
    // clipboardNet.sync()
    if (!initialized) {
      initialized = true
      
      const edge = require('./utils').calcEdge()
      leftmost = edge.leftmost
      rightmost = edge.rightmost - screenWidthGap
      
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