const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

contextBridge.exposeInMainWorld('electron', {
    downloadFile: (downloadOptions) => {
        return ipcRenderer.invoke('download-file', downloadOptions);
    },
    showSaveDialog: (options) => {
        return ipcRenderer.invoke('show-save-dialog', options);
    },
    onDownloadProgress: (callback) => {
        ipcRenderer.on('download-progress', (event, progress) => {
            callback(progress);
        });
    },
    removeDownloadProgressListener: () => {
        ipcRenderer.removeAllListeners('download-progress');
    },
    showNotification: (options) => {
        ipcRenderer.send('show-notification', options);
    },
    path: {
        join: (...args) => path.join(...args)
    }
});