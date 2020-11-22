const {
  BrowserWindow, app, ipcMain
} = require('electron')
const path = require('path')
const http = require('http')
const discover = require('../discover/discover')
let capture = require('../capture/capture')
const clipboardNet = require('../clipboard/clipboard')
const store = require('../store/store')

let window, server
const port = 2001

function createWindow() {
  if (window) {
    return window
  }
  window = new BrowserWindow({
    show: false,
    width: 940,
    height: 600,
    resizable: false,
    webPreferences: {
      nodeIntegration: true
    }
  })
  window.loadFile(path.resolve(__dirname, 'index.html'))
  // keep window alive to prevent default quit main process
  window.on('close', (event) => {
    event.preventDefault()
    window.hide()
  })
  window.webContents.on('did-finish-load', () => {
    window.webContents.send('devices', {
      devices: global.device.remotes,
      thisDevice: global.device.local,
      remote: global.device.remote,
      position: global.device.position
    })
    discover.event.on('discover', ({ devices, newDevice, thisDevice }) => {
      window.webContents.send('devices', {
        devices,
        thisDevice,
        remote: global.device.remote,
        position: global.device.position
      })
    })
    window.webContents.send('devices.local', { device: global.device.local })
    discover.event.on('discover.local', ({ device }) => {
      window.webContents.send('devices.local', { device })
    })
  })
  ipcMain.on('device.connect', (event, { remoteDevice, position }) => {
    if (remoteDevice) {
      global.device.remote = remoteDevice
      global.device.position = position
      store.set({
        position,
        remote: global.device.remote
      })
      
      capture.setConnectionPeer(global.device.remote.if, position)
      capture.startCapture()

      clipboardNet.capture()
    }
  })
  ipcMain.on('device.disconnect', (event, { remoteIP, position }) => {
    const remoteDevice = global.device.remotes.find(item => item.if === remoteIP)
    if (remoteDevice) {
      global.device.remote = null
      store.clear()
      
      capture.setConnectionPeer(null, null)
      // capture.closeCapture()

      clipboardNet.release()
    }
  })
  // window.webContents.openDevTools()
}
function show() {
  if (!window) {
    createWindow()
  }
  window.show()
}
function startServer() {
  if (!server) {
    server = http.createServer((req, res) => {
      const urlObj = new URL('http://localhost' + req.url)
      if (urlObj.pathname === '/connection') {
        const position = urlObj.searchParams.get('position')
        const device = JSON.parse(urlObj.searchParams.get('device'))
        const ip = req.socket.remoteAddress
        const remoteDeviceFound = global.device.remotes.find(dev => dev.if === ip) || device
        // add to remotes
        discover.addToRemotesDevice(remoteDeviceFound)
        console.log(remoteDeviceFound)
        
        switch(req.method.toLowerCase()) {
          case 'post': 
            if (!global.device.remote) {
              global.device.remote = remoteDeviceFound
              clipboardNet.capture()
              res.statusCode = 201
            } else {
              res.statusCode = 403
            }
            res.end()
            break
          case 'delete': 
            if (global.device.remote === remoteDeviceFound) {
              global.device.remote = null
              clipboardNet.release()
            }
            res.statusCode = 200
            res.end()
            break
          default: res.end('settings http server respond')
        }
      } else {
        res.statusCode = 404
        res.end()
      }
    })
    server.listen(port, '0.0.0.0', () => {
      console.log('setting server started')
    })
  }
}

module.exports = {
  show,
  startServer
}