const robotjs = require('robotjs');

// will run with fork()
console.log('slave start with pid:', process.pid)
// slave process
const screen = robotjs.getScreenSize();
process.on('message', (message) => {
    // console.log(Date.now(), message)
    const reqQuery = JSON.parse(message)
    switch (reqQuery.type) {
        case 'mousemove': 
            const x = +reqQuery.x / +reqQuery.width * screen.width;
            const y = +reqQuery.y / +reqQuery.height * screen.height;
            robotjs.moveMouse(x, y);
            // console.log(Date.now());
            break;
        case 'keydown':
            // console.log(reqQuery);
                if (reqQuery.key) {
                    if (reqQuery.modifier) {
                        robotjs.keyTap(reqQuery.key, reqQuery.modifier.split(','));
                    } else {
                        robotjs.keyTap(reqQuery.key);
                    }
                }
                break;
        case 'keyup':
        // console.log(reqQuery);
            if (reqQuery.key) {
                if (reqQuery.modifier) {
                    robotjs.keyTap(reqQuery.key, reqQuery.modifier.split(','));
                } else {
                    robotjs.keyTap(reqQuery.key);
                }
            }
            break;
        case 'mousedown': 
            // robotjs.mouseClick(reqQuery.button, false);
            robotjs.mouseToggle('down', reqQuery.button);
            break;
        case 'mouseup': 
            robotjs.mouseToggle('up', reqQuery.button);
            break;
        case 'mousewheel':
            if (process.platform == 'linux') {
                robotjs.scrollMouse(+reqQuery.x, -reqQuery.y / Math.abs(+reqQuery.y));
            } else {
                robotjs.scrollMouse(+reqQuery.x, +reqQuery.y);
            }
            break;
    }
})
