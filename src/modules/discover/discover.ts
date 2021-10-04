import dgram from 'dgram'
import { Device } from '../../core/states/Device'
import { UDPPeer } from './udp_peer'

class Discover implements LAN.AppModule {
  port: number = 1234
  address: string = '0.0.0.0'
  hostInfo: LAN.Nullable<Device> = null
  server: LAN.Nullable<dgram.Socket> = null
  i: number = 0
  timeout: number = 1000
  aliveTimer: number = 0
  
  sendAllInterfaces() {
    if (!this.hostInfo) {
      return
    }
    const item = this.hostInfo?.nic[this.i]
    if (item) {
      try {
        const broadcastAddress = item.netId
        const msg = Buffer.from(JSON.stringify(this.hostInfo))
        this.server?.send(msg, 0, msg.length, this.port, broadcastAddress, (err, sentBytes) => {})
        if (this.hostInfo?.nic?.length) {
          this.i = (this.i + 1) % this.hostInfo?.nic?.length
          setTimeout(() => {
            this.sendAllInterfaces()
          }, this.timeout)
        }
      } catch (e) {
        this.i = 0
      }
    } else {
      this.i = 0
    }
  }
  checkRemotesAlive() {
    const now = Date.now()
    let modified = false
    for (let i = global.appState.state.remotes.length - 1; i > -1; i--) {
      const device = global.appState.state.remotes[i]
      if (now - device.timestamp > 2500) { // longer than 1 second, expired
        modified = true
        global.appState.state.remotes.splice(i, 1)
      }
    }
    if (global.appState.state.remote && !global.appState.state.remote.disabled && now - global.appState.state.remote.timestamp > 2500) { // expire time 2500 should bigger than keep remote shown timeout 2000
      global.appState.state.remote.disabled = true
      global.appState.modules.get('capture').setConnectionPeer(null, null)
      modified = true
    }
    if (modified) {
      global.appState.event.emit('global.state.remotes:updated', {
        devices: global.appState.state.remotes,
        thisDevice: global.appState.state.local,
        newDevice: null
      })
    }
  }
  createServerInstance() {
    this.server = new UDPPeer().server
    this.i = 0
  
    this.server.on('message', (msg, rinfo) => {
      try {
        if (!this.hostInfo?.nic.find(item => item.address === rinfo.address)) { // exclude self
          const newDevice: Device = JSON.parse(msg.toString())
          // mark which ip the remote connects from
          newDevice.if = rinfo.address
          const deviceNIC = newDevice.nic.find(item => item.address === newDevice.if)
          if (!deviceNIC) {
            return
          }
          // const rnetId = deviceNIC.netId
    
          if (global.appState.addToRemotes(newDevice)) {
            // if (!hostInfo.if) {
            //   hostInfo.if = []
            // }
            // hostInfo.if = hostInfo.nic.find(item => item.netId === rnetId).address // only support one remote device
          } else {
            global.appState.refreshDeviceInfo(newDevice)
          }
        }
      } catch (e) {
        console.error('discover: error ', e)
      }
    })
  
    this.server.bind(this.port, this.address, () => {
      this.sendAllInterfaces()
    })
  }
  destroy() {
    clearInterval(this.aliveTimer)
    this.server?.close(() => {
      this.server = null
    })
  }
  init() {
    this.hostInfo = global.appState.state.local
    this.createServerInstance()

    global.appState.event.on('global.nic:changed', (data) => {
      console.log('network interface changed')
      this.hostInfo = data.hostInfo
      // nodejs cannot listen network interface up and down, thus cannot properly dropmembership,
      // restart server to solve this
      this.server?.close()
      
      setTimeout(() => { // wait for network card
        this.createServerInstance()
      }, 2000)
    })
    // check wether remote devices available
    this.aliveTimer = setInterval(this.checkRemotesAlive.bind(this), 1000) as unknown as number
  }
}

module.exports = new Discover()