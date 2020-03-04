const {
    app,
    BrowserWindow,
    ipcMain,
    screen
} = require('electron')
const tray = require('./ui/tray')
const overlayWindow = require('./ui/overlay_window').Overlay

const udpCluster = require('./cluster')
const client = require('./client')
const signal = require('./signal').Signal
const displays = [null, null, null, null] // 左上右下
let upstreamDevice

ipcMain.handle('signal.discover', async (event, args) => {
    return new Promise((resolve, reject) => {
        signal.getInstance().once('devices.update', ({devices}) => {
            // console.log('///////////',devices)
            resolve({devices})
        })
        signal.getInstance().discover()
    })
})
ipcMain.handle('signal.display.add', async (event, {direction, device}) => {
    displays[direction] = device
    const mainScreen = screen.getPrimaryDisplay()
    client.init({
        distIP: null, 
        distPort: 8888, 
        screenWidth: mainScreen.size.width * mainScreen.scaleFactor, 
        screenHeight: mainScreen.size.height * mainScreen.scaleFactor
    })
    client.registOverlayCallback(() => {
        overlayWindow.show()
    }, () => {
        overlayWindow.hide()
    })
    client.updateDisplays(displays)
    signal.getInstance().once('upstream.set', ({device}) => {
        upstreamDevice = device
        console.log('upstreamDevice', device)
        if (upstreamDevice) {
            // 启动nodejs udp服务集群处理用户动作
            udpCluster.start({
                slaveNum: 6
            })
        }
    })
    signal.getInstance().addDownstream(device)
})

app.disableHardwareAcceleration() // BrowserWindow transparent: true和frame: false时导致cpu飙升问题，使用此代码解决
app.on('ready', () => {
    // 初始化托盘
    tray.getInstance()
    signal.getInstance().start()
    overlayWindow.getInstance()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        overlayWindow.getInstance()
    }
})