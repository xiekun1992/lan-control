const dgram = require('dgram')
const udp = dgram.createSocket('udp4')
const childProcess = require('child_process')
const path = require('path')

module.exports = {
    start({
        slaveNum = 4,
        port = 8888,
        ip = '0.0.0.0'
    }) {
        console.log('master start with pid:', process.pid)
        // master process
        const slaveProcess = []
        let index = 0
        for (let i = 0; i < slaveNum; i++) {
            const process = childProcess.fork(path.join(__dirname, 'slave.js'))
            slaveProcess.push(process)
        }

        udp.bind(port, ip, () => {
            console.log('server started')
        })
        udp.on('message', (msg, rinfo) => {
            slaveProcess[index].send(msg.toString())
            index++
            index = index % slaveNum
        })
    }
}