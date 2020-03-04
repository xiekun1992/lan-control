const dgram = require('dgram')
const os = require('os')
const {screen} = require('electron')
const si = require('systeminformation')
const EventEmitter = require('events')

const addresses = {}
let devices = []
const PORT = 8889, IP = '224.0.0.114'
let discoverTimer
class SignalConnection extends EventEmitter {
    constructor() {
        super()
        this.server = dgram.createSocket('udp4')
        const interfaces = os.networkInterfaces()
        for (const name in interfaces) {
            interfaces[name].forEach(item => {
                if (item.family == 'IPv4') {
                    // console.log(name, item.address)
                    addresses[item.address] = item.mac
                }
            })
        }
        return this
    }
    start() {
        this.server.on('error', err => {
            console.log(`igmp server error: ${err}`)
            this.server.close()
            this.server = null
        })
        this.server.on('message', async (msg, rinfo) => {
            console.log(msg.toString())
            if (true || (rinfo.address in addresses)) {
                const msgObj = JSON.parse(msg.toString())
                console.log('msgObj', msgObj)
                switch (msgObj.cmd) {
                    case 'discover':
                        // 收到设备发现请求
                        const screenSize = screen.getPrimaryDisplay().size
                        this._send({
                            cmd: 'discover.reply',
                            type: (await si.chassis()).type.toLowerCase(), 
                            name: os.hostname(),//'联想E49', 
                            os: (await si.osInfo()).distro,// 'Linux Ubuntu x64', 
                            resolution: `${screenSize.width}x${screenSize.height}`,//'1366x768', 
                            IP: ''// 接收方补充 '192.168.1.8'
                        })
                    break
                    case 'discover.reply':
                        if (devices.findIndex(dev => rinfo.address == dev.IP) < 0) {
                            delete msgObj.cmd
                            msgObj.IP = rinfo.address
                            devices.push(msgObj)
                            // console.log(devices)
                            clearTimeout(discoverTimer)
                            this.emit('devices.update', {devices})
                        }
                    break
                    case 'downstream.add':
                        console.log(msgObj.deviceIP)
                        if (msgObj.deviceIP in addresses) { // 本设备被对方添加为下级节点
                            this.emit('upstream.set', {device: devices.find(dev => dev.IP == rinfo.address)})
                        }
                    break
                }
            }
        })
        this.server.on('listening', () => {
            const address = this.server.address()
            console.log(`igmp server listening ${address.address}:${address.port}`)
        })
        this.server.bind(PORT, '0.0.0.0', () => {
            // 监听其他设备发送的设备发现请求
            this.server.addMembership(IP, '0.0.0.0')
        })
        return this
    }
    _send(obj) {
        const buf = Buffer.from(JSON.stringify(obj))
        this.server.send(buf, 0, buf.length, PORT, IP)
    }
    discover() {
        this._send({cmd: 'discover'})
        devices = []
        discoverTimer = setTimeout(() => {
            this.emit('devices.update', devices)
            clearTimeout(discoverTimer)
        }, 5000)
        return this
    }
    addDownstream(downstreamDevice) {
        this._send({cmd: 'downstream.add', deviceIP: downstreamDevice.IP})
        return this
    }
}
class Signal {
    static getInstance() {
        if (!Signal.connection) {
            Signal.connection = new SignalConnection()
        }
        return Signal.connection
    }
}
Signal.connection


module.exports = {
    Signal
}