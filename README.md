# lan-control
a remote control in LAN, support keyboard, mouse, clipboard capture and replay

## Installation
### For Ubuntu
- From repository
  - add public key `wget -O -  http://apt.ovozz.com:5023/xkfront.pub.gpg | sudo apt-key add -`
  - modify sources.list `sudo vi /etc/apt/sources.list` and append `deb http://apt.ovozz.com:5023 /` to the end of file
  - run `sudo apt update`
  - install lan-control `sudo apt install lan-control -y`
- From packages 
  - go to this repo's release and download the latest version
  - install it from terminal `sudo dpkg -i lan-control-linux-x64.deb`

### For Windows
- go to this repo's release and download the latest version
- install `lan-control-win32-x64.exe`