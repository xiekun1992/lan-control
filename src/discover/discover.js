const Emitter = require('events')
const { resolve } = require('path')
const UDPPeer = require('./udp_peer')

const discoverEmitter = new Emitter()

const port = 1234
const multicastAddress = '224.0.0.114'

let hostInfo
let server = null

let i = 0, timer, timeout = 1000
let remoteDevices = []
let remoteDevicesMap = {}

function loop() {
  if (hostInfo.length <= 0) {
    return
  }
  const item = hostInfo.nic[i]
  if (item) {
    try {
      server.setMulticastInterface(item.address) // manually close network may cause `Error: addMembership EINVAL`
      const msg = Buffer.from(JSON.stringify(hostInfo))
      server.send(msg, 0, msg.length, port, multicastAddress, (err, sentBytes) => {
        // console.log(sentBytes, item.address)
        i = (i + 1) % hostInfo.nic.length
        sendAllInterfaces()
      })
    } catch (e) {
      i = 0
    }
  } else {
    i = 0
  }
}
function sendAllInterfaces() {
  clearTimeout(timer)
  timer = setTimeout(loop, timeout)
}

function createServerInstance() {
  server = new UDPPeer(port).server
  clearTimeout(timer)
  i = 0

  server.on('message', (msg, rinfo) => {
    // console.log(JSON.parse(msg), rinfo)
    if (!hostInfo.nic.find(item => item.address === rinfo.address)) {
      // console.log(JSON.parse(msg), rinfo)
      const newDevice = JSON.parse(msg)
      // mark which ip the remote connects from
      newDevice.if = rinfo.address
      const deviceNIC = newDevice.nic.find(item => item.address === newDevice.if)
      if (!deviceNIC) {
        return
      }
      const rnetId = deviceNIC.netId

      if (global.device.addToRemotes(newDevice)) {
        if (!hostInfo.if) {
          hostInfo.if = []
        }
        hostInfo.if = hostInfo.nic.find(item => item.netId === rnetId).address // only support one remote device
        
        // console.log(remoteDevices, hostInfo)
        discoverEmitter.emit('discover', {
          devices: global.device.remotes,
          // devices: remoteDevices,
          thisDevice: hostInfo,
          newDevice
        })
      }
    }
  })

  server.bind(port, '0.0.0.0', () => {
    hostInfo.nic.forEach(item => {
      try {
        server.addMembership(multicastAddress, item.address)
      } catch (e) {
        console.error('addMembership fail: ', item.address, e.toString())
      }
    })
    sendAllInterfaces()
  })
}

module.exports = {
  event: discoverEmitter,
  async start() {
    require('./utils').monitNetwork().on('update', (data) => {
      hostInfo = data.hostInfo
      discoverEmitter.emit('discover.local', {
        device: hostInfo
      })
      // nodejs cannot listen network interface up and down, thus cannot properly dropmembership,
      // restart server to solve this
      if (server) {
        server.close()
      }
      const delayTimer = setTimeout(() => { // wait for network card
        clearTimeout(delayTimer)
        createServerInstance()
      }, 2000)
    })
  },
  addToRemotesDevice(device) {
    const key = device.nic.map(item => item.mac).join('-')
    if (!remoteDevicesMap[key]) {
      remoteDevicesMap[key] = true
      remoteDevices.push(device)

      discoverEmitter.emit('discover', {
        devices: remoteDevices,
        thisDevice: hostInfo,
        newDevice: device
      })
    }
  }
}