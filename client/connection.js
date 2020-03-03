const dgram = require('dgram')

class UDPClient {
    static init({port = 8888, ip = '', socketType = 'udp4'}) {
        UDPClient.port = port
        UDPClient.ip = ip
        if (!UDPClient.client) {
            UDPClient.client = dgram.createSocket(socketType)
        }
    }
    static send(obj) {
        if (UDPClient.ip) {
            // console.log(obj, UDPClient.port)
            const message = Buffer.from(JSON.stringify(obj))
            UDPClient.client.send(message, 0, message.length, UDPClient.port, UDPClient.ip)
        }
    }
    static setIP(ip) {
        UDPClient.ip = ip
    }
}
UDPClient.port
UDPClient.ip
UDPClient.client


module.exports = {
    UDPClient
}