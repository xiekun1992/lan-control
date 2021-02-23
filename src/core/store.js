const path = require('path')
const fs = require('fs')

class Store {
  constructor(dir, filename) {
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
    const existedConfig = this.get()
    if (existedConfig) {
      if ('autoBoot' in content) {
        existedConfig.autoBoot = !!content.autoBoot
      }
      existedConfig.position = content.position || existedConfig.position
      existedConfig.remote = content.remote || existedConfig.remote
    }
    fs.writeFileSync(this.storePath, JSON.stringify(existedConfig, null, 2))
  }
  get() {
    try {
      return JSON.parse(fs.readFileSync(this.storePath)) || this.defaultConfig
    } catch(e) {
      console.log('store.getItem fail')
      return  this.defaultConfig
    }
  }
  clear() {
    this.set(this.defaultConfig)
  }
}

module.exports = {
  Store
}