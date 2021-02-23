const EventEmitter = require('events')

class GlobalEvent extends EventEmitter {
  constructor () {
    super()
  }
}

module.exports = {
  GlobalEvent
}