const {BrowserWindow} = require('electron')
const path = require('path')
let win

function getInstance() {
    if (!win) {
        win = new BrowserWindow({
            // show: false,
            center: true,
            width: 900,
            height: 600,
            minWidth: 800,
            minHeight: 600,
            resizable: false,
            maximizable: false,
            webPreferences: {
                nodeIntegration: true
            }
        })
        win.loadFile(path.resolve(__dirname, 'setting.html'))
        // win.webContents.openDevTools()
        win.on('closed', () => {
            win = null
        })
    }
    return win
}

module.exports = {
    getInstance
}