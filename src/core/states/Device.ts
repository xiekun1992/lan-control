import si from 'systeminformation'
import { screen } from 'electron'
import os from 'os'

// use a small area to capture mouse movement, 800x600 is the smallest screen resolution
// the least screen size recommended is 1024x768, considering windows taskbar height is 40
export class MapArea {
  width: number = 800
  height: number = 600
  left: number = 0
  right: number = 0
  top: number = 0
  bottom: number = 0
  constructor() {}
  init() {
    const primaryDisplay = screen.getPrimaryDisplay()
    this.left = Math.floor((primaryDisplay.bounds.width - this.width) / 2)
    this.right = this.left + this.width
    this.top = Math.floor((primaryDisplay.bounds.height - this.height) / 2)
    this.bottom = this.top + this.height
  }
}

export class NIC {
  /**
   * IP地址
   */
  address: string = ''
  /**
   * MAC地址
   */
  mac: string = ''
  /**
   * 子网掩码
   */
  mask: string = ''
  /**
   * 广播地址
   * */ 
  netId: string = ''
  constructor() {}
}

export class Device {
  timestamp: number = 0
  if: string = ''
  disabled: boolean = false
  netId: string = ''
  type: string = ''
  name: string = ''
  resolution: string = ''
  cpuCores: number = 0
  cpuDesc: string = ''
  memory: string = ''
  nic: NIC[] = new Array<NIC>()
  osInfo: string = ''
  hostname: string = ''
  username: string = ''
  uuid: string = ''
  mapArea: MapArea = new MapArea()

  constructor (arg?: Device) {
    if (arg) {
      this.timestamp = arg.timestamp
      this.if = arg.if
      this.disabled = arg.disabled
      this.netId = arg.netId
      this.type = arg.type
      this.name = arg.name
      this.resolution = arg.resolution
      this.cpuCores = arg.cpuCores
      this.cpuDesc = arg.cpuDesc
      this.memory = arg.memory
      this.nic = arg.nic
      this.osInfo = arg.osInfo
      this.hostname = arg.hostname
      this.username = arg.username
      this.uuid = arg.uuid
      this.mapArea = arg.mapArea
    }
  }
  /**
   * parse device string to device instance
   * @param {String} str 
   */
  static parse(str: string): LAN.Nullable<Device> {
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
  static stringify(device: Device): string {
    return JSON.stringify(device)
  }
  /**
   * get current host device information
   * @returns {Device} this
   */
  async updateHostInfo(): Promise<boolean> {
    const screenSize = screen.getAllDisplays().map((item: Electron.Display) => `${item.size.width}x${item.size.height}`)//screen.getPrimaryDisplay().size
    // const osInfo = await si.osInfo()
    const system = await si.system()
    const interfaces = await si.networkInterfaces()
  
    let ifIpv4 = [] as Array<NIC>
    ifIpv4 = ifIpv4.concat(
      interfaces.filter(
        (item: any) => !item.internal && item.ip4
      ).map((item: any) => {
        const ipv4Decimals = item.ip4.split('.').map((item: string) => +item)
        const subnetDecimals = item.ip4subnet.split('.').map((item: string) => +item)
        const netIdDecimals: number[] = []
        for (let i = 0; i < ipv4Decimals.length; i++) {
          netIdDecimals[i] = ipv4Decimals[i] & subnetDecimals[i] | (subnetDecimals[i] ^ 255)
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
