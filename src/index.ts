import { app } from 'electron'
import core from './core/core'
import path from 'path'

declare global {
  namespace NodeJS {
    interface Global {
      manualExit: boolean
    }
  }
}
// app.commandLine.appendSwitch('disable-gpu')
// app.disableHardwareAcceleration()
if (process.platform === "linux") {
  app.commandLine.appendSwitch('--no-sandbox')
}

global.manualExit = false

const singleInstanceLock = app.requestSingleInstanceLock()

if (!singleInstanceLock) {
  global.manualExit = true
  app.quit()
} else {
  app.whenReady().then(async () => {
    // app.getPath('exe')
    await core.bootstrap(path.resolve(__dirname, '../'))
  })
}
// prevent window closed causes app quit
app.on('window-all-closed', (event: any) => {
  event.preventDefault()
})
app.on('will-quit', (event) => {
  if (!global.manualExit) {
    event.preventDefault()
  }
  core.destroy()
})