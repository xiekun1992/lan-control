const dgram = require('dgram')

let server
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
            console.log(msg.toString(), rinfo.address, rinfo.port)
        })
        server.on('listening', () => {
            const address = server.address()
            console.log(`igmp server listening ${address.address}:${address.port}`)
        })
        server.bind(8889, '0.0.0.0', () => {
        // server.bind(8889, '192.168.1.5', () => {
            // 监听其他设备发送的设备发现请求
            server.addMembership('224.0.0.114', '0.0.0.0')
            // server.addMembership('224.0.0.114', '192.168.1.5')
        })
        return Signal
    }
    static discover() {
        const buf = Buffer.from('discover')
        server.send(buf, 0, buf.length, 8889, '224.0.0.114')
        server.send(buf, 0, buf.length, 8889, '224.0.0.114')
        server.send(buf, 0, buf.length, 8889, '224.0.0.114')
        return Signal
    }
}

module.exports = {
    Signal
}