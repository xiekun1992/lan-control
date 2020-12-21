const {
  Tray,
  app,
  Menu,
  MenuItem
} = require('electron')
const path = require('path')
const setting = require('../setting/setting')
const { disableAutoBoot, enableAutoBoot } = require('../setting/utils')
const clipboardNet = require('../clipboard/clipboard')
const capture = require('../capture/capture')
const store = require('../store/store')

let tray
const contextMenu = Menu.buildFromTemplate([
  { 
    id: 2,  label: '开机自启', type: 'checkbox', checked: !!store.get().autoBoot, click(menuItem, browserWindow, event) {
      if (menuItem.checked) {
        enableAutoBoot()
        store.set({
          autoBoot: true
        })
      } else {
        disableAutoBoot()
        store.set({
          autoBoot: false
        })
      }
    } 
  },
  { 
    id: 1,  label: '互联设置', click() {
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
    const iconName = global.linux? '64x64.png': 'app.ico'
    tray = new Tray(path.resolve(__dirname, `../../assets/${iconName}`))
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