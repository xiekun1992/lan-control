// const dgram = require('dgram');
// const server = dgram.createSocket('udp4');
const cluster = require('cluster');
const numCUPs = require('os').cpus().length;
const http = require('http');

function start(callback) {
	if (cluster.isMaster) {
		console.log(`Master ${process.pid} is running`);
		for (let i = 0; i < numCUPs; i++) {
			cluster.fork();
		}
		cluster.on('exit', (worker, code, signal) => {
			console.log(`worker ${worker.process.pid} died`);
		});
	} else {
		http.createServer((req, res) => {
			console.log(req.url);
			callback(req.url);
			res.writeHead(200);
			res.end();
		}).listen(8000);
		// server.bind(8004, '0.0.0.0', () => {
		// 	// server.setBroadcast(true);
		// 	// server.setMulticastTTL(128);
		// 	// server.addMembership('230.185.192.108');
		// });
		// server.on('message', (message, remote) => {
		// 	callback(message.toString());
		// });
		// server.on('connect', () => {
		// 	console.log('client connected');
		// });
		// server.on('close', () => {
		// 	console.log('server closed');
		// });
		// server.on('error', err => {
		// 	console.error('server error', err);
		// })
		console.log(`Worker ${process.pid} started`);
	}

}

module.exports = {
	start
}