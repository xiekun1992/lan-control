const { app } = require('electron')

const core = require('./src/core/core')

global.manualExit = false

const singleInstanceLock = app.requestSingleInstanceLock()

if (!singleInstanceLock) {
  global.manualExit = true
  app.quit()
} else {
  app.whenReady().then(async () => {
    // app.getPath('exe')
    await core.bootstrap(__dirname)
  })
}
// prevent window closed causes app quit
app.on('window-all-closed', (event) => {
  event.preventDefault()
})
app.on('will-quit', (event) => {
  if (!global.manualExit) {
    event.preventDefault()
  }
  core.destroy()
})