const os = require('os')
const {screen} = require('electron')
const si = require('systeminformation')

class Device {
    constructor({
        type, name, os, resolution, IP
    }) {
        this.type = type
        this.name = name
        this.os = os
        this.resolution = resolution
        this.IP = IP
    }
    equals(target) {
        for (const key in this) {
            if (this[key] != target[key]) {
                return false
            }
        }
        return true
    }
    static async getCurrentDevice() {
        const screenSize = screen.getPrimaryDisplay().size
        return new Device({
            type: (await si.chassis()).type.toLowerCase(), 
            name: os.hostname(),//'联想E49', 
            os: (await si.osInfo()).distro,// 'Linux Ubuntu x64', 
            resolution: `${screenSize.width}x${screenSize.height}`,//'1366x768', 
            IP: ''// 接收方补充 '192.168.1.8'
        })
    }
}

module.exports = {
    Device
}