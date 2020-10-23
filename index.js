const { app } = require('electron')
const os = require('os')

global.linux = os.platform() === 'linux'

const AutoLaunch = require('auto-launch')
const discover = require('./src/discover/discover')
const clipboardNet = require('./src/clipboard/clipboard')
const tray = require('./src/tray/tray')
const replay = require('./src/replay/replay')

global.device = {
  remotes: [], // devices found in LAN
  remote: null, // connected device
  local: null // self
}
global.manualExit = false

const singleInstanceLock = app.requestSingleInstanceLock()

if (!singleInstanceLock) {
  global.manualExit = true
  app.quit()
} else {
  app.whenReady().then(async () => {
    // auto startup
    let autoLaunch = new AutoLaunch({
      name: 'lan control',
      path: app.getPath('exe')
    })
    autoLaunch.isEnabled().then((isEnabled) => {
      if (!isEnabled) {
        autoLaunch.enable()
      }
    })
  
    tray.initTray()
    await replay.start()
    await discover.start()
    clipboardNet.start()
    clipboardNet.capture()
    
    discover.event.on('discover', ({ devices, newDevice, thisDevice }) => {
      global.device.remotes = devices
      global.device.local = thisDevice
      // console.log(devices, newDevice, thisDevice)
      // tray.updateMenu(global.device.local)
      // tray.updateMenu(global.device.remote)
      
      // if (!global.linux) {
      //   capture.setConnectionPeer(devices[0].if)
      //   capture.startCapture('right')
      // }
    })
  })
}


app.on('will-quit', (event) => {
  if (!global.manualExit) {
    event.preventDefault()
  }
})