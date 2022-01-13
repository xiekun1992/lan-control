
import os from 'os'
import { app } from 'electron'
import path from 'path'
import express from 'express'
import bodyParser from 'body-parser'
import { Store } from '../store'
import { GlobalEvent } from '../event'
import { State } from './State'
import { Device } from './Device'

interface Platform {
  linux: boolean
  windows: boolean
}

const port = 2001
const host = '0.0.0.0'
export class AppState {
  name: string
  exePath: string
  path: string
  updateURL: string
  platform: Platform
  autoBoot: boolean
  modules: Map<string, any>
  state: State
  event: GlobalEvent
  store: Store
  httpServer: express.Express

  constructor(launchPath: string) {
    this.name = require(path.resolve(launchPath, 'package.json')).name
    this.exePath = app.getPath('exe')
    this.path = launchPath,
    this.updateURL = 'http://home.xuexuesoft.com:5023/lan_control/download/latest/', // should be hard coded,  require(path.resolve(launchPath, 'package.json')).build.publish[0].url,
    this.platform = {
      linux: os.platform() === 'linux',
      windows: os.platform() === 'win32'
    }
    this.autoBoot = true
    this.modules = new Map()
    this.state = new State()
    this.event = new GlobalEvent()
    this.store = new Store(os.homedir(), '.lan_control')
    this.httpServer = express()
    this.httpServer.use(bodyParser.json())
  }
  startServer() {
    this.httpServer.listen(port, host, () => {
      console.log(`http server listen at ${host}:${port}`)
    })
  }
  addToRemotes(newDevice: Device): boolean {
    newDevice.timestamp = Date.now()
    const result = this.state.addToRemotes(newDevice)
    if (result) {
      this.event.emit('global.state.remotes:updated', {
        devices: this.state.remotes,
        thisDevice: this.state.local,
        newDevice
      })
    }
    return result
  }
  findDeviceByIP(ip: string): LAN.Nullable<Device> {
    return this.state.findDeviceByIP(ip)
  }
  parseDevice(devStr: string): LAN.Nullable<Device> {
    return Device.parse(devStr)
  }
  deviceStringify(device: Device): string {
    return Device.stringify(device)
  }
  refreshDeviceInfo(device: Device): boolean {
    // refresh remotes
    if (this.state.refreshDeviceInfo(device)) {
      this.event.emit('global.state.remotes:updated', {
        devices: this.state.remotes,
        thisDevice: this.state.local,
        newDevice: device
      })
      return true
    }
    return false
  }
}