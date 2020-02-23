const {
    Worker, isMainThread, parentPort, workerData
} = require('worker_threads');
const http = require('http');
const robotjs = require('../robotjs');
const Pool = require('worker-threads-pool');
const path = require('path');

module.exports = {
    start() {
        if (isMainThread) {
            const screen = robotjs.getScreenSize();
            const pool = new Pool({max: 5});
            console.log('server started...');
            http.createServer((req, res) => {
                pool.acquire(path.resolve(__dirname, './thread.js'), {workerData: {screen, data: req.url}}, (err, worker) => {
                    if (err) console.error(err);
                    console.log('thread');
                    worker.once('error', console.log)
                    worker.once('exit', () => {
                        console.log('thread exit')
                        res.writeHead(200);
                        res.end();
                    })
                })
            }).listen(8000);
        }
    }
}