const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
	folderExists: (path) => ipcRenderer.invoke('folder:exists', path),
	folderSelected: (callback) => ipcRenderer.on('folder:selected', callback),
	serverReady: (callback) => ipcRenderer.on('server:ready', callback),
	newServerStatus: (callback) => ipcRenderer.on('server:status', callback),
	folderPick: () => ipcRenderer.send('folder:pick'),
	startServer: (config) => ipcRenderer.send('server:start', config),
	stopServer: () => ipcRenderer.send('server:stop'),
	restartServer: (config) => ipcRenderer.send('server:restart', config),
	openInBrowser: () => ipcRenderer.send('browser:open'),
	newLog: (callback) => ipcRenderer.on('log:new', callback)
})
