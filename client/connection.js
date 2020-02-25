const dgram = require('dgram')

class UDPClient {
    static port
    static ip
    constructor({port = 8888, ip = '0.0.0.0', socketType = 'udp4'}) {
        this.port = port
        this.ip = ip
        this.client = dgram.createSocket(socketType)
    }
    send(obj) {
        const message = Buffer.from(JSON.stringify(obj))
        this.client.send(message, 0, message.length, this.port, this.ip)
    }
}

module.exports = {
    UDPClient
}