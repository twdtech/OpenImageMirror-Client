const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

contextBridge.exposeInMainWorld('electron', {
    writeFile: async (filePath, data) => {
        try {
            return await ipcRenderer.invoke('write-file', { filePath, data: Array.from(data) });
        } catch (error) {
            console.error('File write error:', error);
            return false;
        }
    },
    openDirectory: () => {
        return ipcRenderer.invoke('open-directory');
    },
    showNotification: (options) => {
        ipcRenderer.send('show-notification', options);
    },
    path: {
        join: (...args) => path.join(...args)
    }
});