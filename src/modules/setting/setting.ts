import {
  BrowserWindow, ipcMain
} from 'electron'
import path from 'path'
import { Device } from '../../core/states/Device';
import { Position } from '../../core/enums/Position';
const { connectDevice } = require('./utils')

class Setting implements LAN.AppModule {
  window: LAN.Nullable<Electron.BrowserWindow> = null;
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
          // if (global.appState.state.remote?.disabled) {
          //   global.appState.state.remote.disabled = false
  
          //   const { remotes: devices, local: thisDevice, remote, position, isController } = global.appState.state
            
          //   this.window?.webContents.send('devices', {
          //     devices, thisDevice, remote, position, isController
          //   })
            
          // }
          // global.appState.modules.get('capture').setConnectionPeer(remote.if, position)
        } else {
          // if (global.appState.state.remote?.disabled) {
          //   global.appState.state.remote.disabled = false
  
          //   const { remotes: devices, local: thisDevice, remote, position, isController } = global.appState.state
            
          //   this.window?.webContents.send('devices', {
          //     devices, thisDevice, remote, position, isController
          //   })
          // }
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
  destroy() {}
  init() {
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
        this._cancelKeepRemoteShown()
        clearTimeout(this.keepRemoteTimer)

        global.appState.state.isController = false
        global.appState.event.emit('global.store:update', {
          position: '',
          remote: null
        })
        
        global.appState.modules.get('capture').setConnectionPeer(null, null)
      }
    })

    global.appState.httpServer
      .route('/connection')
      .post((req, res) => {
        const updateDevice = (positionArg: Position, remoteDeviceFound: Device) => {
          global.appState.event.emit('global.state:update', {
            position: positionArg,
            remote: remoteDeviceFound
          })
          const { remotes: devices, local: thisDevice, remote, position, isController } = global.appState.state
          
          this.window?.webContents.send('devices', {
            devices, thisDevice, remote, position, isController
          })
        }
        const restore = req.query.restore
        const positionArg = req.query.position as unknown as Position
        const device: Device = JSON.parse(req.query.device as string)
        const ip = req.socket.remoteAddress
        if (ip) {
          device.if = ip
          const remoteDeviceFound = global.appState.findDeviceByIP(ip) || device
          if (!global.appState.state.remote) {
            // 远程设备不存在，第一次添加
            remoteDeviceFound.disabled = false
            updateDevice(positionArg, remoteDeviceFound)
            res.status(201)
          } else if (global.appState.state.remote.uuid == remoteDeviceFound.uuid) {
            // 已经被控制且重复收到相同设备信息
            if (global.appState.state.remote.disabled) {
              remoteDeviceFound.disabled = false
              updateDevice(positionArg, remoteDeviceFound)
            }
            res.status(201)
          } else {
            res.status(403)
          }
          res.end()
        }
      })
      .delete((req, res) => {
        const restore = req.query.restore
        const positionArg = req.query.position as unknown as Position
        const device: Device = JSON.parse(req.query.device as string)
        const ip = req.socket.remoteAddress
        if (ip) {
          device.if = ip
          const remoteDeviceFound = global.appState.findDeviceByIP(ip) || device
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
          res.status(200).end()
        }
      })
    this._restoreRemote()
  }
}

module.exports = new Setting()