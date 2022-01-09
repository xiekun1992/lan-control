import {
  app,
  BrowserWindow,
  ipcMain
} from 'electron'
import path from 'path'
import http from 'http'
import fs from 'fs'

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
        width: 800,
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
        const dirPath = req.query.path as string ?? app.getPath('home')
        if (fs.lstatSync(dirPath).isDirectory()) {
          const dirs = fs.readdirSync(dirPath)
          const result = dirs.map(filename => {
            console.log(filename)
            const stat = fs.lstatSync(path.resolve(dirPath, filename))
            return {
              name: filename,
              isDirectory: stat.isDirectory(),
              isFile: stat.isFile(),
              isBlockDevice: stat.isBlockDevice(),
              isCharacterDevice: stat.isCharacterDevice(),
              isFIFO: stat.isFIFO(),
              isSocket: stat.isSocket(),
              isSymbolicLink: stat.isSymbolicLink(),
            }
          })
          res.status(200).json(result)
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