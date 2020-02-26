const dgram = require('dgram')

class UDPClient {
    static init({port = 8888, ip = '0.0.0.0', socketType = 'udp4'}) {
        UDPClient.port = port
        UDPClient.ip = ip
        UDPClient.client = dgram.createSocket(socketType)
    }
    static send(obj) {
        // console.log(obj, UDPClient.port)
        const message = Buffer.from(JSON.stringify(obj))
        UDPClient.client.send(message, 0, message.length, UDPClient.port, UDPClient.ip)
    }
}
UDPClient.port
UDPClient.ip
UDPClient.client


module.exports = {
    UDPClient
}