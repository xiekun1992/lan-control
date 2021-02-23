const {
  Tray,
  app,
  Menu,
  MenuItem
} = require('electron')
const path = require('path')

let tray, contextMenu
const autoBoot = global.appState.autoBoot

function init() {
  contextMenu = Menu.buildFromTemplate([
    { 
      id: 2,  label: '开机自启', type: 'checkbox', checked: autoBoot, click(menuItem, browserWindow, event) {
        global.appState.event.emit('global.store:update', {
          autoBoot: !!menuItem.checked
        })
      } 
    },
    { 
      id: 1,  label: '互联设置', click() {
        global.appState.modules.setting.show()
      } 
    },
    { 
      id: 0,  label: '退出', click() {
        global.manualExit = true
        app.quit()
      } 
    }
  ])

  const iconName = global.linux? '64x64.png': 'app.ico'
  tray = new Tray(path.resolve(global.appState.path, `assets/${iconName}`))
  tray.setIgnoreDoubleClickEvents(true)
  tray.setToolTip(global.appState.name)
  tray.setTitle(global.appState.name)
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    global.appState.modules.setting.show()
  })
}
function updateMenu(device) {
  contextMenu.insert(0, new MenuItem({
    label: device.if
  }))
  tray.setContextMenu(contextMenu)
}


module.exports = {
  destroy() {},
  init,
  updateMenu
}