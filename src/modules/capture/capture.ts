const inputAuto = require('@xiekun1992/node-addon-keyboard-auto')()
import dgram from 'dgram'
import { screen } from 'electron'
import { Position } from '../../core/enums/Position'
import { MapArea } from '../../core/states/Device'
import replay from './replay'
const { calcEdge } = require('./utils')

class AppCapture implements LAN.AppModule {
  server: dgram.Socket = dgram.createSocket('udp4')
  initialized: boolean = false
  address: string = ''
  port: number = 8888
  shouldForward: boolean = false
  controlling: boolean = false
  position: Position = Position.NONE // left, right
  leftmost: number = 0
  rightmost: number = 0
  // linux ubuntu with 1920x1080 resolution, the mouse movement range is 1919x1079
  screenWidthGap: number = global.appState.platform.linux? 1: 0
  screenHeightGap: number = global.appState.platform.linux? 1: 0
  mapArea: MapArea = new MapArea()
  isMouseDown: boolean = false // 鼠标按下的时候不进行转发操作
  remoteMousePos = { x: 0, y: 0 }

  private _captureInput() {
    // 需要以管理员权限运行不然任务管理器获得焦点后会阻塞消息循环
    inputAuto.event.on('mousemove', (event: any) => {
      // console.log(event)
      // console.log(this.position, '----')
      if (!this.controlling) {
        this._checkInsideValidRange(event)
      }
    })
    inputAuto.event.on('mousedown', (event: any) => {
      this.isMouseDown = true
      this._send({
        type: 'mousedown',
        button: event.button
      })
    })
    inputAuto.event.on('mouseup', (event: any) => {
      this.isMouseDown = false
      this._send({
        type: 'mouseup',
        button: event.button
      })
    })
    inputAuto.event.on('mousewheel', (event: any) => {
      this._send({
        type: 'mousewheel',
        direction: event.direction
      })
    })
    inputAuto.event.on('keydown', (event: any) => {
      // console.log(event)
      const char = inputAuto.keycodeToChar(event.vkCode)
      this._send({
        type: 'keydown',
        char
      })
    })
    inputAuto.event.on('keyup', (event: any) => {
      const char = inputAuto.keycodeToChar(event.vkCode)
      this._send({
        type: 'keyup',
        char
      })
    })
    inputAuto.event.on('mousemoverel', ({ x, y }) => {
      if (!this.controlling) return
      if (x > 1024 || y > 1024) {
        return
      }
      this.remoteMousePos.x += x
      this.remoteMousePos.y += y

      if (this.remoteMousePos.y < this.mapArea.top) {
        this.remoteMousePos.y = this.mapArea.top
      }
      if (this.remoteMousePos.y > this.mapArea.bottom) {
        this.remoteMousePos.y = this.mapArea.bottom
      }
      if (this.position === Position.RIGHT && this.remoteMousePos.x > this.mapArea.right) {
        this.remoteMousePos.x = this.mapArea.right
      }
      
      // console.log('rel', x, y, this.remoteMousePos, this.position, this.mapArea.left)

      // 从左|右侧屏幕移动回来
      if (
        // (this.position === Position.LEFT && this.remoteMousePos.x > this.mapArea.right) || 
       (this.position === Position.RIGHT && this.remoteMousePos.x < this.mapArea.left)
      ) {
        this.controlling = false
        this.shouldForward = false
        inputAuto.setBlock(this.shouldForward)
      }
      
      this._send({
        type: 'mousemove',
        x: this.remoteMousePos.x - this.mapArea.left,
        y: this.remoteMousePos.y - this.mapArea.top
      })
    })
  }

  private _checkInsideValidRange(event: any) {
    // console.log(this.position)
    if (!this.position) {
      return
    }
    if (
      !this.isMouseDown &&
      !this.controlling && (
        (event.x >= this.rightmost && this.position === Position.RIGHT) ||
        (event.x <= this.leftmost && this.position === Position.LEFT)
      )
    ) {
      // console.log(mapArea)
      this.controlling = true
      this.shouldForward = true

      inputAuto.setBlock(this.shouldForward)

      if (this.position === Position.LEFT) {
        this.remoteMousePos.x = this.mapArea.right - 2
        this.remoteMousePos.y = event.y

        this._send({
          type: 'mousemove',
          x: this.remoteMousePos.x - this.mapArea.left,
          y: this.remoteMousePos.y - this.mapArea.top
        })
      } else if (this.position === Position.RIGHT) {
        this.remoteMousePos.x = this.mapArea.left + 2
        this.remoteMousePos.y = event.y

        this._send({
          type: 'mousemove',
          x: this.remoteMousePos.x - this.mapArea.left,
          y: this.remoteMousePos.y - this.mapArea.top
        })
      }
    }
  }

  private _send(msg: Object) {
    console.log(this.shouldForward, this.address, msg)
    if (this.shouldForward && this.address) {
      this.server.send(JSON.stringify(msg), this.port, this.address)
    }
  }

  public destroy() {
    if (this.server) {
      inputAuto.release()
      this.server.close(() => {})
    }
  }
  /**
   * set remote ip and relative position
   * @param {string} targetAddress ip address, eg: 192.168.1.1
   * @param {string} devicePosition relative position, eg: left or right
   */
  public setConnectionPeer(targetAddress: string, devicePosition: Position) {
    this.address = targetAddress
    this.position = devicePosition
  }

  public init() {
    this._captureInput()
    this.mapArea.init()
    // sync clipboard content
    global.appState.modules.get('clipboard').sync()
    if (!this.initialized) {
      this.initialized = true
      
      const edge = calcEdge()
      this.leftmost = edge.leftmost
      this.rightmost = edge.rightmost - this.screenWidthGap
      
      inputAuto.init() // todo: cause linux cpu too much overhead
    }
    global.appState.event.on('global.state.remotes:updated', async ({ devices, newDevice, thisDevice }) => {
      const { remote } = global.appState.state
      if (!remote || remote?.disabled) {
        this.shouldForward = false
        this.controlling = false
        inputAuto.setBlock(false)
        replay.relaseActions() // 释放按下操作，避免不停重复按键
      }
    })
  }
}
// closeCapture() {
//   if (initialized) {
//     initialized = false
//     inputAuto.release()
//   }
// }
export default new AppCapture()