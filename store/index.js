const ElectronStore = require('electron-store')
const {Device} = require('../signal/Device')

class Store {
    constructor() {
        this.store = new ElectronStore({
            schema: {
                upstreamDevice: {
                    type: 'object',
                    default: new Device({})
                },
                displays: {
                    type: 'array',
                    default: [null, null, null, null]
                }
            }
        })
    }
    setUpstreamDevice(device) {
        this.store.set('upstreamDevice', device)
    }
    getUpstreamDevice() {
        return this.store.get('upstreamDevice')
    }
    setDisplays(displays) {
        this.store.set('displays', displays)
    }
    getDisplays() {
        return this.store.get('displays')
    }
}

module.exports = {
    Store
}