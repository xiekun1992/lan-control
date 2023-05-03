import { Device } from "../../core/states/Device"

const {
  Tray,
  app,
  Menu,
  MenuItem
} = require('electron')
const path = require('path')

class AppTray implements LAN.AppModule {
  tray: LAN.Nullable<Electron.Tray>
  contextMenu: LAN.Nullable<Electron.Menu>
  autoBoot: boolean

  constructor() {
    this.autoBoot = global.appState.autoBoot
    this.tray = null
    this.contextMenu = null
  }
  init() {
    this.contextMenu = Menu.buildFromTemplate([
      { 
        id: '2',  label: '开机自启', type: 'checkbox', checked: this.autoBoot, click(menuItem, browserWindow, event) {
          global.appState.event.emit('global.store:update', {
            autoBoot: !!menuItem.checked
          })
        } 
      },
      { 
        id: '1',  label: '互联设置', click() {
          global.appState.modules.get('setting').show()
        } 
      },
      { 
        id: '0',  label: '退出', click() {
          global.manualExit = true
          app.quit()
        } 
      }
    ])
  
    const iconName = global.appState.platform.linux? '64x64.png': 'app.ico'
    this.tray = new Tray(path.resolve(global.appState.path, `assets/${iconName}`))
    this.tray!.setIgnoreDoubleClickEvents(true)
    this.tray!.setToolTip(global.appState.name)
    this.tray!.setTitle(global.appState.name)
    this.tray!.setContextMenu(this.contextMenu!)
    this.tray!.on('click', () => {
      global.appState.modules.get('setting').show()
    })
  }
  updateMenu(device: Device) {
    this.contextMenu?.insert(0, new MenuItem({
      label: device.if
    }))
    if (this.contextMenu && this.tray) {
      this.tray?.setContextMenu(this.contextMenu)
    }
  }
  destroy() {}
}

module.exports = new AppTray()