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
}

module.exports = {
    Device
}