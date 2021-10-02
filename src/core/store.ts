import path from 'path'
import fs from 'fs'
import { Device } from './states/Device';
// import { Config, Device } from '../../types'

class Store {
  defaultConfig: LAN.Config;
  storePath: string = '';

  constructor(dir: string, filename: string) {
    this.defaultConfig = {
      autoBoot: true,
      position: '',
      remote: new Device()
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
  set(content: LAN.Config): void {
    const existedConfig: LAN.Config = this.get()
    if (existedConfig) {
      if ('autoBoot' in content) {
        existedConfig.autoBoot = !!content.autoBoot
      }
      existedConfig.position = content.position || existedConfig.position
      existedConfig.remote = content.remote || existedConfig.remote
    }
    fs.writeFileSync(this.storePath, JSON.stringify(existedConfig, null, 2))
  }
  get(): LAN.Config {
    try {
      return JSON.parse(fs.readFileSync(this.storePath).toString()) || this.defaultConfig
    } catch(e) {
      console.log('store.getItem fail')
      return  this.defaultConfig
    }
  }
  clear(): void {
    this.set(this.defaultConfig)
  }
}

export {
  Store
}