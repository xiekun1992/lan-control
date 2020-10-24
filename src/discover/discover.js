const Emitter = require('events')
const { resolve } = require('path')
const UDPPeer = require('./udp_peer')
let hostInfo

const discoverEmitter = new Emitter()

const port = 1234
const multicastAddress = '224.0.0.114'
let server = new UDPPeer(port).server

let i = 0, timer, timeout = 1000
const remoteDevices = []
const remoteDevicesMap = {}

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
        // console.log(sentBytes)
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

    require('./utils').monitNetwork().on('update', (data) => {
      hostInfo = data.hostInfo
      const diffMinus = data.diffMinus
      const diffAdd = data.diffAdd

      // console.log(hostInfo.nic, diffMinus, diffAdd)
      
      // nodejs cannot listen network interface up and down, thus cannot properly dropmembership,
      // restart server to solve this
      if (server) {
        server.close()
      }
      server = new UDPPeer(port).server
      const delayTimer = setTimeout(() => { // wait for network card
        clearTimeout(delayTimer)
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
      }, 3000)
      // setTimeout(() => {
      //   diffMinus.forEach(item => {
      //     server.dropMembership(multicastAddress, item.address)
      //   })
      //   diffAdd.forEach(item => {
      //     server.addMembership(multicastAddress, item.address)
      //   })
      //   // hostInfo.nic.forEach(item => {
      //   //   try {
      //   //     if (!membershipIPs[item.address]) {
      //   //       server.addMembership(multicastAddress, item.address)
      //   //       membershipIPs[item.address] = true
      //   //     }
      //   //   } catch (e) {
      //   //     console.error('addMembership fail: ', item.address, e.toString())
      //   //   }
      //   // })
      //   sendAllInterfaces()
      // }, 3000);
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