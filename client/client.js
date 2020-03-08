const ioHook = require('iohook');
const robotjs = require('robotjs');
const connection = require('./connection').UDPClient;

const keymap = {
  8: 'backspace', 9: 'tab', 13: 'enter',
  16: 'shift', 17: 'control', 18: 'alt', 
  19: 'pause', 20: 'capsLock', // unknown 
  27: 'escape', 32: 'space',
  33: 'pageup', 34: 'pagedown', 35: 'end', 36: 'home', 37: 'left', 38: 'up', 
  39: 'right', 40: 'down', 44: 'printscreen', 45: 'insert', 46: 'delete',
  48: '0', 49: '1', 50: '2', 51: '3', 52: '4',
  53: '5', 54: '6', 55: '7', 56: '8', 57: '9',
  65: 'a', 66: 'b', 67: 'c', 68: 'd', 69: 'e',
  70: 'f', 71: 'g', 72: 'h', 73: 'i', 74: 'j',
  75: 'k', 76: 'l', 77: 'm', 78: 'n', 79: 'o',
  80: 'p', 81: 'q', 82: 'r', 83: 's', 84: 't',
  85: 'u', 86: 'v', 87: 'w', 88: 'x', 89: 'y',
  90: 'z', 91: 'command', 
  93: 'ContextMenu', 96: 'Numpad0', 97: 'Numpad1', 98: 'Numpad2', // unknown
  99: 'Numpad3', 100: 'Numpad4', 101: 'Numpad5', 102: 'Numpad6', 103: 'Numpad7',  // unknown
  104: 'Numpad8', 105: 'Numpad9', 106: 'NumpadMultiply', 107: 'NumpadAdd', 109: 'NumpadSubtract',  // unknown
  110: 'NumpadDecimal', 111: 'NumpadDivide',  // unknown

  112: 'f1', 113: 'f2', 114: 'f3', 115: 'f4',
  116: 'f5', 117: 'f6', 118: 'f7', 119: 'f8',
  120: 'f9', 121: 'f10', 122: 'f11', 123: 'f12',
  
  186: ';', 187: '=', 188: ',', 189: '-', 190: '.', 191: '/', 
  192: '`', 221: ']', 222: '\'', 219: '[', 
  220: '\\', 
  145: 'ScrollLock', 144: 'NumLock'
}
let x, y;
let showOverlayCallback, hideOverlayCallback
let shouldForward = false
let displayDevices = []
function init({distIP, distPort, screenWidth, screenHeight}) {
  connection.init({ip: distIP, port: distPort})
  ioHook.on('mousemove', event => {
    // console.log('mousemove', Date.now())
    // console.log(event); // { type: 'mousemove', x: 700, y: 400 }
    x = event.x;
    y = event.y;
    // console.log('mousemove', displayDevices)
    if (x > screenWidth && shouldForward == false && displayDevices[2]) { // 进入后边屏幕
      connection.setIP(displayDevices[2].IP)
      shouldForward = true
      showOverlayCallback && showOverlayCallback()
      x = 0;
      robotjs.moveMouse(x, y)
    } else if (x < 0 && shouldForward && displayDevices[2]) { // 从右边屏幕回来
      shouldForward = false
      x = screenWidth
      robotjs.moveMouse(x, y)
      hideOverlayCallback && hideOverlayCallback()
    } else if (x < 0 && shouldForward == false && displayDevices[0]) { // 进入左边屏幕
      shouldForward = true
      connection.setIP(displayDevices[0].IP)
      shouldForward = true
      showOverlayCallback && showOverlayCallback()
      x = screenWidth
      robotjs.moveMouse(x, y)
    } else if (x > screenWidth && shouldForward && displayDevices[0]) { // 从左边屏幕回来
      shouldForward = false
      x = 0
      robotjs.moveMouse(x, y)
      hideOverlayCallback && hideOverlayCallback()
    }
    send({type: 'mousemove', x: x, y: y, width: screenWidth, height: screenHeight});
  });
  ioHook.on('mousedown', event => {
    send({type: 'mousedown', button: ['', 'left', 'right', 'middle'][event.button]});
  });
  // ioHook.on('mouseup', event => {
  //   send({type: mouseup, button=${['', 'left', 'right', 'middle'][event.button]}`);
  // });
  ioHook.on('mousewheel', event => {
    send({type: 'mousewheel', x: 0, y: event.rotation * event.amount});
  });
  ioHook.on('mousedrag', event => {
    // console.log(event)
    send({type: 'mousedrag', x: event.x, y: event.y, width: screenWidth, height: screenHeight});
  });
  ioHook.on('keydown', event => {
    const modifier = [];
    event.altKey && modifier.push('alt');
    event.shiftKey && modifier.push('shift');
    event.ctrlKey && modifier.push('control');
    event.metaKey && modifier.push('command');
  
    send({type: 'keydown', key: keymap[event.rawcode] || '', modifier: modifier.join(',')});
  });
  // ioHook.on('keyup', event => {
  //   const modifier = [];
  //   switch (true) {
  //     case event.altKey: modifier.push('alt');
  //     case event.shiftKey: modifier.push('shift');
  //     case event.ctrlKey: modifier.push('control');
  //     // case event.metaKey: modifier.push('command');
  //   }
  //   console.log({type: keyup&key=${keymap[event.rawcode] || ''}&modifier=${modifier.join(',')}`)
  //   send({type: keyup&key=${keymap[event.rawcode] || ''}&modifier=${modifier.join(',')}`);
  // });
  
  
  ioHook.start();
}
function registOverlayCallback(showFn, hideFn) {
  showOverlayCallback = showFn
  hideOverlayCallback = hideFn
}
function send(msgObj) {
  shouldForward && connection.send(msgObj)
}
function updateDisplays(displays) {
  displayDevices = displays
}
module.exports = {
  init,
  registOverlayCallback,
  updateDisplays
}