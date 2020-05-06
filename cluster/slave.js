const robotjs = require('robotjs');
const keyboardAuto = require('node-addon-keyboard-auto');
// keyboardAuto.init();
// console.log(process.argv)
robotjs.setMouseDelay(0)
robotjs.setKeyboardDelay(0)
// will run with fork()
console.log('slave start with pid:', process.pid, process.argv[2])
// slave process
const screen = robotjs.getScreenSize();
process.on('message', (message) => {
    console.log('--->', process.argv[2], Date.now(), message)
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
                if (reqQuery.key.length > 0) {
                    // if (reqQuery.modifier) {
                    //     robotjs.keyToggle(reqQuery.key, 'down', reqQuery.modifier.split(','));
                    //     // robotjs.keyTap(reqQuery.key, reqQuery.modifier.split(','));
                    // } else {
                    	// robotjs.typeString(reqQuery.key);
                        // robotjs.keyTap(reqQuery.key);
                		// robotjs.keyToggle(reqQuery.key, 'down');
                        // robotjs.keyToggle(reqQuery.key, 'up');
                        keyboardAuto.keydown(reqQuery.key);
                    // }
                }
                break;
        case 'keyup':
        // console.log(reqQuery);
        	// break;
            if (reqQuery.key.length > 0) {
                // if (reqQuery.modifier) {
                //     robotjs.keyToggle(reqQuery.key, 'up', reqQuery.modifier.split(','));
                //     // robotjs.keyTap(reqQuery.key, reqQuery.modifier.split(','))
                // } else {
                	// robotjs.typeString(reqQuery.key);
                    // robotjs.keyTap(reqQuery.key)
            		// robotjs.keyToggle(reqQuery.key, 'down');
                    // robotjs.keyToggle(reqQuery.key, 'up');
                    keyboardAuto.keyup(reqQuery.key);
                // }
            }
            break;
        case 'mousedown': 
            // robotjs.mouseClick(reqQuery.button, false);
            robotjs.mouseToggle('down', reqQuery.button);
            break;
        case 'mousedrag': 
            robotjs.dragMouse(
            	+reqQuery.x / +reqQuery.width * screen.width,
            	+reqQuery.y / +reqQuery.height * screen.height);
            break;
        case 'mouseup': 
            robotjs.mouseToggle('up', reqQuery.button);
            break;
        case 'mousewheel':
            if (process.platform == 'linux') {
                robotjs.scrollMouse(+reqQuery.x, -reqQuery.y/ Math.abs(+reqQuery.y));
            } else {
                robotjs.scrollMouse(+reqQuery.x, +reqQuery.y);
            }
            break;
    }
    console.log('<---', process.argv[2], Date.now(), message)
})
