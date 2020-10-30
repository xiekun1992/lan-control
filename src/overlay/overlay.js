const transparentWindow = require('@xiekun1992/node-addon-transparent-window')

module.exports = {
  createWindow (callback) {
    transparentWindow.create(function() {
      callback && callback()
    })
  },
  hide() {
    transparentWindow.close()
  }
}