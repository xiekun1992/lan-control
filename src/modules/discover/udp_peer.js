const dgram = require('dgram')

class UDPPeer {
  constructor() {
    this.server = dgram.createSocket({ reuseAddr: true, type: 'udp4'})
    
    this.server.on('error', (err) => {
      console.log(`server error:\n${err.stack}`);
      this.server.close();
    });
    
    // this.server.on('message', (msg, rinfo) => {
    //   console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    // });
    
    this.server.on('listening', () => {
      const address = this.server.address();
      console.log(`discover IGMP server listening ${address.address}:${address.port}`);
    });
    
  }
  bind(ip, port) {
    this.server.bind(ip, port);
  }
}

module.exports = UDPPeer