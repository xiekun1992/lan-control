const {
  Tray,
  app,
  Menu,
  MenuItem
} = require('electron')
const path = require('path')
const setting = require('../setting/setting')
const clipboardNet = require('../clipboard/clipboard')
const capture = require('../capture/capture')

let tray
const contextMenu = Menu.buildFromTemplate([
  { 
    id: 1,  label: '设置', click() {
      setting.show()
    } 
  },
  { 
    id: 0,  label: '退出', click() {
      global.manualExit = true
      clipboardNet.release()
      capture.closeCapture()
      app.exit(0)
      // app.quit()
    } 
  }
])
module.exports = {
  initTray() {
    setting.startServer()

    tray = new Tray(path.resolve(__dirname, '../../assets/app.ico'))
    tray.setIgnoreDoubleClickEvents(true)
    tray.setToolTip('lan control')
    tray.setTitle('lan control')
    tray.setContextMenu(contextMenu)
    tray.on('click', () => {
      setting.show()
    })
  },
  updateMenu(device) {
    contextMenu.insert(0, new MenuItem({
      label: device.if
    }))
    tray.setContextMenu(contextMenu)
  }
}