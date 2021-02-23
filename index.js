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

app.on('will-quit', (event) => {
  if (!global.manualExit) {
    event.preventDefault()
  }
  core.destroy()
})