const {Tray, app, Menu, nativeImage} = require('electron')
const path = require('path')
const settingWindow = require('./setting_window')

let tray
function getInstance() {
    tray = new Tray(path.join(__dirname, 'images', 'tray.png'))
    const contextMenu = Menu.buildFromTemplate([
        {
            icon: path.resolve(__dirname, './images/tray_menux16.png'), 
            label: '设置', 
            type: 'normal', 
            click(menuItem, browserWindow, event) {
                settingWindow.getInstance().show()
            }
        },
        {
            icon: path.resolve(__dirname, './images/tray_menux16.png'),
            label: '软件更新', 
            type: 'normal', 
            click(menuItem, browserWindow, event) {
                
            }
        },
        {
            icon: path.resolve(__dirname, './images/tray_menux16.png'),
            label: '用户反馈', 
            type: 'normal', 
            click(menuItem, browserWindow, event) {

            }
        },
        {
            icon: path.resolve(__dirname, './images/tray_menux16.png'),
            label: '退出软件', 
            type: 'normal', 
            click(menuItem, browserWindow, event) {
                app.quit()
            }
        }
    ])
    tray.setToolTip('lan_control')
    tray.on('click', (event, bounds, position) => {
        settingWindow.getInstance().show()
    })
    tray.setContextMenu(contextMenu)
    return tray
}

module.exports = {
    getInstance
}