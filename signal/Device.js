const {screen} = require('electron')
const si = require('systeminformation')

class Device {
    constructor({
        type, name, os, resolution, IP, hostname
    }) {
        this.type = type
        this.name = name
        this.hostname = hostname
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
        const osInfo = await si.osInfo()
        const system = await si.system()
        return new Device({
            type: (await si.chassis()).type.toLowerCase(), 
            name: `${system.manufacturer} ${system.model} ${system.version}`.replace(/Not Applicable/gi, '').replace(/INVALID/gi, '').replace(/\-/gi, '').trim(),//'联想E49', 
            hostname: osInfo.hostname,//'联想E49', 
            os: `${osInfo.logofile} ${osInfo.release} ${osInfo.arch}`,// 'Linux Ubuntu x64', 
            resolution: `${screenSize.width}x${screenSize.height}`,//'1366x768', 
            IP: ''// 接收方补充 '192.168.1.8'
        })
    }
}

module.exports = {
    Device
}