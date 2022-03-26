import os from 'os'
import cp from 'child_process'
import AutoLaunch from 'auto-launch'

let nicNum = 0

function monitNetwork() {
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
    await global.appState.state.local?.updateHostInfo()

    global.appState.event.emit('global.nic:changed', {
      hostInfo: global.appState.state.local
    })
    global.appState.event.emit('global.state.local:updated', {
      device: global.appState.state.local
    })
  }
}
function enableAutoBoot() {
  if (!process.argv.includes('--dev')) {
    if (global.appState.platform.windows) {
      // run as administrator can not auto launch
      _winEnableAutoLaunch() 
    } else {
      let autoLaunch = new AutoLaunch({
        name: global.appState.name,
        path: global.appState.exePath
      })
      autoLaunch.enable()
    }
  }
}
function disableAutoBoot() {
  if (!process.argv.includes('--dev')) {
    if (global.appState.platform.windows) {
      // run as administrator can not auto launchs
      _winDisableAutoLaunch()
    } else {
      let autoLaunch = new AutoLaunch({
        name: global.appState.name,
        path: global.appState.exePath
      })
      autoLaunch.disable()  
    }
  }
}
function _winEnableAutoLaunch() { // require administrator privilege
  cp.exec(`reg query HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v ${global.appState.name}`, function(err, stdout, stderr) {
    if (err) {
      cp.exec(`reg add HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v ${global.appState.name} /t reg_sz /d ${global.appState.exePath} /f`)
    }
  })
  cp.exec(`reg query HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run /v ${global.appState.name}`, function(err, stdout, stderr) {
    if (err) {
      cp.exec(`reg add HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run /v ${global.appState.name} /t reg_sz /d ${global.appState.exePath} /f`)
    }
  })
}
function _winDisableAutoLaunch() { // require administrator privilege
  cp.exec(`reg query HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v ${global.appState.name}`, function(err, stdout, stderr) {
    if (!err) {
      cp.exec(`reg delete HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\ /v ${global.appState.name} /f`)
    }
  })
  cp.exec(`reg query HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run /v ${global.appState.name}`, function(err, stdout, stderr) {
    if (!err) {
  cp.exec(`reg delete HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run\ /v ${global.appState.name} /f`)
    }
  })
}

export {
  monitNetwork,
  enableAutoBoot,
  disableAutoBoot
}