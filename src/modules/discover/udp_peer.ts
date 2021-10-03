import dgram from 'dgram'

export class UDPPeer {
  server: dgram.Socket
  constructor() {
    this.server = dgram.createSocket('udp4')
    this.server.on('error', (err: Error) => {
      console.log(`server error:\n${err.stack}`);
      this.server.close();
    });
    
    // this.server.on('message', (msg, rinfo) => {
      //   console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
      // });
      
    this.server.on('listening', () => {
      this.server.setBroadcast(true)
      const address = this.server.address();
      console.log(`discover IGMP server listening ${address.address}:${address.port}`);
    });
    
  }
  bind(port: number, ip?: string) {
    this.server.bind(port, ip);
  }
}