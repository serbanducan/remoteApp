const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getConfig: () => ipcRenderer.invoke('get-config'),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),
    getStatus: () => ipcRenderer.invoke('get-status'),
    onServerStatus: (callback) => ipcRenderer.on('server-status', (_event, value) => callback(value)),
    onClientStatus: (callback) => ipcRenderer.on('client-status', (_event, value) => callback(value))
});
