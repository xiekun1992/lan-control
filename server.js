// // const http = require('http');
// const url = require('url');
// const querystring = require('querystring');
const igmp = require('./utils/igmp_server.js');
// // const {performance} = require('perf_hooks');
// let robotjs;
// if (process.platform == 'linux') {
//   robotjs = require('./robotjs');
// } else {
//   robotjs = require('./robotjs-0.5.1');
// }

// let {x, y} = robotjs.getMousePos();
// let screen = robotjs.getScreenSize();
// console.log('server started...');

// function handle(data) {
//   console.log(Date.now(), data)
//   const reqUrl = url.parse(data);
//   const reqPath = reqUrl.pathname;
//   const reqQuery = querystring.parse(reqUrl.query);
//   if (reqPath == '/') {
//     switch (reqQuery.type) {
//       case 'mousemove': 
//         x = +reqQuery.x / +reqQuery.width * screen.width;
//         y = +reqQuery.y / +reqQuery.height * screen.height;
//         robotjs.moveMouse(x, y);
//         console.log(Date.now());
//         break;
//       case 'keydown':
//       console.log(reqQuery);
//         if (reqQuery.key) {
//           robotjs.keyToggle(reqQuery.key, 'down');
//         }
//         break;
//       case 'keyup':
//       console.log(reqQuery);
//         if (reqQuery.key) {
//           robotjs.keyToggle(reqQuery.key, 'up');
//         }
//         break;
//       case 'mousedown': 
//         robotjs.mouseToggle('down', reqQuery.button);
//         break;
//       case 'mouseup': 
//         robotjs.mouseToggle('up', reqQuery.button);
//         break;
//     }
//   }
// }
igmp.start();