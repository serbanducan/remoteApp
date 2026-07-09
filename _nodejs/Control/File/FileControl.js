const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../../server/sendMessage');
const { getFiles } = require('./getFiles');
const TokenManager = require('../../server/TokenManager');

function identifyFileScreen(data){
    if(data.action == 'SHOW'){
        show(data.data.path);
    }
    if(data.action == 'REQUEST_DOWNLOAD'){
        requestDownload(data.data.path);
    }
}

function requestDownload(filePath) {
    try {
        // Generăm token-ul de descărcare temporară
        const token = TokenManager.generateToken(filePath);
        const fileName = path.basename(filePath);

        const payload = {
            component: 'FILE_DOWNLOAD',
            action: 'FORCE_DOWNLOAD',
            token: token,
            fileName: fileName
        };

        console.log(`[FileControl] Am generat token-ul pentru ${fileName}. Trimit FORCE_DOWNLOAD prin WebSocket.`);
        sendMessage(payload);
    } catch (e) {
        console.error("[FileControl] Eroare la pregătirea biletului de descărcare:", e);
        sendMessage({
            component: 'SERVER_ERROR',
            message: 'Eroare la generarea token-ului de descărcare pe PC.'
        });
    }
}

async function show(dirPath) {
    const result = await getFiles(dirPath);
    
    const payload = {
        component: 'FILE_SYSTEM',
        data: result 
    };

    sendMessage(payload);
}

module.exports = {
    identifyFileScreen
}