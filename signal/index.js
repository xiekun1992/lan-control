const dgram = require('dgram')
const os = require('os')
const {screen} = require('electron')
const si = require('systeminformation')

const addresses = []
const devices = []
const PORT = 8889, IP = '224.0.0.114'
let updateDevicesFn
let server
let discoverTimer
class Signal {
    static getInstance() {
        if (!server) {
            server = dgram.createSocket('udp4')

            const interfaces = os.networkInterfaces()
            for (const name in interfaces) {
                interfaces[name].forEach(item => {
                    if (item.family == 'IPv4') {
                        // console.log(name, item.address)
                        addresses.push(item.address)
                    }
                })
            }
        }
        return Signal
    }
    static start() {
        server.on('error', err => {
            console.log(`igmp server error: ${err}`)
            server.close()
            server = null
        })
        server.on('message', async (msg, rinfo) => {
            // console.log(msg.toString())
            if (false || addresses.indexOf(rinfo.address) == -1) {
                const msgObj = JSON.parse(msg.toString())
                if (msgObj.cmd == 'discover') {
                    // 收到设备发现请求
                    const screenSize = screen.getPrimaryDisplay().size
                    const reply = Buffer.from(JSON.stringify({
                        cmd: 'discover.reply',
                        type: (await si.chassis()).type.toLowerCase(), 
                        name: os.hostname(),//'联想E49', 
                        os: (await si.osInfo()).distro,// 'Linux Ubuntu x64', 
                        resolution: `${screenSize.width}x${screenSize.height}`,//'1366x768', 
                        IP: ''// 接收方补充 '192.168.1.8'
                    }))
                    server.send(reply, 0, reply.length, PORT, IP)
                } else if (msgObj.cmd == 'discover.reply') {
                    if (devices.findIndex(dev => rinfo.address == dev.IP) < 0) {
                        delete msgObj.cmd
                        msgObj.IP = rinfo.address
                        devices.push(msgObj)
                        // console.log(devices)
                        clearTimeout(discoverTimer)
                        updateDevicesFn && updateDevicesFn(devices)
                    }
                }
                // console.log(msg.toString(), rinfo.address, rinfo.port)
            }
        })
        server.on('listening', () => {
            const address = server.address()
            console.log(`igmp server listening ${address.address}:${address.port}`)
        })
        server.bind(PORT, '0.0.0.0', () => {
            // 监听其他设备发送的设备发现请求
            server.addMembership(IP, '0.0.0.0')
        })
        return Signal
    }
    static discover() {
        const buf = Buffer.from(JSON.stringify({cmd: 'discover'}))
        server.send(buf, 0, buf.length, PORT, IP)
        discoverTimer = setTimeout(() => {
            updateDevicesFn && updateDevicesFn(devices)
        }, 5000)
        return Signal
    }
    static deviceUpdated(callback) {
        updateDevicesFn = callback
        return Signal
    }
}

module.exports = {
    Signal
}