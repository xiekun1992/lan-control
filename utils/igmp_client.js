const port = 8088;
const host = '0.0.0.0';
const dgram = require('dgram');
const client = dgram.createSocket('udp4');
const {performance} = require('perf_hooks');

client.on('message', (message, remote) => {
  
});
client.bind(port, host, () => {
  client.setSendBufferSize(64*1024*1024);
  // client.setBroadcast(true);
  // client.setMulticastTTL(128);
  // client.addMembership('230.185.192.108');
});

module.exports = {
  send(obj) {
    if (typeof obj !== 'string') {
      obj = JSON.stringify(obj);
    }
    // console.log(Date.now(), obj);
    const message = Buffer.from(obj);
    // client.send(message, 0, message.length, 8004, '230.185.192.108');
    client.send(message, 0, message.length, 8888, '192.168.1.8');
    // client.send(message, 0, message.length, 8004, '192.168.1.8');
    // client.send(message, 0, message.length, 8004, '127.0.0.1');
  }
}

// const http = require('http');

// module.exports = {
//   send(obj) {
//     http.get(`http://192.168.1.8:8000${obj}`)
//   }
// }