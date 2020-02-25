const url = require('url');
const querystring = require('querystring');
const robotjs = require('robotjs');

// will run with fork()
console.log('slave start with pid:', process.pid)
// slave process
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
