import EventEmitter from 'events'

class GlobalEvent extends EventEmitter {
  constructor () {
    super()
  }
}

export {
  GlobalEvent
}