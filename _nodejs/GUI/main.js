const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const { getConfig, saveConfig } = require('../server.js');
const { startWebSocketServer, stopWebSocketServer, getDynamicPort, setClientStatusCallback } = require('../server/websocket.js');

let mainWindow;
let tray = null;
let isQuitting = false;

// 4. Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        createWindow();
        createTray();
        handleStartup();
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 550,
        height: 720,
        resizable: false,
        autoHideMenuBar: true,
        show: false, // Initially hidden
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // 5. System Tray & Window Lifecycle
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
}

function createTray() {
    // In production, use a valid icon path
    // For now we'll create a simple empty tray or catch error
    try {
        // NativeImage can create an empty image if icon is missing
        const { nativeImage } = require('electron');
        const icon = nativeImage.createEmpty();
        tray = new Tray(icon);
    } catch (e) {
        console.warn("Icon not found.");
    }

    if (tray) {
        updateTrayMenu();
        tray.on('double-click', () => {
            mainWindow.show();
        });
    }
}

function updateTrayMenu() {
    if (!tray) return;
    
    const port = getDynamicPort();
    const portText = port ? `Status: Online (Port: ${port})` : `Status: Offline`;
    
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Setări', click: () => mainWindow.show() },
        { label: portText, enabled: false },
        { type: 'separator' },
        { label: 'Ieșire (Exit)', click: () => {
            isQuitting = true;
            stopWebSocketServer();
            app.quit();
        }}
    ]);
    tray.setContextMenu(contextMenu);
    tray.setToolTip('Antigravity Remote');
}

function handleStartup() {
    const config = getConfig();
    
    // Check auto-startup
    const loginSettings = app.getLoginItemSettings();
    if (config.autoStartup !== undefined && loginSettings.openAtLogin !== config.autoStartup) {
        app.setLoginItemSettings({
            openAtLogin: config.autoStartup,
            path: app.getPath('exe')
        });
    }

    if (!config.serverPassword) {
        // Cazul A: No password, show GUI
        mainWindow.show();
    } else {
        // Cazul B: Password exists, start silent
        startServer(config);
    }
}

function startServer(config) {
    stopWebSocketServer(); // Ensure it's clean
    if (config.serverPassword) {
        const targetPort = config.autoPort ? 0 : (config.manualPort || 8080);
        
        setClientStatusCallback((isConnected) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('client-status', isConnected);
            }
        });

        startWebSocketServer(config.serverPassword, targetPort, (allocatedPort) => {
            updateTrayMenu();
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('server-status', { online: true, port: allocatedPort });
            }
        });
    }
}

// IPC Handlers
ipcMain.handle('get-config', () => {
    return getConfig();
});

ipcMain.handle('save-config', (event, newConfig) => {
    const success = saveConfig(newConfig);
    if (success) {
        startServer(newConfig);
        
        // Update Safe Startup setting
        if (newConfig.autoStartup !== undefined) {
            app.setLoginItemSettings({
                openAtLogin: newConfig.autoStartup,
                path: app.getPath('exe')
            });
        }
    }
    return success;
});

ipcMain.handle('get-status', () => {
    const port = getDynamicPort();
    return { online: port > 0, port: port };
});

app.on('window-all-closed', () => {
    // We don't quit on all windows closed because it's a tray app
});

app.on('will-quit', () => {
    stopWebSocketServer();
});
