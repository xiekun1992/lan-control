import fs from 'fs'
import path from 'path'
import { monitNetwork, enableAutoBoot, disableAutoBoot } from './utils'
import { checkForUpdate } from './update'
import { AppState } from './states/AppState'
import { State } from './states/State'
import { Device } from './states/Device'
import { Config } from './store'


declare global {
  namespace NodeJS {
    interface Global {
      appState: AppState
    }
  }
}
const modulesPath = 'src_build/modules'

async function bootstrap(launchPath: string) {
  const appState = new AppState(launchPath)
  global.appState = appState
  
  checkForUpdate(appState.updateURL)

  await appState.state.local?.updateHostInfo()
  
  registerModules(launchPath)
  // register global events
  // device info change, including network interfaces, screen resolution
  appState.event.on('global.state.local:update', async function() {
    await appState.state.local?.updateHostInfo()
    appState.event.emit('global.state.local:updated', {
      device: appState.state.local
    })
  })
  appState.event.on('global.state:update', function(state: State) {
    appState.state.position = state.position
    appState.state.remote = state.remote
    if (appState.state.remote) {
      appState.state.remote.timestamp = Date.now()
    }
    appState.event.emit('global.state:updated', { state: appState.state })
  })
  // config file change
  appState.event.on('global.store:update', function(store: Config) {
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
      remote: appState.state.remote ?? new Device()
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
  console.log('launch application modules')
  appState.modules.forEach((module: any, key: string) => {
    // if (['tray', 'setting', 'clipboard', 'discover'].indexOf(module) === -1) continue 
    if (typeof module.init === 'function') {
      module.init()
      console.log(`${key} init`)
    } else {
      console.log(`${key}.init function not exist`)
    }
  })

  // check network interface change
  monitNetwork()
}
function registerModules(launchPath: string) {
  // register all application modules
  const modules = fs.readdirSync(path.resolve(launchPath, modulesPath))
  for (const modPath of modules) {
    // if (['tray', 'setting', 'discover', 'clipboard'].indexOf(modPath) === -1) continue
    const modIndexFile = path.resolve(launchPath, modulesPath, modPath, 'index.js')
    if (fs.existsSync(modIndexFile)) {
      global.appState.modules.set(modPath, require(modIndexFile))
    } else {
      try {
        global.appState.modules.set(modPath, require(path.resolve(launchPath, modulesPath, modPath, modPath)))
      } catch (ex: any) {
        console.log(`module entry not found`, ex.message)
      }
    }
  }
}
function destroy() {
  // destroy application modules
  for (const mod in global.appState.modules) {
    console.log(`${mod} destroy`)
    typeof global.appState.modules.get(mod).destroy === 'function'? global.appState.modules.get(mod).destroy(): console.log(`${mod}.destroy function not exist`)
  }
}

export default {
  bootstrap,
  destroy
}