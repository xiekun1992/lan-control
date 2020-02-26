const {
    app,
    BrowserWindow,
    ipcMain
} = require('electron')
const udpCluster = require('./cluster')

app.disableHardwareAcceleration() // BrowserWindow transparent: true和frame: false时导致cpu飙升问题，使用此代码解决
app.on('ready', () => {
    createWindow()
    // start udp server with cluster
    udpCluster.start({
        slaveNum: 6
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

ipcMain.on('a', (event, {x, y}) => {
    console.log(x, y)
})

function createWindow() {
    const win = new BrowserWindow({
        show: false,
        hasShadow: false,
        alwaysOnTop: true,
        enableLargerThanScreen: true,
        movable: false,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: true
        }
    })
    win.setBounds({ x: -10, y: -100, width: 2000, height: 1600 })
    win.setOpacity(0.01)
    win.setResizable(false)
    win.loadFile(`${__dirname}/index.html`)
    win.show()
    // win.webContents.openDevTools()
}