const inputAuto = require('@xiekun1992/node-addon-keyboard-auto')()
import dgram from 'dgram'
import { screen } from 'electron'
import { Position } from '../../core/enums/Position'
import { MapArea } from '../../core/states/Device'
import replay from './overlay'
const { calcEdge } = require('./utils')

class AppCapture implements LAN.AppModule {
  server: dgram.Socket = dgram.createSocket('udp4')
  initialized: boolean = false
  address: string = ''
  port: number = 8888
  shouldForward: boolean = false
  controlling: boolean = false
  mouseSet: boolean = false
  position: Position = Position.NONE // left, right
  leftmost: number = 0
  rightmost: number = 0
  // linux ubuntu with 1920x1080 resolution, the mouse movement range is 1919x1079
  screenWidthGap: number = global.appState.platform.linux? 1: 0
  screenHeightGap: number = global.appState.platform.linux? 1: 0
  mapArea: MapArea = new MapArea()
  isMouseDown: boolean = false // 鼠标按下的时候不进行转发操作

  private _captureInput() {
    // 需要以管理员权限运行不然任务管理器获得焦点后会阻塞消息循环
    inputAuto.event.on('mousemove', (event: any) => {
      // console.log(event)
      // console.log(this.position, '----')
      this._checkInsideValidRange(event)
    
      this._send({
        type: 'mousemove',
        x: event.x - this.mapArea.left,
        y: event.y - this.mapArea.top
      })
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
      const char = inputAuto.keycodeToChar(event.vkCode)
      // console.log(event, char)
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
      
      replay.createWindow(() => {
        setTimeout(() => {
          setTimeout(() => {
            this.shouldForward = true
            this.mouseSet = true
            if (this.shouldForward) {
              inputAuto.setBlock(true)
            } else {
              inputAuto.setBlock(false)
            }
          }, 10)
          if (this.position === Position.LEFT) {
            inputAuto.mousemove(this.mapArea.right - 2, event.y)
          } else if (this.position === Position.RIGHT) {
            inputAuto.mousemove(this.mapArea.left + 2, event.y)// 鼠标位置设置有问题
          }
        }, 100)
      })
    } else if (this.controlling && this.mouseSet) {
      if (event.x >= this.mapArea.left && event.x <= this.mapArea.right && event.y >= this.mapArea.top && event.y <= this.mapArea.bottom) {
        this.shouldForward = true
      } else if (event.x > this.mapArea.right) {
        if (this.position === Position.LEFT) {
          this.controlling = false
          this.shouldForward = false
          replay.hide()
          inputAuto.mousemove(this.leftmost + 2, event.y)
          this.mouseSet = false
        } else {
          this.shouldForward = true
          inputAuto.mousemove(this.mapArea.right, event.y)
        }
      } else if (event.x < this.mapArea.left) {
        if (this.position === Position.RIGHT) {
          this.controlling = false
          this.shouldForward = false
          replay.hide()
          inputAuto.mousemove(this.rightmost - 2, event.y)
          this.mouseSet = false
        } else {
          this.shouldForward = true
          inputAuto.mousemove(this.mapArea.left, event.y)
        }
      } else if (event.y > this.mapArea.bottom) {
        this.shouldForward = true
        inputAuto.mousemove(event.x, this.mapArea.bottom)
      } else if (event.y < this.mapArea.top) {
        this.shouldForward = true
        inputAuto.mousemove(event.x, this.mapArea.top)
      } else {
        // shouldForward = false
      }
      if (this.shouldForward) {
        inputAuto.setBlock(true)
      } else {
        inputAuto.setBlock(false)
      }
    }
  }

  private _send(msg: Object) {
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
    // console.log(this.position)
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
      if (remote?.disabled) {
        replay.hide()
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