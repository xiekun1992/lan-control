const {
  screen
} = require('electron')

module.exports = {
  calcEdge() {
    let leftmost = 0, rightmost = 0
    // primary display offset always be (0, 0)
    screen.getAllDisplays().forEach(display => {
      if (display.bounds.x >= rightmost) {
        rightmost = display.bounds.x + display.bounds.width
      }
      if (display.bounds.x <= leftmost) {
        leftmost = display.bounds.x
      }
    })
    return {
      leftmost,
      rightmost
    }
  }
}