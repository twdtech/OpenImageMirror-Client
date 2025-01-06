const { app, BrowserWindow, ipcMain, dialog, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

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

    ipcMain.handle('download-file', async (event, { url, filePath }) => {
        try {
            const response = await axios({
                method: 'get',
                url: url,
                responseType: 'stream'
            });

            return new Promise((resolve, reject) => {
                const writer = fs.createWriteStream(filePath);
                
                response.data.pipe(writer);

                let totalLength = parseInt(response.headers['content-length'], 10);
                let downloadedLength = 0;

                response.data.on('data', (chunk) => {
                    downloadedLength += chunk.length;
                    const progress = Math.round((downloadedLength / totalLength) * 100);
                    event.sender.send('download-progress', progress);
                });

                writer.on('finish', () => resolve({ success: true }));
                writer.on('error', (error) => reject({ success: false, error: error.message }));
            });
        } catch (error) {
            console.error('Download error:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('show-save-dialog', async (event, options) => {
        return await dialog.showSaveDialog(win, options);
    });

    ipcMain.on('show-notification', (event, { title, body }) => {
        new Notification({ title, body }).show();
    });
}

app.whenReady().then(createWindow);