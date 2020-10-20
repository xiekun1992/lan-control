const Emitter = require('events')
const UDPPeer = require('./udp_peer')
let hostInfo

const discoverEmitter = new Emitter()

const port = 1234
const multicastAddress = '224.0.0.114'
const server = new UDPPeer(port).server

let i = 0, timer, timeout = 1000
const remoteDevices = []
const remoteDevicesMap = {}

function loop() {
  const item = hostInfo.nic[i]
  server.setMulticastInterface(item.address)
  const msg = Buffer.from(JSON.stringify(hostInfo))
  server.send(msg, 0, msg.length, port, multicastAddress, (err, sentBytes) => {
    // console.log(sentBytes)
    i = (i + 1) % hostInfo.nic.length
    sendAllInterfaces()
  })
}
function sendAllInterfaces() {
  clearTimeout(timer)
  timer = setTimeout(loop, timeout)
}

server.on('message', (msg, rinfo) => {
  // console.log(JSON.parse(msg), rinfo)
  if (!hostInfo.nic.find(item => item.address === rinfo.address)) {
    // console.log(JSON.parse(msg), rinfo)
    const newDevice = JSON.parse(msg)
    newDevice.if = rinfo.address
    const rnetId = newDevice.nic.find(item => item.address === newDevice.if).netId
    // console.log(rnetId)
    const key = newDevice.nic.map(item => item.mac).join('-')
    if (!remoteDevicesMap[key]) {
      remoteDevicesMap[key] = true
      remoteDevices.push(newDevice)

      if (!hostInfo.if) {
        hostInfo.if = []
      }
      hostInfo.if = hostInfo.nic.find(item => item.netId === rnetId).address // only support one remote device

      discoverEmitter.emit('discover', {
        devices: remoteDevices,
        thisDevice: hostInfo,
        newDevice
      })
    }
  }
})

module.exports = {
  event: discoverEmitter,
  async start() {
    hostInfo = await require('./utils').getHostInfo()
    return new Promise((resolve) => {
      server.bind(port, () => {
        hostInfo.nic.forEach(item => {
          server.addMembership(multicastAddress, item.address)
        })
        sendAllInterfaces()
        resolve()
      })
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