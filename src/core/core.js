const fs = require('fs')
const path = require('path')
const os = require('os')
const { app } = require('electron')

const { GlobalEvent } = require('./event')
const { State, Device } = require('./state')
const { Store } = require('./store')
const { monitNetwork, enableAutoBoot, disableAutoBoot } = require('./utils')
const { checkForUpdate } = require('./update')

async function bootstrap(launchPath) {
  global.appState = {
    name: require(path.resolve(launchPath, 'package.json')).name,
    exePath: app.getPath('exe'),
    path: launchPath,
    updateURL: 'http://home.xuexuesoft.com:5023/lan_control/download/latest/', // should be hard coded,  require(path.resolve(launchPath, 'package.json')).build.publish[0].url,
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
      newDevice.timestamp = Date.now()
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
    },
    refreshDeviceInfo(device) {
      // refresh remotes
      if (this.state.refreshDeviceInfo(device)) {
        global.appState.event.emit('global.state.remotes:updated', {
          devices: this.state.remotes,
          thisDevice: this.state.local,
          newDevice: device
        })
        return true
      }
      return false
    }
  }
  const appState = global.appState
  
  if (appState.platform.windows) {
    checkForUpdate(appState.updateURL)
  }

  await appState.state.local.updateHostInfo()
  
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
    if (appState.state.remote) {
      appState.state.remote.timestamp = Date.now()
    }
    appState.event.emit('global.state:updated', { state: appState.state })
  })
  // config file change
  appState.event.on('global.store:update', function(store) {
    if ('autoBoot' in store) {
      if (appState.autoBoot !== !!store.autoBoot) {
        appState.autoBoot = !!store.autoBoot
        appState.autoBoot? enableAutoBoot(): disableAutoBoot()
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

  appState.autoBoot? enableAutoBoot(): disableAutoBoot()

  // launch application modules
  for (const mod in appState.modules) {
    console.log(`${mod} init`)
    // if (['tray', 'setting', 'clipboard', 'discover'].indexOf(mod) === -1) continue 
    typeof appState.modules[mod].init === 'function'? appState.modules[mod].init(): console.log(`${mod}.init function not exist`)
  }

  // check network interface change
  monitNetwork()
}
function destroy() {
  // destroy application modules
  for (const mod in appState.modules) {
    console.log(`${mod} destroy`)
    typeof appState.modules[mod].destroy === 'function'? appState.modules[mod].destroy(): console.log(`${mod}.destroy function not exist`)
  }
}

module.exports = {
  bootstrap,
  destroy
}