const { contextBridge, ipcRenderer } = require('electron');

// Безопасный API для взаимодействия между главным процессом и рендерером
contextBridge.exposeInMainWorld('electronAPI', {
  navigate: (url) => ipcRenderer.send('navigate', url),
  onNavigate: (callback) => ipcRenderer.on('navigate-to', (event, url) => callback(url)),
  onNewTab: (callback) => ipcRenderer.on('new-tab', () => callback()),
  onCloseTab: (callback) => ipcRenderer.on('close-tab', () => callback()),
  onNavigateBack: (callback) => ipcRenderer.on('navigate-back', () => callback()),
  onNavigateForward: (callback) => ipcRenderer.on('navigate-forward', () => callback()),
  onReload: (callback) => ipcRenderer.on('reload', () => callback())
});
