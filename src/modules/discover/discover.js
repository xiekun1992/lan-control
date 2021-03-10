const UDPPeer = require('./udp_peer')

const port = 1234
const multicastAddress = '224.0.0.114'

let hostInfo
let server = null

let i = 0, timer, timeout = 50, aliveTimer
// let remoteDevices = []
// let remoteDevicesMap = {}

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
function checkRemotesAlive() {
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
    global.appState.modules.capture.setConnectionPeer(null, null)
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
function createServerInstance() {
  server = new UDPPeer(port).server
  clearTimeout(timer)
  i = 0

  server.on('message', (msg, rinfo) => {
    if (!hostInfo.nic.find(item => item.address === rinfo.address)) { // exclude self
      const newDevice = JSON.parse(msg)
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
function destroy() {
  clearInterval(aliveTimer)
  if (server) {
    server.close(() => {
      server = null
    })
  }
}


module.exports = {
  destroy,
  init() {
    hostInfo = global.appState.state.local
    createServerInstance()

    global.appState.event.on('global.nic:changed', (data) => {
      console.log('network interface changed')
      hostInfo = data.hostInfo
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
    // check wether remote devices available
    aliveTimer = setInterval(checkRemotesAlive, 1000)
  },
  // addToRemotesDevice(device) {
  //   const key = device.nic.map(item => item.mac).join('-')
  //   if (!remoteDevicesMap[key]) {
  //     remoteDevicesMap[key] = true
  //     remoteDevices.push(device)

  //     global.appState.event.emit('discover', {
  //       devices: remoteDevices,
  //       thisDevice: hostInfo,
  //       newDevice: device
  //     })
  //   }
  // }
}