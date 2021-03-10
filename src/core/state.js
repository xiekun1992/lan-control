const si = require('systeminformation')
const { screen } = require('electron')
const os = require('os')

class Device {
  constructor ({
    timestamp = 0,
    iface = '',
    disabled = false,
    netId = '',
    type = '',
    name = '',
    resolution = '',
    cpuCores = 0,
    cpuDesc = '',
    memory = '',
    nic = [],
    osInfo = '',
    hostname = '',
    username = '',
    uuid = '',
    mapArea = {
      width: 800,
      height: 600
    }
  }) {
    this.timestamp = timestamp || 0
    this.if = iface
    this.disabled = disabled
    this.netId = netId
    this.type = type
    this.name = name
    this.resolution = resolution
    this.cpuCores = cpuCores
    this.cpuDesc = cpuDesc
    this.memory = memory
    this.nic = nic
    this.osInfo = osInfo
    this.hostname = hostname
    this.username = username
    this.uuid = uuid
    this.mapArea = mapArea
  }
  /**
   * parse device string to device instance
   * @param {String} str 
   */
  static parse(str) {
    try {
      return new Device(JSON.parse(str))
    } catch (ex) {
      console.log('fail to parse device string to device instance', ex)
      return null
    }
  }
  /**
   * stringify device instance
   * @param {Device} device 
   */
  static stringify(device) {
    return JSON.stringify(device)
  }
  /**
   * get current host device information
   * @returns {Device} this
   */
  async updateHostInfo() {
    const screenSize = screen.getAllDisplays().map(item => `${item.size.width}x${item.size.height}`)//screen.getPrimaryDisplay().size
    // const osInfo = await si.osInfo()
    const system = await si.system()
    const interfaces = await si.networkInterfaces()
  
    let ifIpv4 = []
    ifIpv4 = ifIpv4.concat(
      interfaces.filter(
        item => !item.internal && item.ip4
      ).map((item) => {
        const ipv4Decimals = item.ip4.split('.').map(item => +item)
        const subnetDecimals = item.ip4subnet.split('.').map(item => +item)
        const netIdDecimals = []
        for (let i = 0; i < ipv4Decimals.length; i++) {
          netIdDecimals[i] = ipv4Decimals[i] & subnetDecimals[i]
        }
        const netId = netIdDecimals.join('.')
        return {address: item.ip4, mac: item.mac, mask: item.ip4subnet, netId }
      })
    )
    
    this.type = (await si.chassis()).type.toLowerCase()
    this.name = `${system.manufacturer} ${system.model} ${system.version}`.replace(/Not Applicable/gi, '').replace(/INVALID/gi, '').replace(/\-/gi, '').trim()//'联想E49', 
    this.resolution = `${screenSize.join()}`//'1366x768', 
    this.cpuCores = os.cpus().length // 8
    this.cpuDesc = os.cpus()[0].model // cpu specification
    this.memory = Math.ceil(os.totalmem() / 1024 / 1024 / 1024) + 'GB'
    this.nic = ifIpv4
    this.osInfo = `${os.type()} ${os.release()} ${os.arch()}`
    this.hostname = os.hostname()
    this.username = os.userInfo().username
    this.uuid = (await si.system()).uuid
    
    return true
  }
}

class State {
  constructor () {
    this.isController = false
    this.remotes = [] // devices found in LAN
    this.remote = null // connected device
    this.position = '' // left | right
    this.local = new Device({}) // self
  }
  /**
   * update device info in remotes
   * @param {Device} device 
   * @returns {Boolean} result
   */
  refreshDeviceInfo(device) {
    if (device && this.remote && this.getDeviceUniqueId(device) === this.getDeviceUniqueId(this.remote)) {
      this.remote.resolution = device.resolution
      this.remote.nic = device.nic
      this.remote.timestamp = device.timestamp
    }

    for (let i = 0; i < this.remotes.length; i++) {
      const oldDevice = this.remotes[i]
      if (this.getDeviceUniqueId(device) === this.getDeviceUniqueId(oldDevice)) {
        oldDevice.resolution = device.resolution
        oldDevice.nic = device.nic
        oldDevice.timestamp = device.timestamp
        return true
      }
    }
    return false
  }
  /**
   * find device in remote list by given ip
   * @param {String} ip 
   * @returns {Device | null} deviceFound
   */
  findDeviceByIP(ip) {
    return this.remotes.find(device => device.if === ip)
  }
  /**
   * add remote device to global device list
   * @param {Device} newDevice 
   */
  addToRemotes(newDevice) {
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
  getDeviceUniqueId(device) {
    return device.uuid
  }
}

module.exports = {
  State,
  Device
}