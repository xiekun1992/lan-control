const { app } = require('electron')
const os = require('os')

global.linux = os.platform() === 'linux'
global.appName = require('./package.json').name.replace(/_/ig, ' ')
global.appPath = app.getPath('exe')

const discover = require('./src/discover/discover')
const clipboardNet = require('./src/clipboard/clipboard')
const tray = require('./src/tray/tray')
const replay = require('./src/replay/replay')
const store = require('./src/store/store')
const capture = require('./src/capture/capture')
const { connectDevice, enableAutoBoot } = require('./src/setting/utils')
const { getHostInfo } = require('./src/discover/utils')

global.device = {
  isController: false,
  remotes: [], // devices found in LAN
  remote: null, // connected device
  position: null,
  local: null, // self
  addToRemotes(newDevice) {
    const newDeviceKey = this.getDeviceUniqueId(newDevice)
    for (const dev of this.remotes) {
      if (newDeviceKey === this.getDeviceUniqueId(dev)) {
        return false
      }
    }
    this.remotes.push(newDevice)
    return true
  },
  getDeviceUniqueId(device) {
    return device.uuid
  }
}
global.manualExit = false

const singleInstanceLock = app.requestSingleInstanceLock()

if (!singleInstanceLock) {
  global.manualExit = true
  app.quit()
} else {
  app.whenReady().then(async () => {
    // auto startup
    enableAutoBoot()
  
    const config = store.get()
    if (config) {
      if (config.remote) {
        const thisDevice = await getHostInfo()
        try {
          const { statusCode } = await connectDevice(config.remote.if, config.position, thisDevice)
          if (statusCode === 201) {
            global.device.addToRemotes(config.remote)
            global.device.isController = true
            global.device.remote = config.remote
            global.device.position = config.position
            capture.setConnectionPeer(global.device.remote.if, config.position)
            capture.startCapture()
      
            clipboardNet.capture()
          }
        } catch (ex) {
          console.log('restore connection error', ex)
        }
      }
    }

    tray.initTray()
    await replay.start()
    await discover.start()
    clipboardNet.start()
    // clipboardNet.capture()
    
    discover.event.on('discover', ({ devices, newDevice, thisDevice }) => {
      global.device.remotes = devices
      global.device.local = thisDevice
    })
  })
}


app.on('will-quit', (event) => {
  if (!global.manualExit) {
    event.preventDefault()
  }
})