const dgram = require('dgram')
const os = require('os')
const {screen} = require('electron')

const interfaces = os.networkInterfaces()
const addresses = []
// console.log(os.hostname())
for (const name in interfaces) {
    interfaces[name].forEach(item => {
        if (item.family == 'IPv4') {
            // console.log(name, item.address)
            addresses.push(item.address)
        }
    })
}
// interfaces.forEach(item => {
//     item.forEach(addr => {
//         console.log(addr)
//     })
// })
const devices = []
let server
const PORT = 8889, IP = '224.0.0.114'
class Signal {
    static getInstance() {
        if (!server) {
            server = dgram.createSocket('udp4')
        }
        return Signal
    }
    static start() {
        server.on('error', err => {
            console.log(`igmp server error: ${err}`)
            server.close()
            server = null
        })
        server.on('message', (msg, rinfo) => {
            // console.log(msg.toString())
            if (false || addresses.indexOf(rinfo.address) == -1) {
                const msgObj = JSON.parse(msg.toString())
                if (msgObj.cmd == 'discover') {
                    // 收到设备发现请求
                    const screenSize = screen.getPrimaryDisplay().size
                    const reply = Buffer.from(JSON.stringify({
                        cmd: 'discover.reply',
                        type: 'desktop', 
                        name: os.hostname(),//'联想E49', 
                        os: `${os.platform()} ${os.release()}`,// 'Linux Ubuntu x64', 
                        resolution: `${screenSize.width}x${screenSize.height}`,//'1366x768', 
                        IP: ''// 接收方补充 '192.168.1.8'
                    }))
                    server.send(reply, 0, reply.length, PORT, IP)
                } else if (msgObj.cmd == 'discover.reply') {
                    delete msgObj.cmd
                    msgObj.IP = rinfo.address
                    devices.push(msgObj)
                    console.log(devices)
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
        return Signal
    }
}

module.exports = {
    Signal
}