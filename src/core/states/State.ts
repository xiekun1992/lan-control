import { Position } from '../enums/Position'
import { Device } from './Device'

export class State {
  isController: boolean
  remotes: Array<Device>
  remote: LAN.Nullable<Device>
  position: Position
  local: LAN.Nullable<Device>
  constructor () {
    this.isController = false
    this.remotes = [] // devices found in LAN
    this.remote = null // connected device
    this.position = Position.NONE // left | right
    this.local = new Device() // self
  }
  /**
   * update device info in remotes
   * @param {Device} device 
   * @returns {Boolean} result
   */
  refreshDeviceInfo(device: Device): boolean {
    let updated = false
    if (device && this.remote && this.getDeviceUniqueId(device) === this.getDeviceUniqueId(this.remote)) {
      this.remote.resolution = device.resolution
      this.remote.nic = device.nic
      this.remote.timestamp = device.timestamp
    }

    for (let i = 0; i < this.remotes.length; i++) {
      const oldDevice = this.remotes[i]
      if (this.getDeviceUniqueId(device) === this.getDeviceUniqueId(oldDevice)) {
        if (oldDevice.resolution !== device.resolution) {
          oldDevice.resolution = device.resolution
          updated = true
        }
        if (JSON.stringify(oldDevice.nic) !== JSON.stringify(device.nic)) {
          oldDevice.nic = device.nic
          updated = true
        }
        if (oldDevice.timestamp !== device.timestamp) {
          oldDevice.timestamp = device.timestamp
        }
      }
    }
    return updated
  }
  /**
   * find device in remote list by given ip
   * @param {String} ip 
   * @returns {Device | null} deviceFound
   */
  findDeviceByIP(ip: string): LAN.Nullable<Device> {
    return this.remotes.find(device => device && device.if === ip)
  }
  /**
   * add remote device to global device list
   * @param {Device} newDevice 
   */
  addToRemotes(newDevice: Device): boolean {
    const newDeviceKey = this.getDeviceUniqueId(newDevice)
    for (const dev of this.remotes) {
      if (newDeviceKey === this.getDeviceUniqueId(dev)) {
        return false
      }
    }
    this.remotes.push(newDevice)
    return true
  }
  /**
   * get device unique id
   * @param {Device} device
   */
  getDeviceUniqueId(device: Device): string | null {
    return device && device.uuid
  }
}