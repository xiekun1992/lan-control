const {
    BrowserWindow,
} = require('electron')
const path = require('path')

let win
class Overlay {
    static getInstance() {
        if (!win) {
            win = new BrowserWindow({
                x: -9999,
                y: -9999,
                width: 10,
                height: 10,
                show: false,
                hasShadow: false,
                // alwaysOnTop: true,
                enableLargerThanScreen: true,
                movable: false,
                skipTaskbar: true,
                webPreferences: {
                    nodeIntegration: true
                }
            })
            win.loadFile(path.join(__dirname, 'overlay.html'))
            win.on('closed', () => {
                win = null
            })
        }
        return Overlay
    }
    static show() {
        if (!win) {
            Overlay.getInstance()
        }
        win.show()
        win.setOpacity(0.01)
        win.setBounds({ x: -10, y: -100, width: 2000, height: 1600 })
        win.setResizable(false)
        return Overlay
    }
    static hide() {
        if (!win) {
            Overlay.getInstance()
        }
        win.hide()
        return Overlay
    }
}
module.exports = {
    Overlay
}