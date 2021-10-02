const {   
  setConnectionPeer,
  init: captureInit,
  destroy: captureDestroy
} = require('./capture')
const {
  init: replayInit,
  destroy: replayDestroy
} = require('./replay')

module.exports = {
  init() {
    replayInit()
    captureInit()
  },
  destroy() {
    captureDestroy()
    replayDestroy()
  },
  setConnectionPeer
}