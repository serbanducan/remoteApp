const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');
const crypto = require('crypto');
const TokenManager = require('./TokenManager');
const { getStreamKey } = require('./sendMessage');

let activeFileServer = null;

function startFileServer() {
    if (activeFileServer) {
        console.log("FileServer rulează deja.");
        return;
    }

    const fileServer = http.createServer((req, res) => {
        // Setăm headerele CORS pentru a fi siguri că cererile de pe telefon nu sunt blocate
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-auth-password');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            return res.end();
        }

        const parsedUrl = url.parse(req.url, true);

        // Doar endpoint-ul de descărcare este permis
        if (parsedUrl.pathname === '/download') {
            const token = parsedUrl.query.token;

            if (!token) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: "Token-ul lipsește din cerere." }));
            }

            // Validăm token-ul prin TokenManager
            const filePath = TokenManager.consumeToken(token);

            if (!filePath) {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: "Token invalid, expirat sau deja consumat." }));
            }

            // Verificăm dacă fișierul există pe disc
            if (!fs.existsSync(filePath)) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: "Fișierul nu a fost găsit pe PC." }));
            }

            try {
                const stat = fs.statSync(filePath);
                const fileName = path.basename(filePath);

                const streamKey = getStreamKey();
                if (!streamKey) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: "Cheia de criptare nu este setată pe PC." }));
                }

                // Generăm IV dinamic pentru această descărcare
                const iv = crypto.randomBytes(16);

                // Setăm headerele HTTP necesare pentru descărcare cu bară de progres
                res.writeHead(200, {
                    'Content-Type': 'application/octet-stream',
                    'Content-Length': stat.size + 16, // Includem IV-ul în dimensiunea finală
                    'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`
                });

                // Injectăm primii 16 bytes (IV-ul necriptat)
                res.write(iv);

                // Creăm filtrul AES-256-CTR
                const cipher = crypto.createCipheriv('aes-256-ctr', streamKey, iv);

                // Streaming eficient: pipe direct de la disc -> AES -> HTTP
                const readStream = fs.createReadStream(filePath);
                readStream.pipe(cipher).pipe(res);
                
                readStream.on('error', (err) => {
                    console.error("[FileServer] Eroare la citirea/trimiterea fișierului:", err);
                    if (!res.headersSent) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: "Eroare internă la streaming." }));
                    }
                });
            } catch (error) {
                console.error("[FileServer] Excepție la pregătirea fișierului:", error);
                if (!res.headersSent) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Eroare la citirea fișierului." }));
                }
            }

        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Ruta solicitată nu există." }));
        }
    });

    // Pornim serverul pe portul 8082
    fileServer.listen(8082, '0.0.0.0', () => {
        activeFileServer = fileServer;
        console.log('Serverul HTTP pentru descărcare fișiere rulează pe portul 8082');
    });
}

function stopFileServer() {
    if (activeFileServer) {
        activeFileServer.close();
        activeFileServer = null;
        console.log("Serverul HTTP pentru descărcare fișiere a fost oprit.");
    }
}

module.exports = { startFileServer, stopFileServer };