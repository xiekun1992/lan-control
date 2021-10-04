import {
  BrowserWindow, app, ipcMain
} from 'electron'
import path from 'path'
import http from 'http'
import { Device } from '../../core/states/Device';
import { Position } from '../../core/enums/Position';
const { connectDevice } = require('./utils')

class Setting implements LAN.AppModule {
  window: LAN.Nullable<Electron.BrowserWindow> = null;
  server: LAN.Nullable<http.Server> = null;
  keepRemoteTimer: number = 0
  address: string = '0.0.0.0'
  port: number = 2001
  keepping: boolean = false
  keepInterval: number = 0

  constructor() {}
  _createWindow() {
    if (this.window) {
      return this.window
    }
    this.window = new BrowserWindow({
      show: false,
      width: 940,
      height: 600,
      resizable: false,
      webPreferences: {
        nodeIntegration: true
      }
    })
    this.window.loadFile(path.resolve(__dirname, 'index.html'))
  
    this.window.on('closed', () => {
      this.window = null
    })
    this.window.webContents.on('did-finish-load', () => {
      const {
        remotes: devices, local: thisDevice, remote, position, isController
      } = global.appState.state
      this.window?.webContents.send('devices', {
        devices, thisDevice, remote, position, isController
      })
    })
    // window.webContents.openDevTools()
  }
  _keepRemoteShown(remote: Device, position: Position, thisDevice: Device) {
    if (this.keepping) {
      return
    } 
    this.keepping = true
    this.keepInterval = setInterval(async () => {
      try {
        const { statusCode } = await connectDevice(remote.if, position, thisDevice)
        if (statusCode === 201) {
          global.appState.addToRemotes(remote)
          if (global.appState.state.remote?.disabled) {
            global.appState.state.remote.disabled = false
  
            const { remotes: devices, local: thisDevice, remote, position, isController } = global.appState.state
            
            this.window?.webContents.send('devices', {
              devices, thisDevice, remote, position, isController
            })
            
          }
          global.appState.modules.get('capture').setConnectionPeer(remote.if, position)
        } else {
          if (global.appState.state.remote?.disabled) {
            global.appState.state.remote.disabled = false
  
            const { remotes: devices, local: thisDevice, remote, position, isController } = global.appState.state
            
            this.window?.webContents.send('devices', {
              devices, thisDevice, remote, position, isController
            })
          }
        }
        this._keepRemoteShown(remote, position, thisDevice)
      } catch (ex: any) {
        console.log('restore connection error', ex.message)
      }
    }, 2000) as unknown as number
  }
  _cancelKeepRemoteShown() {
    clearInterval(this.keepInterval)
    this.keepping = false
  }
  _restoreRemote() {
    if (global.appState.state.remote) {
      this._keepRemoteShown(global.appState.state.remote, global.appState.state.position, global.appState.state.local!)
    }
  }
  
  show() {
    if (!this.window) {
      this._createWindow()
    }
    this.window?.show()
  }
  destroy() {
    if (this.server) {
      this.server.close(() => {
        this.server = null
      })
    }
  }
  init() {
    if (!this.server) {
      global.appState.event.on('global.store:updated', () => {
        const {
          remotes: devices, local: thisDevice, remote, position, isController
        } = global.appState.state
        
        this.window?.webContents.send('devices', {
          devices, thisDevice, remote, position, isController
        })
        
      })
      // new device found
      global.appState.event.on('global.state.remotes:updated', async ({ devices, newDevice, thisDevice }) => {
        const { remote, position, isController } = global.appState.state
        this.window?.webContents.send('devices', {
          devices, thisDevice, remote, position, isController
        })
      })
      // update network info
      global.appState.event.on('global.state.local:updated', ({ device }) => {
        this.window?.webContents.send('devices.local', { device })
      })

      ipcMain.on('device.connect', (event, { remoteDevice, position }) => {
        if (remoteDevice) {
          global.appState.state.isController = true
          global.appState.event.emit('global.store:update', {
            position,
            remote: remoteDevice
          })
          
          global.appState.modules.get('capture').setConnectionPeer(remoteDevice.if, position)
    
          this._keepRemoteShown(remoteDevice, position, global.appState.state.local!)
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
          
          global.appState.modules.get('capture').setConnectionPeer(null, null)
    
          this._cancelKeepRemoteShown()
        }
      })

      this.server = http.createServer((req, res) => {
        const urlObj = new URL('http://localhost' + req.url)
        if (urlObj.pathname === '/connection') {
          const restore = urlObj.searchParams.get('restore')
          const positionArg = urlObj.searchParams.get('position')
          const device: Device = JSON.parse(urlObj.searchParams.get('device')!)
          const ip = req.socket.remoteAddress
          if (ip) {
            device.if = ip
            const remoteDeviceFound = global.appState.findDeviceByIP(ip) || device
            switch(req.method?.toLowerCase()) {
              case 'post': 
                if (!global.appState.state.remote) {
                  remoteDeviceFound.disabled = false
                  global.appState.event.emit('global.state:update', {
                    position: positionArg,
                    remote: remoteDeviceFound
                  })
                  const { remotes: devices, local: thisDevice, remote, position, isController } = global.appState.state
                  
                  this.window?.webContents.send('devices', {
                    devices, thisDevice, remote, position, isController
                  })
                  
                  res.statusCode = 201
                } else if (global.appState.state.remote.uuid == remoteDeviceFound.uuid) {
                  if (global.appState.state.remote.disabled) {
                    remoteDeviceFound.disabled = false
                    global.appState.event.emit('global.state:update', {
                      position: positionArg,
                      remote: remoteDeviceFound
                    })
                    const { remotes: devices, local: thisDevice, remote, position, isController } = global.appState.state

                    this.window?.webContents.send('devices', {
                      devices, thisDevice, remote, position, isController
                    })
                  }
                  // global.appState.state.remote.timestamp = Date.now()
                  clearTimeout(this.keepRemoteTimer)
                  this.keepRemoteTimer = setTimeout(() => {
                    remoteDeviceFound.disabled = true
                    global.appState.event.emit('global.state:update', {
                      position: positionArg,
                      remote: remoteDeviceFound
                    })
                    const { remotes: devices, local: thisDevice, remote, position, isController } = global.appState.state
                    
                    this.window?.webContents.send('devices', {
                      devices, thisDevice, remote, position, isController
                    })
                  }, 2500) as unknown as number
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
                  this.window?.webContents.send('devices', {
                    devices, thisDevice, remote, position: positionArg, isController
                  })
                }
                res.statusCode = 200
                res.end()
                break
              default: res.end('settings HTTP server respond')
            }
          }
        } else {
          res.statusCode = 404
          res.end()
        }
      })
      this.server.listen(this.port, this.address, () => {
        console.log(`setting HTTP server listening ${this.address}:${this.port}`)
      })
    }
    this._restoreRemote()
  }
}

module.exports = new Setting()