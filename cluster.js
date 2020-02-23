// console.log(process.argv)

if (process.argv.indexOf('--slave') > -1) {
    console.log('slave start with pid:', process.pid)
    // slave process
    const url = require('url');
    const querystring = require('querystring');
    const robotjs = require('./robotjs');
    const screen = robotjs.getScreenSize();
    process.on('message', (message) => {
        const data = message;        
        // console.log(Date.now(), data)
        const reqUrl = url.parse(data);
        const reqPath = reqUrl.pathname;
        const reqQuery = querystring.parse(reqUrl.query);
        if (reqPath == '/') {
            switch (reqQuery.type) {
            case 'mousemove': 
                const x = +reqQuery.x / +reqQuery.width * screen.width;
                const y = +reqQuery.y / +reqQuery.height * screen.height;
                robotjs.moveMouse(x, y);
                // console.log(Date.now());
                break;
            case 'keydown':
            console.log(reqQuery);
                if (reqQuery.key) {
                robotjs.keyToggle(reqQuery.key, 'down');
                }
                break;
            case 'keyup':
            console.log(reqQuery);
                if (reqQuery.key) {
                robotjs.keyToggle(reqQuery.key, 'up');
                }
                break;
            case 'mousedown': 
                robotjs.mouseToggle('down', reqQuery.button);
                break;
            case 'mouseup': 
                robotjs.mouseToggle('up', reqQuery.button);
                break;
            }
        }
    })
} else {
    console.log('master start with pid:', process.pid)
    // master process
    const dgram = require('dgram')
    const udp = dgram.createSocket('udp4')
    const childProcess = require('child_process')
    const slaveNum = 4
    const slaveProcess = []
    let index = 0
    for (let i = 0; i < slaveNum; i++) {
        const process = childProcess.fork(__filename, ['--slave']);
        slaveProcess.push(process)
    }

    udp.bind(8888, '0.0.0.0', () => {
        console.log('server started')
    })
    udp.on('message', (msg, rinfo) => {
        slaveProcess[index].send(msg.toString())
        index++
        index = index % slaveNum
    })
}