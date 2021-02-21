const http = require('http')
const AutoLaunch = require('auto-launch')
const os = require('os')
const cp = require('child_process')
let capture = require('../capture/capture')
const clipboardNet = require('../clipboard/clipboard')

function request(option) {
  return Promise.race([
    new Promise((resolve, rejects) => {
      const req = http.request(option, res => {
        res.setEncoding('utf8')
        let body = Buffer.alloc(0)
        res.on('data', chunk => {
          body = Buffer.concat([body, chunk])
        })
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body
          })
        })
      })
      req.on('error', rejects)
      req.end()
    }),
    new Promise((resolve, rejects) => {
      const timer = setTimeout(() => {
        clearTimeout(timer)
        rejects(new Error('request timeout'))
      }, 3000)
    })
  ])
}

function connectDevice(ip, position, thisDevice) {
  return request({
    method: 'POST',
    port: 2001,
    hostname: ip,
    path: `/connection?position=${encodeURIComponent(position)}&device=${encodeURIComponent(JSON.stringify(thisDevice))}`
  })
}
function disconnectDevice(ip, position, thisDevice) {
  return request({
    method: 'DELETE',
    port: 2001,
    hostname: ip,
    path: `/connection?position=${encodeURIComponent(position)}&device=${encodeURIComponent(JSON.stringify(thisDevice))}`
  })
}
function enableAutoBoot() {
  let autoLaunch = new AutoLaunch({
    name: global.appName,
    path: global.appPath
  })
  autoLaunch.enable()
  // run as administrator can not auto launch, use schedule tasks instead
  _winEnableAutoLaunch() 
}
function disableAutoBoot() {
  let autoLaunch = new AutoLaunch({
    name: global.appName,
    path: global.appPath
  })
  autoLaunch.disable()
  // run as administrator can not auto launch, use schedule tasks instead
  _winDisableAutoLaunch()
}
function _winEnableAutoLaunch() {
  if (os.platform() === 'win32' && !process.argv.includes('--dev')) {
    //  const { exec } = require('child_process')
    //  const path = require('path')
    //  // __dirname will be app.asar path after install
    //  exec(`schtasks /create /f /tn "lan control auto start" /tr ${path.join(__dirname, '../../lan_control.exe')} /sc onlogon /rl highest`)
    cp.exec(`reg query HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v ${global.appName}`, function(err, stdout, stderr) {
      if (err) {
        cp.exec(`reg add HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v ${global.appName} /t reg_sz /d ${global.appPath} /f`)
      }
    })
    cp.exec(`reg query HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run /v ${global.appName}`, function(err, stdout, stderr) {
      if (err) {
        cp.exec(`reg add HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run /v ${global.appName} /t reg_sz /d ${global.appPath} /f`)
      }
    })
  }
}
function _winDisableAutoLaunch() {
  if (os.platform() === 'win32' && !process.argv.includes('--dev')) {
    //  const { exec } = require('child_process')
    //  const path = require('path')
    //  // __dirname will be app.asar path after install
    //  exec(`schtasks /create /f /tn "lan control auto start" /tr ${path.join(__dirname, '../../lan_control.exe')} /sc onlogon /rl highest`)
    cp.exec(`reg query HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v ${global.appName}`, function(err, stdout, stderr) {
      if (!err) {
        cp.exec(`reg delete HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\ /v ${global.appName} /f`)
      }
    })
    cp.exec(`reg query HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run /v ${global.appName}`, function(err, stdout, stderr) {
      if (!err) {
    cp.exec(`reg delete HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run\ /v ${global.appName} /f`)
      }
    })
  }
}
// after set remote, keep remote shown in setting window
let keepping = false
let keepInterval
function keepRemoteShown(remote, position, thisDevice) {
  if (keepping) {
    return
  } 
  keepping = true
  keepInterval = setInterval(async () => {
    // try {
    //   const result = await connectDevice(remote.if, position, thisDevice)
    //   console.log(result)
    // } catch (ex) {
    //   // lost remote connection
      
    //   console.log('keep connection error', ex)
    // }
    try {
      const { statusCode } = await connectDevice(remote.if, position, thisDevice)
      if (statusCode === 201) {
        global.device.addToRemotes(remote)
        global.device.isController = true
        global.device.remote = remote
        global.device.position = position
        capture.setConnectionPeer(global.device.remote.if, position)
        capture.startCapture()
        clipboardNet.capture()

        cancelKeepRemoteShown()
      }
      keepRemoteShown(remote, position, thisDevice)
    } catch (ex) {
      console.log('restore connection error', ex)
    }
  }, 2000)
}
function cancelKeepRemoteShown() {
  clearInterval(keepInterval)
  keepping = false
}
module.exports = {
  connectDevice,
  disconnectDevice,
  enableAutoBoot,
  disableAutoBoot,
  keepRemoteShown,
  cancelKeepRemoteShown
}