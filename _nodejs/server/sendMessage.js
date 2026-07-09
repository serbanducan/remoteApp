const crypto = require('crypto');
const CryptoJS = require('crypto-js');
let mainSocket = null;
let streamSocket = null;
let serverPassword = null;
let streamKey = null;

function setServerPassword(pwd) {
    serverPassword = pwd;
    // Derivăm o cheie statică de 32 de octeți (256-bit) din parolă folosind SHA-256
    streamKey = crypto.createHash('sha256').update(pwd).digest();
}

function getStreamKey() {
    return streamKey;
}

function handleNewConnection(ws, req) {
    const isStream = req.url && req.url.includes('?type=stream');

    if (!isStream) {
        // Main Client
        if (mainSocket !== null && mainSocket.readyState === 1) { // OPEN
            const rejectMessage = JSON.stringify({
                component: 'SYSTEM',
                action: 'CONNECTION_REJECTED',
                errorKey: 'client_already_connected'
            });
            ws.send(rejectMessage);
            ws.close();
            return false;
        }
        
        mainSocket = ws;
        ws.on('close', () => {
            if (mainSocket === ws) mainSocket = null;
        });
        return true;
    } else {
        // Stream Client
        streamSocket = ws;
        ws.on('close', () => {
            if (streamSocket === ws) {
                streamSocket = null;
                const { stopStreaming } = require('../Control/StreamControl');
                stopStreaming();
            }
        });
        return true;
    }
}

// Menținem compatibilitatea
function setAuthenticatedClient(ws) {
    // No-op
}

function sendStream(frameBuffer) {
    if (streamSocket && streamSocket.readyState === 1) {
        if (!streamKey) return;

        try {
            // Generăm un IV aleator de 16 bytes
            const iv = crypto.randomBytes(16);
            
            // Criptăm imaginea nativ folosind AES-256-CTR
            const cipher = crypto.createCipheriv('aes-256-ctr', streamKey, iv);
            const encryptedFrame = Buffer.concat([cipher.update(frameBuffer), cipher.final()]);
            
            // Îmbinăm [IV 16 bytes] + [Buffer criptat] și îl trimitem binar pe rețea
            const finalPacket = Buffer.concat([iv, encryptedFrame]);
            
            streamSocket.send(finalPacket);
        } catch (e) {
            console.error("Eroare la criptarea cadrului video:", e);
        }
    }
}

function sendMessage(payloadObj) {
    if (mainSocket && mainSocket.readyState === 1) {
        if (!serverPassword) {
            console.error("Nu se poate trimite mesaj criptat: Parola serverului nu este setată!");
            return;
        }
        
        try {
            // 1. Adăugăm timestamp anti-replay
            payloadObj.timestamp = Date.now();
            
            // 2. Transformare în string
            const jsonString = JSON.stringify(payloadObj);
            
            // 3. Criptare AES cu parola curentă
            const encryptedString = CryptoJS.AES.encrypt(jsonString, serverPassword).toString();
            
            // 4. Împachetare în plicul oficial
            const secureMessage = JSON.stringify({
                encrypted: true,
                payload: encryptedString
            });
            
            mainSocket.send(secureMessage);
        } catch (e) {
            console.error("Eroare la criptarea și trimiterea mesajului către client:", e);
        }
    }
}

module.exports = {
    handleNewConnection,
    setAuthenticatedClient,
    setServerPassword,
    getStreamKey,
    sendStream,
    sendMessage
};
