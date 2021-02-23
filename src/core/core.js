const fs = require('fs')
const path = require('path')
const os = require('os')
const AutoLaunch = require('auto-launch')
const cp = require('child_process')

const { GlobalEvent } = require('./event')
const { State, Device } = require('./state')
const { Store } = require('./store')

let appState = {}, nicNum = 0

async function bootstrap(launchPath) {
  appState = {
    name: require(path.resolve(launchPath, 'package.json')).name,
    path: launchPath,
    platform: {
      linux: os.platform() === 'linux',
      windows: os.platform() === 'win32'
    },
    autoBoot: true,
    modules: {},
    state: new State(),
    event: new GlobalEvent(),
    store: new Store(os.homedir(), '.lan_control'),
    addToRemotes(newDevice) {
      const result = this.state.addToRemotes(newDevice)
      if (result) {
        appState.event.emit('global.state.remotes:updated', {
          devices: this.state.remotes,
          thisDevice: this.state.local,
          newDevice
        })
      }
      return result
    },
    findDeviceByIP(ip) {
      return this.state.findDeviceByIP(ip)
    },
    parseDevice(devStr) {
      return Device.parse(devStr)
    },
    deviceStringify(device) {
      return Device.stringify(device)
    }
  }
  await appState.state.local.updateHostInfo()
  global.appState = appState
  
  // register all application modules
  const modules = fs.readdirSync(path.resolve(launchPath, 'src/modules'))
  for (const modPath of modules) {
    // if (['tray', 'setting', 'discover', 'clipboard'].indexOf(modPath) === -1) continue
    const modIndexFile = path.resolve(launchPath, 'src/modules', modPath, 'index.js')
    if (fs.existsSync(modIndexFile)) {
      appState.modules[modPath] = require(modIndexFile)
    } else {
      try {
        appState.modules[modPath] = require(path.resolve(launchPath, 'src/modules', modPath, modPath))
      } catch (ex) {
        console.log(`module entry not found`, ex)
      }
    }
  }
  // register global events
  // device info change, including network interfaces, screen resolution
  appState.event.on('global.state.local:update', async function() {
    await appState.state.local.updateHostInfo()
    appState.event.emit('global.state.local:updated', {
      device: appState.state.local
    })
  })
  appState.event.on('global.state:update', function({ position, remote }) {
    appState.state.position = position
    appState.state.remote = remote
    appState.event.emit('global.state:updated', { state: appState.state })
  })
  // config file change
  appState.event.on('global.store:update', function(store) {
    if ('autoBoot' in store) {
      if (appState.autoBoot !== !!store.autoBoot) {
        appState.autoBoot = !!store.autoBoot
        appState.autoBoot? _enableAutoBoot(): _disableAutoBoot()
      }
    }
    if ('position' in store) {
      appState.state.position = store.position
    }
    if ('remote' in store) {
      appState.state.remote = store.remote
      appState.event.emit('global.state.remote:updated', { remote: appState.state.remote })
    }

    appState.store.set({
      autoBoot: appState.autoBoot,
      position: appState.state.position,
      remote: appState.state.remote
    })

    appState.event.emit('global.store:updated')
  })

  // restore state from config file
  const configFile = appState.store.get()
  appState.autoBoot = configFile.autoBoot
  appState.state.position = configFile.position
  if (configFile.remote) {
    appState.state.isController = true
    configFile.remote.disabled = true
  }
  appState.state.remote = configFile.remote // todo: to much extra info added

  appState.autoBoot? _enableAutoBoot(): _disableAutoBoot()

  // launch application modules
  for (const mod in appState.modules) {
    console.log(`${mod} init`)
    // if (['tray', 'setting', 'clipboard', 'discover'].indexOf(mod) === -1) continue 
    typeof appState.modules[mod].init === 'function'? appState.modules[mod].init(): console.log(`${mod}.init function not exist`)
  }

  // check network interface change
  _monitNetwork()
}
function destroy() {
  // destroy application modules
  for (const mod in appState.modules) {
    console.log(`${mod} destroy`)
    typeof appState.modules[mod].destroy === 'function'? appState.modules[mod].destroy(): console.log(`${mod}.destroy function not exist`)
  }
}

function _monitNetwork() {
  setInterval(_nicCheck, 1000)
}
async function _nicCheck() {
  const ifs = os.networkInterfaces()
  let currentNicNum = 0
  for (const name in ifs) { // count available interfaces
    if (ifs[name].some(item => item.internal === false)) {
      currentNicNum++
    }
  }
  // check if new interface available or any interface is unavailable
  if (nicNum !== currentNicNum) { // todo: only check number, same number with different ip will not work
    nicNum = currentNicNum
    // update global device info
    await appState.state.local.updateHostInfo()

    appState.event.emit('global.nic:changed', {
      hostInfo: appState.state.local
    })
    appState.event.emit('global.state.local:updated', {
      device: appState.state.local
    })
  }
}
function _enableAutoBoot() {
  let autoLaunch = new AutoLaunch({
    name: appState.name,
    path: appState.path
  })
  autoLaunch.enable()
  // run as administrator can not auto launch, use schedule tasks instead
  _winEnableAutoLaunch() 
}
function _disableAutoBoot() {
  let autoLaunch = new AutoLaunch({
    name: appState.name,
    path: appState.path
  })
  autoLaunch.disable()
  // run as administrator can not auto launch, use schedule tasks instead
  _winDisableAutoLaunch()
}
function _winEnableAutoLaunch() {
  if (appState.platform.windows && !process.argv.includes('--dev')) {
    //  const { exec } = require('child_process')
    //  const path = require('path')
    //  // __dirname will be app.asar path after install
    //  exec(`schtasks /create /f /tn "lan control auto start" /tr ${path.join(__dirname, '../../lan_control.exe')} /sc onlogon /rl highest`)
    cp.exec(`reg query HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v ${appState.name}`, function(err, stdout, stderr) {
      if (err) {
        cp.exec(`reg add HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v ${appState.name} /t reg_sz /d ${appState.path} /f`)
      }
    })
    cp.exec(`reg query HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run /v ${appState.name}`, function(err, stdout, stderr) {
      if (err) {
        cp.exec(`reg add HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run /v ${appState.name} /t reg_sz /d ${appState.path} /f`)
      }
    })
  }
}
function _winDisableAutoLaunch() {
  if (appState.platform.windows && !process.argv.includes('--dev')) {
    //  const { exec } = require('child_process')
    //  const path = require('path')
    //  // __dirname will be app.asar path after install
    //  exec(`schtasks /create /f /tn "lan control auto start" /tr ${path.join(__dirname, '../../lan_control.exe')} /sc onlogon /rl highest`)
    cp.exec(`reg query HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v ${appState.name}`, function(err, stdout, stderr) {
      if (!err) {
        cp.exec(`reg delete HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\ /v ${appState.name} /f`)
      }
    })
    cp.exec(`reg query HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run /v ${appState.name}`, function(err, stdout, stderr) {
      if (!err) {
    cp.exec(`reg delete HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run\ /v ${appState.name} /f`)
      }
    })
  }
}

module.exports = {
  bootstrap,
  destroy
}