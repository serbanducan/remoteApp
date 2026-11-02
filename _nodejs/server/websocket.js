const WebSocket = require('ws');
const CryptoJS = require('crypto-js'); 
const { Bonjour } = require('bonjour-service');
const os = require('os');
const http = require('http');
let bonjour = new Bonjour();

const { identifyKMControlScreen } = require('../Control/Control/KMControl');
const { identifyPowerScreen } = require('../Control/PowerControl');
const { identifyFileScreen } = require('../Control/File/FileControl');
const { identifyMediaScreen } = require('../Control/MediaControl');
const { identifyStreamScreen } = require('../Control/StreamControl');
const { handleNewConnection, setAuthenticatedClient, setServerPassword } = require('./sendMessage'); 
const { startFileServer, stopFileServer } = require('./FileServer');
const { loadConfig, saveConfig } = require('./PortManager');

// Variabilă de modul pentru a reține parola curentă
let cachedServerPassword = null;
let activeServer = null;
let activeWsServer = null;
let activeDynamicPort = 0;
let clientStatusCallback = null;

function setClientStatusCallback(cb) {
    clientStatusCallback = cb;
}

function getPhysicalLanIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        const lowerName = name.toLowerCase();
        // Ignoră plăcile virtuale cunoscute
        if (
            lowerName.includes('virtualbox') ||
            lowerName.includes('vmware') ||
            lowerName.includes('hyper-v') ||
            lowerName.includes('vethernet') ||
            lowerName.includes('wsl') ||
            lowerName.includes('pseudo')
        ) {
            continue;
        }

        for (const iface of interfaces[name]) {
            // Ignoră IPv6, adresele interne (loopback) și APIPA/VirtualBox default IPs
            if (
                iface.family === 'IPv4' &&
                !iface.internal &&
                !iface.address.startsWith('169.254.') &&
                !iface.address.startsWith('192.168.56.') &&
                !iface.address.startsWith('192.168.137.')
            ) {
                return iface.address;
            }
        }
    }
    return '';
}

// MODIFICARE: Funcția primește parola ca argument, portul dorit și un callback
function startWebSocketServer(serverPassword, portRequested = 0, onReady = null) {
    
    // Verificăm dacă parola a fost transmisă corect de server.js
    if (!serverPassword) {
        console.error("CRITICAL: Serverul WebSocket a primit o parolă goală și nu poate porni!");
        return;
    }

    // Salvare parolă în cache-ul modulului pentru a fi accesibilă în identifyScreen
    cachedServerPassword = serverPassword;
    setServerPassword(serverPassword);

    // Pornim și serverul HTTP pentru fișiere de pe portul 8081
    try {
        startFileServer();
    } catch (e) {
        console.log("File server might be already running.");
    }

    activeServer = http.createServer();
    
    const config = loadConfig();
    let targetPort = portRequested;

    // Modul Hibrid: AUTO vs MANUAL
    const isManual = config.isManualPort === true;

    if (isManual) {
        targetPort = config.savedPort && typeof config.savedPort === 'number' ? config.savedPort : 8080;
    } else {
        if (targetPort === 0 && config.savedPort && typeof config.savedPort === 'number') {
            targetPort = config.savedPort;
        }
    }

    activeServer.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`Avertisment: Portul ${targetPort} este ocupat.`);
            if (isManual) {
                // Mod MANUAL: Eșuează și notifică Electron (nu facem fallback automat)
                console.error(`Eroare critică: Portul manual ${targetPort} este deja folosit de altă aplicație!`);
                if (activeServer) {
                    activeServer.close();
                }
                
                // Emitem eveniment către UI dacă este disponibil (de ex prin clientStatusCallback sau Event Emitter global)
                // O simplă abordare e să folosim un callback existent sau process.send dacă suntem sub alt proces.
                // Cum am doar getDynamicPort/setClientStatusCallback din afară, vom lăsa aplicația să ruleze fără server și aruncăm o eroare în consolă pt moment.
                // Notă: "emite un eveniment către interfața grafică Electron"
                const { BrowserWindow } = require('electron');
                const wins = BrowserWindow.getAllWindows();
                if (wins.length > 0) {
                    wins[0].webContents.send('server-status', { online: false, error: 'EADDRINUSE', port: targetPort });
                }
            } else {
                // Mod AUTO: Forțăm generarea automată prin portul 0
                console.warn(`Se va genera un port nou automat (Fallback pe port 0)...`);
                if (activeServer) {
                    activeServer.close();
                }
                activeServer = http.createServer();
                activeServer.listen(0, '0.0.0.0', onListenSuccess);
            }
        } else {
            console.error("Eroare la pornirea serverului HTTP:", err);
        }
    });

    const onListenSuccess = () => {
        activeDynamicPort = activeServer.address().port;
        const ws = new WebSocket.Server({ server: activeServer });
        activeWsServer = ws;
        console.log(`Serverul WebSocket rulează pe portul ${activeDynamicPort}`);

        // Salvăm portul dacă s-a modificat (față de ce era în config)
        if (targetPort === 0 || config.savedPort !== activeDynamicPort) {
            saveConfig({ savedPort: activeDynamicPort });
        }

        // Recreăm instanța bonjour pentru a evita erori de cache la reporniri rapide
        if (bonjour) {
            try { bonjour.destroy(); } catch (e) {}
        }
        bonjour = new Bonjour();

        // Publicare serviciu mDNS DUPĂ ce portul e confirmat
        const realIp = getPhysicalLanIp();
        bonjour.publish({
            name: os.hostname(),
            type: 'serban-remote',
            port: activeDynamicPort,
            txt: {
                deviceName: os.hostname(),
                platform: os.platform(),
                realIp: realIp || ''
            }
        });
        console.log(`Serviciu mDNS publicat (tip: serban-remote) pe portul ${activeDynamicPort} (IP Real: ${realIp})`);

        if (onReady) onReady(activeDynamicPort);
        
        ws.on('connection', (ws, req) => {
            // Asignăm slotul corespunzător. Dacă e respins, funcția returnează false și conexiunea e deja închisă.
            const accepted = handleNewConnection(ws, req);
            if (!accepted) return;

            const isStream = req.url && req.url.includes('?type=stream');
            let isAuthenticated = false;
            let handshakeTimeout = null;

            if (!isStream) {
                handshakeTimeout = setTimeout(() => {
                    if (!isAuthenticated) {
                        console.log("Handshake timeout: Client didn't authenticate in 5s.");
                        ws.close(4001, 'Unauthorized');
                    }
                }, 5000);
            } else {
                isAuthenticated = true; // Stream-ul este implicit acceptat
            }

            ws.on('close', () => {
                if (isAuthenticated && !isStream && clientStatusCallback) {
                    clientStatusCallback(false);
                }
                if (handshakeTimeout) {
                    clearTimeout(handshakeTimeout);
                }
            });

        ws.on('message', (message) => {
            
                try {
                    const msgStr = message.toString();
                    const envelope = JSON.parse(msgStr);

                    // WebView trimite ACK-uri necriptate pentru eficiență maximă
                    if (envelope.component === 'STREAM' && envelope.action === 'FRAME_ACK') {
                        isAuthenticated = true;
                        clearTimeout(handshakeTimeout);
                        identifyStreamScreen(envelope);
                        return;
                    }


                    if (envelope.encrypted && envelope.payload) {
                        
                        // Încercăm să decriptăm
                        let decryptedText;
                        try {
                            
                            const bytes = CryptoJS.AES.decrypt(envelope.payload, cachedServerPassword);
                            decryptedText = bytes.toString(CryptoJS.enc.Utf8);


                            if (!decryptedText) throw new Error("Bad password");
                        } catch (decryptError) {
                            console.log("Tentativă de conectare cu parolă greșită blocată. Socket închis silențios.");
                            ws.close(4001, 'Unauthorized');
                            return;
                        }

                        const data = JSON.parse(decryptedText);

                        const now = Date.now();
                        if (now - data.timestamp > 2000) { 
                            console.log("Atac replay detectat.");
                            return;
                        }

                        // VERIFICĂM DACĂ E PACHETUL DE AUTENTIFICARE
                        if (data.component === 'AUTH' && data.action === 'PING') {
                            console.log("Client autentificat cu succes!");
                            isAuthenticated = true;
                            clearTimeout(handshakeTimeout);
                            
                            if (clientStatusCallback) {
                                clientStatusCallback(true);
                            }
                            
                            setAuthenticatedClient(ws);
                            
                            const successPayload = JSON.stringify({ component: 'AUTH_RESULT', status: 'SUCCESS' });
                            const encryptedSuccess = CryptoJS.AES.encrypt(successPayload, cachedServerPassword).toString();
                            ws.send(JSON.stringify({ encrypted: true, payload: encryptedSuccess }));
                            return; // Oprim execuția aici pentru acest pachet
                        }

                        // Altfel, e o comandă normală, o executăm
                        identifyScreen(data);

                    }
                } catch (e) {
                    // Eroare de procesare ignorată silențios
                }
            });
        });
    };

    // Încercăm să pornim pe targetPort (poate fi 0, portul salvat anterior sau port manual)
    activeServer.listen(targetPort, '0.0.0.0', onListenSuccess);
}

function identifyScreen(data) {
    if(data.component == 'KM') identifyKMControlScreen(data);
    else if(data.component == 'POWER') identifyPowerScreen(data.action);
    else if(data.component == 'MEDIA') identifyMediaScreen(data);
    else if(data.component == 'STREAM') identifyStreamScreen(data);
    else if(data.component == 'FILE_SYSTEM') identifyFileScreen(data, cachedServerPassword);
}

function stopWebSocketServer() {
    console.log("Oprire server WebSocket...");
    if (bonjour) {
        try {
            bonjour.unpublishAll();
            bonjour.destroy();
        } catch(e) {}
    }
    stopFileServer();
    if (activeWsServer) {
        for (const client of activeWsServer.clients) {
            client.close();
        }
        activeWsServer.close();
        activeWsServer = null;
    }
    if (activeServer) {
        activeServer.close();
        activeServer = null;
    }
    activeDynamicPort = 0;
}

function getDynamicPort() {
    return activeDynamicPort;
}

function restartServerWithPort(newPort, isManual) {
    console.log(`Repornire dinamică server pe portul: ${newPort} (Manual: ${isManual})`);
    stopWebSocketServer();
    
    // Salvează noile setări în config
    saveConfig({ savedPort: newPort, isManualPort: isManual });
    
    // Repornește serverul
    startWebSocketServer(cachedServerPassword, isManual ? newPort : 0);
}

module.exports = { 
    startWebSocketServer, 
    stopWebSocketServer,
    getDynamicPort,
    cachedServerPassword,
    setClientStatusCallback,
    restartServerWithPort
};
