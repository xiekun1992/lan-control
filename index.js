const {
    app,
    BrowserWindow,
    ipcMain,
    screen
} = require('electron')
const ioHook = require('iohook');
const robotjs = require('robotjs');
const {Store} = require('./store')
const tray = require('./ui/tray')
const overlayWindow = require('./ui/overlay_window').Overlay

const udpCluster = require('./cluster')
const signal = require('./signal').Signal
const {Device} = require('./signal/Device')
const store = new Store()
// let displays = [null, null, null, null] // 左上右下
let upstreamDevice
global.displays = [null, null, null, null] // 左上右下
let shouldForward = false

ipcMain.handle('signal.discover', async (event, args) => {
    return new Promise(async (resolve, reject) => {
        const thisDevice = await Device.getCurrentDevice()
        const timer = setTimeout(() => {
            clearTimeout(timer)
            resolve({devices: [], displays: [], thisDevice})
        }, 3000)
        signal.getInstance().once('devices.update', async ({devices}) => {
            // console.log('///////////',devices)
            resolve({devices, displays: global.displays, thisDevice})
        })
        signal.getInstance().discover()
    })
})
ipcMain.handle('signal.display.add', async (event, {direction, device}) => {
    global.displays[direction] = device
    store.setDisplays(global.displays)
    upstreamDevice = {}
    store.setUpstreamDevice(upstreamDevice)

    overlayWindow.updateDisplays(global.displays)
    signal.getInstance().addDownstream(device)
})
ipcMain.handle('diaplay.remove', async (event, {deviceIP, direction}) => {
    if (displays[direction] && displays[direction].IP == deviceIP) {
        // 检测该设备是否存在多个设置
        let hasMultiConfig = 0
        for (const display of displays) {
            if (display && display.IP == deviceIP) {
                hasMultiConfig++
            }
        }
        if (hasMultiConfig == 1) {
            signal.getInstance().freeDownstream(displays[direction])
        }
        displays[direction] = null
    }
    store.setDisplays(displays)
    return true
})

app.disableHardwareAcceleration() // BrowserWindow transparent: true和frame: false时导致cpu飙升问题，使用此代码解决
app.on('ready', () => {
    upstreamDevice = new Device(store.getUpstreamDevice())
    global.displays = store.getDisplays()
    console.log('upstreamDevice', upstreamDevice)
    // main process capture mouse position to decide whether mouse move to other screen 
    const mainScreen = screen.getPrimaryDisplay()
    ipcMain.handle('overlay.hide', async (event, {y}) => {
        console.log('overlay.hide', y)
        shouldForward = false
        overlayWindow.getInstance().hide()
        const mainScreen = screen.getPrimaryDisplay()
        robotjs.moveMouse(mainScreen.size.width * mainScreen.scaleFactor - 2, y)
        return true
    })
    ioHook.on('mousemove', event => {
        console.log(mainScreen.size.width * mainScreen.scaleFactor, event.x)
        if (!shouldForward && event.x >= mainScreen.size.width * mainScreen.scaleFactor - 1) {
            shouldForward = true
            robotjs.moveMouse(2, event.y)
            overlayWindow.getInstance().show()
        }
    })
    ioHook.start()

    signal.getInstance().on('upstream.set', ({device}) => {
        upstreamDevice = device
        console.log('upstreamDevice', device)
        if (upstreamDevice) {
            store.setUpstreamDevice(upstreamDevice)
            displays = [null, null, null, null]
            store.setDisplays(displays)
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
    signal.getInstance().on('client.init', ({downstreamIP}) => {
        if (global.displays.findIndex(item => item && item.IP == downstreamIP) > -1) {
            // 自动连接每个下游设备
            global.displays.forEach(downstreamDevice => {
                if (downstreamDevice) {
                    signal.getInstance().wakeupDownstream(downstreamDevice)
                }
            })
            overlayWindow.updateDisplays(global.displays)
        }
    })
    signal.getInstance().on('udp.free', ({upstreamIP}) => {
        console.log('udp free from: ', upstreamIP)
        if (upstreamDevice && upstreamDevice.IP == upstreamIP) {
            udpCluster.stop()
        }
    })
    // 初始化托盘
    tray.getInstance()
    signal.getInstance().start()
    // overlayWindow.getInstance().show()

    if (upstreamDevice.IP) {
        signal.getInstance().notifyUpstream(upstreamDevice)
    } else {
        // 自动连接每个下游设备
        global.displays.forEach(downstreamDevice => {
            if (downstreamDevice) {
                signal.getInstance().wakeupDownstream(downstreamDevice)
            }
        })
        overlayWindow.updateDisplays(global.displays)
    }
    overlayWindow.updateDisplays(global.displays)
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