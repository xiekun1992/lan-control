# lan-control
a remote control in LAN, support keyboard, mouse, clipboard capture and replay

## Manual Build
### Prerequisites
- Node.js v16.0+
- NPM v8.0+
- C++ desktop build tools
    - MSVC 2019+ for Windows
    - build-essential for Linux
- node-gyp v7.0+

### Build
- run `npm install` to install dependencies
- run `npm run build:linux` for Linux
- run `npm run build:win` for Windows

## Installation
### For Ubuntu
- From repository
  - add public key `wget -O - https://deb.ovozz.com/xkfront.pub.key | sudo apt-key add -`
  - modify sources.list `sudo vi /etc/apt/sources.list` and append `deb [arch=amd64] https://deb.ovozz.com/ xkfront main` to the end of file
  - run `sudo apt update`
  - install lan-control `sudo apt install lan-control -y`
- From packages 
  - go to this repo's release and download the latest version
  - install it from terminal `sudo dpkg -i lan-control-linux-x64.deb`

### For Windows
- go to this repo's release and download the latest version
- install `lan-control-win32-x64.exe`
