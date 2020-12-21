const http = require('http')
const AutoLaunch = require('auto-launch')
const os = require('os')
const cp = require('child_process')

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
  console.log(global.appName, global.appPath)
  let autoLaunch = new AutoLaunch({
    name: global.appName,
    path: global.appPath
  })
  autoLaunch.enable()
  // run as administrator can not auto launch, use schedule tasks instead
  if (os.platform() === 'win32' && !process.argv.includes('--dev')) {
    //  const { exec } = require('child_process')
    //  const path = require('path')
    //  // __dirname will be app.asar path after install
    //  exec(`schtasks /create /f /tn "lan control auto start" /tr ${path.join(__dirname, '../../lan_control.exe')} /sc onlogon /rl highest`)
    cp.exec(`reg add HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v ${global.appName} /t reg_sz /d ${global.appPath} /f`)
    cp.exec(`reg add HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run /v ${global.appName} /t reg_sz /d ${global.appPath} /f`)
  }
}
function disableAutoBoot() {
  let autoLaunch = new AutoLaunch({
    name: global.appName,
    path: global.appPath
  })
  autoLaunch.disable()
  // run as administrator can not auto launch, use schedule tasks instead
  if (os.platform() === 'win32' && !process.argv.includes('--dev')) {
    cp.exec(`reg delete HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\ /v ${global.appName} /f`)
    cp.exec(`reg delete HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run\ /v ${global.appName} /f`)
  }
}

module.exports = {
  connectDevice,
  disconnectDevice,
  enableAutoBoot,
  disableAutoBoot
}