const { BrowserWindow, screen } = require('electron')
const path = require('path')
const transparentWindow = require('@xiekun1992/node-addon-transparent-window')

let win

module.exports = {
  createWindow (callback) {
    if (global.linux) {
      transparentWindow.create(function() {
        callback && callback()
      })
      return
    }
    if (win) {
      this.show()
      // if (callback) {
      //   callback()
      // }
      return
    }
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    // console.log(width, height)
    // 创建浏览器窗口
    win = new BrowserWindow({
      show: false,
      frame: false,
      transparent: true,
      backgroundColor: 0x00ffffff,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      hasShadow: false,
      x: -10,
      y: -10,
      width: width + 40,
      height: height + 20,
      // webPreferences: {
      //   nodeIntegration: true
      // }
    })
    if (callback) {
      // callback()
      win.on('show', () => {
        callback()
      })
      win.on('ready-to-show', () => {
        win.show()
      })
    }
    // win.maximize()
    // 并且为你的应用加载index.html
    win.loadFile(path.resolve(__dirname, 'index.html'))

    // 打开开发者工具
  //   win.webContents.openDevTools()
    return win
  },
  hide() {
    if (global.linux) {
      transparentWindow.close()
      return
    }
    win.hide()
  },
  show() {
    win.show()
  }
}