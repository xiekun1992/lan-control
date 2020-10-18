const {
  Tray,
  app,
  Menu,
  MenuItem
} = require('electron')
const path = require('path')

let tray
const contextMenu = Menu.buildFromTemplate([
  { id: 0,  label: 'exit', click() {
    app.quit()
  } }
])
module.exports = {
  initTray() {
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