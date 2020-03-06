const ElectronStore = require('electron-store')

class Store {
    constructor() {
        this.store = new ElectronStore({
            schema: {
                upstreamDevice: {
                    type: 'object',
                    default: {
                        type: '', 
                        name: '',
                        os: '',
                        resolution: '',
                        IP: ''
                    }
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
    setDisplays() {
        this.store.set('displays', device)
    }
    getDisplays() {
        return this.store.get('displays')
    }
}

module.exports = {
    Store
}