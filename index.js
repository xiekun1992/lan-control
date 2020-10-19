const { app } = require('electron')
const os = require('os')
const AutoLaunch = require('auto-launch')
const discover = require('./src/discover/discover')
const capture = require('./src/capture/capture')
const clipboardNet = require('./src/clipboard/clipboard')
const tray = require('./src/tray/tray')
const replay = require('./src/replay/replay')

global.device = {
  remote: null,
  local: null
}
global.linux = os.platform() === 'linux'

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
  discover.event.on('discover', ({ devices, newDevice, thisDevice }) => {
    global.device.remote = devices[0]
    global.device.local = thisDevice
    // tray.updateMenu(global.device.local)
    // tray.updateMenu(global.device.remote)
    
    if (!global.linux) {
      console.log(devices, newDevice, thisDevice)
      capture.setConnectionPeer(devices[0].if)
      capture.startCapture('right')
    }
    clipboardNet.start()
    clipboardNet.capture()
  })
})