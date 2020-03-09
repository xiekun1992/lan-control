const dgram = require('dgram')
const udp = dgram.createSocket('udp4')
const childProcess = require('child_process')
const path = require('path')

let started = false
const slaveProcess = []
module.exports = {
    start({
        slaveNum = 4,
        port = 8888,
        ip = '0.0.0.0'
    }) {
        if (started) return
        started = true
        console.log('master start with pid:', process.pid)
        // master process
        let index = 0
        for (let i = 0; i < slaveNum; i++) {
            const process = childProcess.fork(path.join(__dirname, 'slave.js'))
            process.
            slaveProcess.push(process)
        }

        udp.bind(port, ip, () => {
            console.log('server started')
        })
        udp.on('message', (msg, rinfo) => {
            // console.log(msg)
            slaveProcess[index].send(msg.toString())
            index++
            index = index % slaveNum
        })
    },
    stop() {
        slaveProcess.forEach(proc => {
            proc.unref()
            proc.disconnect()
        })
        udp.removeAllListeners().unref().close()
        started = false
    }
}