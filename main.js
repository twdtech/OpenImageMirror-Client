const { app, BrowserWindow, ipcMain, dialog, Notification } = require('electron');
const path = require('path');
const fs = require('fs').promises;

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('index.html');

    ipcMain.handle('write-file', async (event, { filePath, data }) => {
        try {
            await fs.writeFile(filePath, Buffer.from(data));
            return true;
        } catch (error) {
            console.error('File write error:', error);
            return false;
        }
    });

    ipcMain.handle('open-directory', async () => {
        return await dialog.showOpenDialog({
            properties: ['openDirectory']
        });
    });

    ipcMain.on('show-notification', (event, { title, body }) => {
        new Notification({ title, body }).show();
    });
}

app.whenReady().then(createWindow);