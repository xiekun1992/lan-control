const mouse = require('./mouse')
const keyboard = require('./keyborad')

class Interaction {
    constructor({x, y}) {
        this.x = x
        this.y =y
    }
    mousemove({x, y}) {
        mouse.move({x, y})
    }
    mousedown() {
        mouse.down({x, y})
    }
    mouseup() {
        mouse.up({x, y})
    }
    dblclick() {
        mouse.dblclick(button)
    }
    click(button) {
        mouse.click(button)
    }
    keydown({keyCode, ctl, alt, meta, shift}) {
        keyboard.down({keyCode, ctl, alt, meta, shift})
    }
    keyup({keyCode, ctl, alt, meta, shift}) {
        keyboard.up({keyCode, ctl, alt, meta, shift})
    }
    keypress({keyCode, ctl, alt, meta, shift}) {
        keyboard.press({keyCode, ctl, alt, meta, shift})
    }
}

module.exports = {
    Interaction
}