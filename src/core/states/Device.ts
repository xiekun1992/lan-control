import si from 'systeminformation'
import { screen } from 'electron'
import os from 'os'

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
  nic: LAN.NIC[] = new Array<LAN.NIC>()
  osInfo: string = ''
  hostname: string = ''
  username: string = ''
  uuid: string = ''
  mapArea: LAN.MapArea = {
    width: 800,
    height: 600
  }

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
  
    let ifIpv4 = [] as Array<LAN.NIC>
    ifIpv4 = ifIpv4.concat(
      interfaces.filter(
        (item: any) => !item.internal && item.ip4
      ).map((item: any) => {
        const ipv4Decimals = item.ip4.split('.').map((item: string) => +item)
        const subnetDecimals = item.ip4subnet.split('.').map((item: string) => +item)
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
