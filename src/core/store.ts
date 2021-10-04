import path from 'path'
import fs from 'fs'
import { Position } from './enums/Position';
import { Device } from './states/Device';

export class Config {
  autoBoot: boolean = true
  position: Position = Position.NONE
  remote: LAN.Nullable<Device> = null
  constructor() {}
}

export class Store {
  defaultConfig: Config = new Config();
  storePath: string = '';

  constructor(dir: string, filename: string) {
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
  set(content: Config): void {
    let existedConfig: Config = this.get()
    existedConfig = {
      ...existedConfig,
      ...content
    }
    fs.writeFileSync(this.storePath, JSON.stringify(existedConfig, null, 2))
  }
  get(): Config {
    if (fs.existsSync(this.storePath)) {
      return JSON.parse(fs.readFileSync(this.storePath).toString()) || this.defaultConfig
    }
    return this.defaultConfig
  }
  clear(): void {
    this.set(this.defaultConfig)
  }
}