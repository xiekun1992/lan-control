const si = require('systeminformation')
const os = require('os')

module.exports = {
  getHostInfo() {
    return new Promise((resolve, reject) => {
      si.networkInterfaces(function(interfaces) {
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
        resolve({
          cpuCores: os.cpus().length,
          cpuDesc: os.cpus()[0].model,
          memory: Math.ceil(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
          nic: ifIpv4,
          osInfo: `${os.type()} ${os.release()} ${os.arch()}`,
          hostname: os.hostname(),
          username: os.userInfo().username
        })
      })
    })
  },

}