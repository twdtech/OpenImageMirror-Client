# OpenImageMirror Client
## Overview
OpenImageMirror is a desktop application for browsing and downloading image and ISO files from a local mirror server. Built with Electron, this client provides an intuitive interface for exploring and downloading files efficiently.

## Functionality

- Real-time file and folder search
- Quick filtering of file tree

## User Experience
- Loading overlay during data fetching
- Total file size and count display
- Responsive design

## Prerequisites 🔧
- Node.js (version 14+ recommended)
- npm or yarn
- Active [OpenImageMirror Server](https://github.com/twdtech/OpenImageMirror)

## Installation 🚀
```bash
git clone https://github.com/twdtech/OpenImageMirror-Client.git
cd OpenImageMirror-Client
npm install
npm run build/start
```

## Configuration ⚙️
### Server URL
Modify the apiUrl in renderer.js to point to your mirror server:
```js
const apiUrl = 'http://localhost:8080/api/mirror';
```

## Root Folder Name
### Customize the root folder name in renderer.js:
```js
const rootName = 'Root /'; 
```

## Technologies Used
- Electron
- JavaScript
- HTML5
- CSS3

## Key Components
- main.js: Electron main process
- preload.js: Bridge between Electron main and renderer processes
- renderer.js: Client-side rendering and interaction logic
- index.html: Application structure

## Permissions 🔒
### Requires permission to:
Access local file system
Make network requests
Show system notifications

## License 📄 <br>
BSD 3 Clause

## Screenshots
![OpenImageMirror Client Screenshot](https://raw.githubusercontent.com/twdtech/twdtech/refs/heads/main/imgs/oimc_v01.png)

<br>
Note: This is an early version of the application. Feedback and contributions are welcome! 🌟
