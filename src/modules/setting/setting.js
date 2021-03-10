const {
  BrowserWindow, app, ipcMain
} = require('electron')
const path = require('path')
const http = require('http')
const { connectDevice } = require('./utils')

let window, server, keepRemoteTimer
const address = '0.0.0.0', port = 2001

function _createWindow() {
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

  window.on('closed', (event) => {
    window = null
  })
  window.webContents.on('did-finish-load', () => {
    const {
      remotes: devices, local: thisDevice, remote, position, isController
    } = global.appState.state
    window.webContents.send('devices', {
      devices, thisDevice, remote, position, isController
    })
    // new device found
    global.appState.event.on('global.state.remotes:updated', async ({ devices, newDevice, thisDevice }) => {
      const { remote, position, isController } = global.appState.state
      window && window.webContents.send('devices', {
        devices, thisDevice, remote, position, isController
      })
    })
    // update network info
    global.appState.event.on('global.state.local:updated', ({ device }) => {
      window && window.webContents.send('devices.local', { device })
    })
  })
  ipcMain.on('device.connect', (event, { remoteDevice, position }) => {
    if (remoteDevice) {
      global.appState.state.isController = true
      global.appState.event.emit('global.store:update', {
        position,
        remote: remoteDevice
      })
      
      global.appState.modules.capture.setConnectionPeer(remoteDevice.if, position)

      _keepRemoteShown(remoteDevice, position, global.appState.state.local)
    }
  })
  ipcMain.on('device.disconnect', (event, { remoteIP, position }) => {
    const remoteDevice = global.appState.findDeviceByIP(remoteIP)
    if (remoteDevice) {
      global.appState.state.isController = false
      global.appState.event.emit('global.store:update', {
        position: '',
        remote: null
      })
      
      global.appState.modules.capture.setConnectionPeer(null, null)

      _cancelKeepRemoteShown()
    }
  })
  // window.webContents.openDevTools()
}
let keepping = false
let keepInterval
function _keepRemoteShown(remote, position, thisDevice) {
  if (keepping) {
    return
  } 
  keepping = true
  keepInterval = setInterval(async () => {
    try {
      const { statusCode } = await connectDevice(remote.if, position, thisDevice)
      if (statusCode === 201) {
        global.appState.addToRemotes(remote)
        if (global.appState.state.remote.disabled) {
          global.appState.state.remote.disabled = false

          const { remotes: devices, local: thisDevice, remote, position, isController } = global.appState.state
          if (window) {
            window.webContents.send('devices', {
              devices, thisDevice, remote, position, isController
            })
          }
        }
        global.appState.modules.capture.setConnectionPeer(remote.if, position)
      } else {
        if (global.appState.state.remote.disabled) {
          global.appState.state.remote.disabled = false

          const { remotes: devices, local: thisDevice, remote, position, isController } = global.appState.state
          if (window) {
            window.webContents.send('devices', {
              devices, thisDevice, remote, position, isController
            })
          }
        }
      }
      _keepRemoteShown(remote, position, thisDevice)
    } catch (ex) {
      console.log('restore connection error', ex.message)
    }
  }, 2000)
}
function _cancelKeepRemoteShown() {
  clearInterval(keepInterval)
  keepping = false
}
function _restoreRemote() {
  if (global.appState.state.remote) {
    _keepRemoteShown(global.appState.state.remote, global.appState.state.position, global.appState.state.local)
  }
}

function show() {
  if (!window) {
    _createWindow()
  }
  window.show()
}
function destroy() {
  if (server) {
    server.close(() => {
      server = null
    })
  }
}
function init() {
  if (!server) {
    global.appState.event.on('global.store:updated', function() {
      const {
        remotes: devices, local: thisDevice, remote, position, isController
      } = global.appState.state
      if (window) {
        window.webContents.send('devices', {
          devices, thisDevice, remote, position, isController
        })
      }
    })

    server = http.createServer((req, res) => {
      const urlObj = new URL('http://localhost' + req.url)
      if (urlObj.pathname === '/connection') {
        const restore = urlObj.searchParams.get('restore')
        const positionArg = urlObj.searchParams.get('position')
        const device = JSON.parse(urlObj.searchParams.get('device'))
        const ip = req.socket.remoteAddress
        device.if = ip
        const remoteDeviceFound = global.appState.findDeviceByIP(ip) || device
        
        switch(req.method.toLowerCase()) {
          case 'post': 
            if (!global.appState.state.remote) {
              remoteDeviceFound.disabled = false
              global.appState.event.emit('global.state:update', {
                position: positionArg,
                remote: remoteDeviceFound
              })
              const { remotes: devices, local: thisDevice, remote, position, isController } = global.appState.state
              if (window) {
                window.webContents.send('devices', {
                  devices, thisDevice, remote, position, isController
                })
              }
              res.statusCode = 201
            } else if (global.appState.state.remote.uuid == remoteDeviceFound.uuid) {
              if (global.appState.state.remote.disabled) {
                remoteDeviceFound.disabled = false
                global.appState.event.emit('global.state:update', {
                  position: positionArg,
                  remote: remoteDeviceFound
                })
                const { remotes: devices, local: thisDevice, remote, position, isController } = global.appState.state
                if (window) {
                  window.webContents.send('devices', {
                    devices, thisDevice, remote, position, isController
                  })
                }
              }
              // global.appState.state.remote.timestamp = Date.now()
              clearTimeout(keepRemoteTimer)
              keepRemoteTimer = setTimeout(() => {
                remoteDeviceFound.disabled = true
                global.appState.event.emit('global.state:update', {
                  position: positionArg,
                  remote: remoteDeviceFound
                })
                const { remotes: devices, local: thisDevice, remote, position, isController } = global.appState.state
                if (window) {
                  window.webContents.send('devices', {
                    devices, thisDevice, remote, position, isController
                  })
                }
              }, 2500)
              res.statusCode = 201
            } else {
              res.statusCode = 403
            }
            res.end()
            break
          case 'delete': 
            if (global.appState.state.remote && global.appState.state.remote.uuid === remoteDeviceFound.uuid) {
              global.appState.event.emit('global.state:update', {
                position: '',
                remote: null
              })
              const { remotes: devices, local: thisDevice, remote, position, isController } = global.appState.state
              if (window) {
                window.webContents.send('devices', {
                  devices, thisDevice, remote, position: positionArg, isController
                })
              }
            }
            res.statusCode = 200
            res.end()
            break
          default: res.end('settings HTTP server respond')
        }
      } else {
        res.statusCode = 404
        res.end()
      }
    })
    server.listen(port, address, () => {
      console.log(`setting HTTP server listening ${address}:${port}`)
    })
  }
  _restoreRemote()
}

module.exports = {
  destroy,
  init,
  show
}