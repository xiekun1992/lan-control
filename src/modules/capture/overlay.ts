const transparentWindow = require('@xiekun1992/node-addon-transparent-window')

class Overlay {
  initialized: boolean = false

  constructor() {}
  createWindow (callback: Function) {
    if (!this.initialized) {
      this.initialized = true
      transparentWindow.create(function() {
        callback && callback()
        transparentWindow.topmost()
      })
    }
  }
  hide() {
    this.initialized = false
    transparentWindow.close()
  }
}

export default new Overlay()