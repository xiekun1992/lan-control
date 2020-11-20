const { app } = require('electron')
const os = require('os')

global.linux = os.platform() === 'linux'

const AutoLaunch = require('auto-launch')
const discover = require('./src/discover/discover')
const clipboardNet = require('./src/clipboard/clipboard')
const tray = require('./src/tray/tray')
const replay = require('./src/replay/replay')
const store = require('./src/store/store')
const capture = require('./src/capture/capture')
const { connectDevice } = require('./src/setting/utils')
const { getHostInfo } = require('./src/discover/utils')

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
    // run as administrator can not auto launch, use schedule tasks instead
    if (os.platform() === 'win32' && !process.argv.includes('--dev')) {
      const { exec } = require('child_process')
      const path = require('path')
      // __dirname will be app.asar path after install
      exec(`schtasks /create /f /tn "lan control auto start" /tr ${path.join(__dirname, '../../lan_control.exe')} /sc onlogon /rl highest`)
    }
  
    const config = store.get()
    if (config) {
      if (config.remote) {
        getHostInfo().then((thisDevice) => {
          connectDevice(config.remote.if, config.position, thisDevice).then(({statusCode}) => {
            if (statusCode === 201) {
              global.device.remotes.push(config.remote)
              global.device.remote = config.remote
              capture.setConnectionPeer(global.device.remote.if, config.position)
              capture.startCapture()
        
              clipboardNet.capture()
            }
          })
        })

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