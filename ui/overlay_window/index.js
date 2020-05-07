const {
    BrowserWindow,
    ipcMain
} = require('electron')
const path = require('path')

let win
const taskQueue = []
class Overlay {
    static getInstance() {
        if (!win) {
            switch (process.platform) {
                case 'win32': 
                    win = new BrowserWindow({
                        // x: -9999,
                        // y: -9999,
                        // width: 10,
                        // height: 10,
                        show: false,
                        hasShadow: false,
                        autoHideMenuBar: true,
                        frame: false,
                        // alwaysOnTop: true,
                        // fullscreen: true,
                        enableLargerThanScreen: true,
                        movable: false,
                        skipTaskbar: true,
                        webPreferences: {
                            nodeIntegration: true
                        }
                    })
                    break;
                case 'linux':
                    win = new BrowserWindow({
                        show: false,
                        hasShadow: false,
                        alwaysOnTop: true,
                        enableLargerThanScreen: true,
                        movable: false,
                        transparent: true,
                        fullscreen: true,
                        backgroundColor: '#00ffffff',
                        frame: false,
                        skipTaskbar: true,
                        webPreferences: {
                            nodeIntegration: true
                        }
                    })
                    break
            }
            win.loadFile(path.join(__dirname, 'overlay.html'))
            // win.webContents.openDevTools()
            // win.once('ready-to-show', () => {
            //     console.log(taskQueue)
            //     while(taskQueue.length > 0) {
            //         const task = taskQueue.unshift()
            //         win.webContents.send(task.event, task.args)
            //     }
            // })
            win.on('show', () => {
                console.log('=======')
                win.webContents.send('overlay.displays', {displays})
            })
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
        if (process.platform == 'win32') {
            win.setOpacity(0.01)
            win.setFullScreen(true)
            // win.setBounds({ x: -10, y: -100, width: 2000, height: 1600 })
            // win.setResizable(false)
        }
        return Overlay
    }
    static hide() {
        if (!win) {
            Overlay.getInstance()
        }
        win.hide()
        return Overlay
    }
    static updateDisplays(displays) {
        if (!win) {
            Overlay.getInstance()
        }
        if (win.isVisible()) {
            win.webContents.send('overlay.displays', {displays})
        }
    }
}
module.exports = {
    Overlay
}