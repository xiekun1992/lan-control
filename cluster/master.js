const dgram = require('dgram')
const childProcess = require('child_process')
const path = require('path')

let udp = null
let started = false
let slaveProcess = []
module.exports = {
    start({
        slaveNum = 4,
        port = 8888,
        ip = '0.0.0.0'
    }) {
        if (started) return
        started = true
        if (!udp) {
            udp = dgram.createSocket('udp4')
        }
        console.log('master start with pid:', process.pid)
        // master process
        let index = 0
        for (let i = 0; i < slaveNum; i++) {
            const process = childProcess.fork(path.join(__dirname, 'slave.js'))
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
        if (started) {
            slaveProcess.forEach(proc => {
                proc.kill()
            })
            udp.removeAllListeners().unref().close(() => {
                udp = null
                started = false
                slaveProcess = []
                console.log('udp free done!')
            })
        }
    }
}