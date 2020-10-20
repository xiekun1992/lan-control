const {
  Tray,
  app,
  Menu,
  MenuItem
} = require('electron')
const path = require('path')
const setting = require('../setting/setting')

let tray
const contextMenu = Menu.buildFromTemplate([
  { 
    id: 1,  label: '设置', click() {
      setting.show()
    } 
  },
  { 
    id: 0,  label: '退出', click() {
      app.exit()
      // app.quit()
    } 
  }
])
module.exports = {
  initTray() {
    setting.startServer()

    tray = new Tray(path.resolve(__dirname, '../../assets/lan_control.png'))
    tray.setIgnoreDoubleClickEvents(true)
    tray.setToolTip('lan control')
    tray.setTitle('lan control')
    tray.setContextMenu(contextMenu)
  },
  updateMenu(device) {
    contextMenu.insert(0, new MenuItem({
      label: device.if
    }))
    tray.setContextMenu(contextMenu)
  }
}