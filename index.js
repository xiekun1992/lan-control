const {
    app,
    BrowserWindow,
    // ipcMain,
    screen
} = require('electron')
const udpCluster = require('./cluster')
const client = require('./client')
let overlayWindowRef


app.disableHardwareAcceleration() // BrowserWindow transparent: true和frame: false时导致cpu飙升问题，使用此代码解决
app.on('ready', () => {
    const mainScreen = screen.getPrimaryDisplay()
    client.init({
        distIP: '127.0.0.1', 
        distPort: 8888, 
        screenWidth: mainScreen.size.width * mainScreen.scaleFactor, 
        screenHeight: mainScreen.size.height * mainScreen.scaleFactor
    })
    client.registOverlayCallback(() => {
        if (overlayWindowRef) {
            overlayWindowRef.show()
            overlayWindowRef.setOpacity(0.01)
            overlayWindowRef.setBounds({ x: -10, y: -100, width: 2000, height: 1600 })
            overlayWindowRef.setResizable(false)
        }
    })
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

function createWindow() {
    overlayWindowRef = new BrowserWindow({
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
    overlayWindowRef.loadFile(`${__dirname}/index.html`)
    // overlayWindowRef.webContents.openDevTools()
}