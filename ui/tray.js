const {Tray, app, Menu} = require('electron')
const path = require('path')
const settingWindow = require('./setting_window')

let tray
function getInstance() {
    tray = new Tray(path.join(__dirname, 'images', 'tray.png'))
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Settings', type: 'normal', click(menuItem, browserWindow, event) {
                settingWindow.getInstance().show()
            }
        },
        {
            label: 'Exit', type: 'normal', click(menuItem, browserWindow, event) {
                app.quit()
            }
        }
    ])
    tray.setToolTip('lan_control')
    tray.setContextMenu(contextMenu)
    return tray
}

module.exports = {
    getInstance
}