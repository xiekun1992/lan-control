const {
    app,
    BrowserWindow,
    ipcMain
} = require('electron')

app.disableHardwareAcceleration() // BrowserWindow transparent: true和frame: false时导致cpu飙升问题，使用此代码解决
app.on('ready', () => {
    createWindow()
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

// ipcMain.on('a', (event, {x, y}) => {
//     console.log(x, y)
// })

function createWindow() {
    const win = new BrowserWindow({
        // x: -100,
        // y: -100,
        // width: 0,
        // height: 0,
        show: false,
        // center: true,
        hasShadow: false,
        alwaysOnTop: true,
        // fullscreen: true,
        // transparent: true,
        // backgroundColor: '#33000000',
        // frame: false,
        // resizable: false,
        // focusable: false,
        enableLargerThanScreen: true,
        movable: false,
        skipTaskbar: true,
        // webPreferences: {
        //     nodeIntegeration: true
        // }
    })
    // win.webContents.on('dom-ready', (event)=> {
    //     let css = '* { cursor: none !important; }';
    //     win.webContents.insertCSS(css);
    // });
    // win.loadFile('index.html')
    win.setBounds({ x: -10, y: -100, width: 2000, height: 1600 })
    win.setOpacity(0.01)
    win.setResizable(false)
    win.loadURL(`file://${__dirname}/index.html`)
    win.show()
    // win.webContents.openDevTools()
}