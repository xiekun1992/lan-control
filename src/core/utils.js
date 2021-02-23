const os = require('os')
const AutoLaunch = require('auto-launch')
const cp = require('child_process')

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
    await global.appState.state.local.updateHostInfo()

    global.appState.event.emit('global.nic:changed', {
      hostInfo: global.appState.state.local
    })
    global.appState.event.emit('', {
      device: global.appState.state.local
    })
  }
}
function enableAutoBoot() {
  let autoLaunch = new AutoLaunch({
    name: global.appState.name,
    path: global.appState.path
  })
  autoLaunch.enable()
  // run as administrator can not auto launch, use schedule tasks instead
  _winEnableAutoLaunch() 
}
function disableAutoBoot() {
  let autoLaunch = new AutoLaunch({
    name: global.appState.name,
    path: global.appState.path
  })
  autoLaunch.disable()
  // run as administrator can not auto launch, use schedule tasks instead
  _winDisableAutoLaunch()
}
function _winEnableAutoLaunch() {
  if (global.appState.platform.windows && !process.argv.includes('--dev')) {
    //  const { exec } = require('child_process')
    //  const path = require('path')
    //  // __dirname will be app.asar path after install
    //  exec(`schtasks /create /f /tn "lan control auto start" /tr ${path.join(__dirname, '../../lan_control.exe')} /sc onlogon /rl highest`)
    cp.exec(`reg query HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v ${global.appState.name}`, function(err, stdout, stderr) {
      if (err) {
        cp.exec(`reg add HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v ${global.appState.name} /t reg_sz /d ${global.appState.path} /f`)
      }
    })
    cp.exec(`reg query HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run /v ${global.appState.name}`, function(err, stdout, stderr) {
      if (err) {
        cp.exec(`reg add HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run /v ${global.appState.name} /t reg_sz /d ${global.appState.path} /f`)
      }
    })
  }
}
function _winDisableAutoLaunch() {
  if (global.appState.platform.windows && !process.argv.includes('--dev')) {
    //  const { exec } = require('child_process')
    //  const path = require('path')
    //  // __dirname will be app.asar path after install
    //  exec(`schtasks /create /f /tn "lan control auto start" /tr ${path.join(__dirname, '../../lan_control.exe')} /sc onlogon /rl highest`)
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
}

module.exports = {
  monitNetwork,
  enableAutoBoot,
  disableAutoBoot
}