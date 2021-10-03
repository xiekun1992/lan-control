import capture from './capture'
import replay from './replay'

module.exports = {
  init() {
    replay.init()
    capture.init()
  },
  destroy() {
    capture.destroy()
    replay.destroy()
  },
  setConnectionPeer: capture.setConnectionPeer
}