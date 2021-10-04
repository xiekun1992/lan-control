declare namespace LAN {
  interface ClipboardRequestParam {
    text: string
  }
  interface Platform {
    linux: boolean
    windows: boolean
  }
  type Config = {
    autoBoot: boolean
    position: string
    remote: Device
  }
  type MapArea = {
    width: number
    height: number
  }
  type NIC = {
    /**
     * IP地址
     */
    address: string
    /**
     * MAC地址
     */
    mac: string
    /**
     * 子网掩码
     */
    mask: string
    /**
     * 广播地址
     * */ 
    netId: string
  }
  // class Device {
  //   timestamp: number
  //   if: string
  //   disabled: boolean
  //   netId: string
  //   type: string
  //   name: string
  //   resolution: string
  //   cpuCores: number
  //   cpuDesc: string
  //   memory: string
  //   nic: Array<NIC>
  //   osInfo: string
  //   hostname: string
  //   username: string
  //   uuid: string
  //   mapArea: MapArea
  //   constructor(arg?: Device)
  //   static parse(str: string): Device
  //   static stringify(device: Device): string
  //   updateHostInfo(): Promise<boolean>
  // }
  type DeviceOption = {
    timestamp: number
    if: string
    disabled: boolean
    netId: string
    type: string
    name: string
    resolution: string
    cpuCores: number
    cpuDesc: string
    memory: string
    nic: NIC[]
    osInfo: string
    hostname: string
    username: string
    uuid: string
    mapArea: MapArea
  }
  // class State {
  //   isController: boolean
  //   remotes: Array<Device>
  //   remote: Device
  //   position: string
  //   local: Device
  //   refreshDeviceInfo(device: Device): boolean
  //   findDeviceByIP(ip: string): Device
  //   addToRemotes(newDevice: Device): boolean
  //   getDeviceUniqueId(device: Device): string
  // }
  interface AppModule {
    init()
    destroy()
  }
  type Nullable<T> = T | null | undefined
}