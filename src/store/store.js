const os = require('os')
const path = require('path')
const fs = require('fs')

class store {
  constructor(dir = os.homedir(), filename = '.lan_control') {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true
      })
    }
    this.storePath = path.join(dir, filename)
    if (!fs.existsSync(this.storePath)) {
      this.clear()
    }
  }
  set(content) {
    fs.writeFileSync(this.storePath, content)
  }
  get() {
    try {
      return JSON.parse(fs.readFileSync(this.storePath))
    } catch(e) {
      console.log('store.getItem fail')
      return {}
    }
  }
  clear() {
    this.set('')
  }
}

module.exports = {
  store: new store()
}