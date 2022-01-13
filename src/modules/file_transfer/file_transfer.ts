import {
  app,
  BrowserWindow,
  ipcMain
} from 'electron'
import path from 'path'
import http from 'http'
import fs from 'fs'
import child from 'child_process'

class FileTransfer implements LAN.AppModule {
  private window: LAN.Nullable<Electron.BrowserWindow>;
  private server: LAN.Nullable<http.Server>;
  constructor() {
    this.window = null;
    this.server = null; 
  }
  show() {
    if (!this.window) {
      this.window = new BrowserWindow({
        width: 1100,
        height: 600,
        show: true,
        webPreferences: {
          nodeIntegration: true
        }
      });
      this.window.loadFile(path.resolve(__dirname, 'index.html'))
      // this.window.webContents.openDevTools()
      this.window.once('closed', () => {
        this.window = null
      })
    }
  }
  hide() {
    this.window?.close()
    this.window = null;
  }
  requestWrapper(res: http.ServerResponse, callback: Function) {
    try {
      callback && callback()
    } catch (e) {
      res.statusCode = 500
      res.end()
    }
  }
  init() {
    ipcMain.on('file-transfer.open', (event, args) => {
      this.show()
    })
    global.appState.httpServer
      .route('/file')
      .post((req, res) => {
        this.requestWrapper(res, () => {

        })
      })
      .get((req, res) => {
        this.requestWrapper(res, () => {
          const dirPath = req.query.file_path as string
          if (dirPath) {
            if (fs.existsSync(dirPath) && fs.lstatSync(dirPath).isFile()) {
              res.setHeader('Content-Type', 'application/octet-stream')
              res.setHeader('Content-Disposition', `attachment; filename=${dirPath.split('/').pop()}`)
              fs.createReadStream(dirPath).pipe(res);
            }
          } else {
            res.status(404).end()
          }
        })
      })
    
    global.appState.httpServer.get('/dirs', (req, res) => {
      this.requestWrapper(res, () => {
        const dirPath = req.query.path as string || app.getPath('home')
        if ('/' === dirPath && global.appState.platform.windows) {
          child.exec('wmic logicaldisk get name', (error, stdout) => {
            const driverNames = stdout.split('\r\r\n')
                                    .filter(value => /[A-Za-z]:/.test(value))
                                    .map(value => value.trim())
            const result = driverNames.map(name => ({
              path: name + '\\\\',
              name,
              isRoot: true,
              isDirectory: false,
              isFile: false,
              isBlockDevice: false,
              isCharacterDevice: false,
              isFIFO: false,
              isSocket: false,
              isSymbolicLink: false,
            }))
            res.status(200).json(result)
          });
        } else if (fs.lstatSync(dirPath).isDirectory()) {
          const dirs = fs.readdirSync(dirPath)
          const result = dirs.map(filename => {
            let filePath = path.resolve(dirPath, filename)
            console.log(filePath)
            try {
              const stat = fs.lstatSync(filePath)
              return {
                path: filePath.replace(/\\/g, '\\\\'),
                name: filename,
                isRoot: false,
                isDirectory: stat.isDirectory(),
                isFile: stat.isFile(),
                isBlockDevice: stat.isBlockDevice(),
                isCharacterDevice: stat.isCharacterDevice(),
                isFIFO: stat.isFIFO(),
                isSocket: stat.isSocket(),
                isSymbolicLink: stat.isSymbolicLink(),
              }
            } catch (e) {
              return {
                path: filePath.replace(/\\/g, '\\\\'),
                name: filename,
                isRoot: false,
                isDirectory: false,
                isFile: false,
                isBlockDevice: false,
                isCharacterDevice: false,
                isFIFO: false,
                isSocket: false,
                isSymbolicLink: false,
              }
            }
          })
          let parentPath = path.resolve(dirPath, '..')
          if (/^[A-Za-z]:\\$/.test(dirPath) && global.appState.platform.windows) {
            parentPath = '/'
            result.unshift({
              path: parentPath,
              name: '..',
              isRoot: false,
              isDirectory: true,
              isFile: false,
              isBlockDevice: false,
              isCharacterDevice: false,
              isFIFO: false,
              isSocket: false,
              isSymbolicLink: false,
            })
          } else if (dirPath !== '/') {
            const stat = fs.lstatSync(parentPath)
            result.unshift({
              path: parentPath.replace(/\\/g, '\\\\'),
              name: '..',
              isRoot: false,
              isDirectory: stat.isDirectory(),
              isFile: stat.isFile(),
              isBlockDevice: stat.isBlockDevice(),
              isCharacterDevice: stat.isCharacterDevice(),
              isFIFO: stat.isFIFO(),
              isSocket: stat.isSocket(),
              isSymbolicLink: stat.isSymbolicLink(),
            })
          }
          res.status(200).json(result)
        } else {
          res.status(404).end()
        }
      })
    })
  }
  destroy() {
    this.hide()
    this.server?.close();
  }
}

module.exports = new FileTransfer()