const os = require('os')
const path = require('path')
const fs = require('fs')

class store {
  constructor(dir = os.homedir(), filename = '.lan_control') {
    this.defaultConfig = {
      autoBoot: true,
      position: null,
      remote: null
    }
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
    const existedConfig = this.get() || this.defaultConfig
    if (existedConfig) {
      existedConfig.autoBoot = !!content.autoBoot || existedConfig.autoBoot
      existedConfig.position = content.position || existedConfig.position
      existedConfig.remote = content.remote || existedConfig.remote
    }
    fs.writeFileSync(this.storePath, JSON.stringify(existedConfig, null, 2))
  }
  get() {
    try {
      return JSON.parse(fs.readFileSync(this.storePath))
    } catch(e) {
      console.log('store.getItem fail')
      return null
    }
  }
  clear() {
    this.set(this.defaultConfig)
  }
}

module.exports = new store()