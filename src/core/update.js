const { dialog } = require('electron')
const { autoUpdater } = require('electron-updater')

function checkForUpdate(updateURL) {
  // https://www.electron.build/auto-update
  autoUpdater.setFeedURL(updateURL)
  autoUpdater.on('checking-for-update', () => {
    // dialog.showMessageBox({
    //   message: '正在检查更新...'
    // })
  })
  autoUpdater.on('update-available', (info) => {
    // dialog.showMessageBox({
    //   title: '自动更新',
    //   message: `发现新版本:${info.version}`
    // })
  })
  autoUpdater.on('update-not-available', (info) => {
    // dialog.showMessageBox({
    //   message: 'update-not-available'
    // })
  })
  autoUpdater.on('download-progress', (progress, bytesPerSecond, percent, total, transferred) => {
    // dialog.showMessageBox({
    //   message: 'download-progress'
    // })
  })
  autoUpdater.on('update-downloaded', (info) => {
    const dialogOpts = {
      type: 'info',
      buttons: ['是', '否'],
      title: '自动更新',
      message: `${global.appState.name} ${info.version}已经下载完毕，是否更新？`
    }
    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
  })
  autoUpdater.on('error', (msg) => {
    // dialog.showMessageBox({
    //   message: `error: ${msg}`
    // })
  })
  autoUpdater.checkForUpdates()
}


module.exports = {
  checkForUpdate
}