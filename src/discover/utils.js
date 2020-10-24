const si = require('systeminformation')
const { screen } = require('electron')
const os = require('os')
const EventEmitter = require('events')

async function getHostInfo() {
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
  return {
    type: (await si.chassis()).type.toLowerCase(), 
    name: `${system.manufacturer} ${system.model} ${system.version}`.replace(/Not Applicable/gi, '').replace(/INVALID/gi, '').replace(/\-/gi, '').trim(),//'联想E49', 
    resolution: `${screenSize.join()}`,//'1366x768', 
    cpuCores: os.cpus().length, // 8
    cpuDesc: os.cpus()[0].model, // cpu specification
    memory: Math.ceil(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
    nic: ifIpv4,
    osInfo: `${os.type()} ${os.release()} ${os.arch()}`,
    hostname: os.hostname(),
    username: os.userInfo().username
  }
}

class NetworkStatusEvent extends EventEmitter {}
const netEvent = new NetworkStatusEvent()
let nicNum = 0

async function nicCheck() {
  const ifs = os.networkInterfaces()
  let currentNicNum = 0
  for (const name in ifs) { // count available interfaces
    if (ifs[name].some(item => item.internal === false)) {
      currentNicNum++
    }
  }
  // check if new interface available or any interface is unavailable
  if (nicNum !== currentNicNum) {
    nicNum = currentNicNum
    // update global device info
    const hostInfo = await getHostInfo()

    global.device.local = hostInfo
    netEvent.emit('update', {
      hostInfo
    })
  }
}


module.exports = {
  getHostInfo,
  monitNetwork() {
    setInterval(nicCheck, 1000)
    return netEvent
  }
}