const transparentWindow = require('@xiekun1992/node-addon-transparent-window')

let initialized = false

module.exports = {
  createWindow (callback) {
    if (!initialized) {
      initialized = true
      transparentWindow.create(function() {
        callback && callback()
        transparentWindow.topmost()
      })
    }
  },
  hide() {
    initialized = false
    transparentWindow.close()
  }
}