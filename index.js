const {
    app,
    BrowserWindow,
    ipcMain,
    screen
} = require('electron')
const {Store} = require('./store')
const tray = require('./ui/tray')
const overlayWindow = require('./ui/overlay_window').Overlay

const udpCluster = require('./cluster')
const client = require('./client')
const signal = require('./signal').Signal
const store = new Store()
let displays = [null, null, null, null] // 左上右下
let upstreamDevice

function initClient(displays) {
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
}

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
    store.setDisplays(displays)
    initClient(displays)
    signal.getInstance().addDownstream(device)
})

app.disableHardwareAcceleration() // BrowserWindow transparent: true和frame: false时导致cpu飙升问题，使用此代码解决
app.on('ready', () => {
    signal.getInstance().on('upstream.set', ({device}) => {
        upstreamDevice = device
        console.log('upstreamDevice', device)
        if (upstreamDevice) {
            store.setUpstreamDevice(upstreamDevice)
            // 启动nodejs udp服务集群处理用户动作
            udpCluster.start({
                slaveNum: 6
            })
        }
    })
    signal.getInstance().on('connection.restore', ({upstreamIP}) => {
        if (upstreamDevice && upstreamDevice.IP == upstreamIP) {
            console.log('connection restored from: ', upstreamIP)
            udpCluster.start({
                slaveNum: 6
            })
        }
    })
    upstreamDevice = store.getUpstreamDevice()
    displays = store.getDisplays()
    console.log('upstreamDevice', upstreamDevice)
    // 初始化托盘
    tray.getInstance()
    signal.getInstance().start()
    overlayWindow.getInstance()
    // 自动连接每个下游设备
    displays.forEach(downstreamDevice => {
        if (downstreamDevice) {
            signal.getInstance().wakeupDownstream(downstreamDevice)
        }
    })
    initClient(displays)
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