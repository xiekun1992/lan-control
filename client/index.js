// const {ipcRenderer} = require('electron')
const {Interaction} = require('./interaction')
const {UDPClient} = require('./connection')

UDPClient.init({ip: '127.0.0.1', port: 8888})
let interaction// = new Interaction({x: , y: })
let id = 0

window.onmousemove = e => {
    UDPClient.send({id: id++, x: e.screenX, y: e.screenY})
    // ipcRenderer.send('a', {x: e.screenX, y: e.screenY})
}