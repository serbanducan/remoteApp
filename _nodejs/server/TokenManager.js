const crypto = require('crypto');

// Stocăm token-urile active: Map<token, filePath>
const tokens = new Map();

/**
 * Generează un token securizat de descărcare temporară pentru un fișier.
 * Token-ul se va auto-șterge din memorie după 30 de secunde.
 * @param {string} filePath - Calea absolută a fișierului de descărcat
 * @returns {string} token-ul generat
 */
function generateToken(filePath) {
    const token = crypto.randomBytes(16).toString('hex');
    tokens.set(token, filePath);
    
    console.log(`[TokenManager] Token generat pentru fișier: ${filePath}. Expiră în 30s. Token: ${token}`);
    
    // Auto-expirare după 30 de secunde
    setTimeout(() => {
        if (tokens.has(token)) {
            tokens.delete(token);
            console.log(`[TokenManager] Token-ul ${token} a expirat și a fost eliminat automat.`);
        }
    }, 30000);
    
    return token;
}

/**
 * Consumă un token. Dacă este valid, returnează calea fișierului asociat
 * și șterge imediat token-ul din memorie pentru a nu putea fi reutilizat (single-use).
 * @param {string} token - Token-ul de verificat
 * @returns {string|null} calea fișierului sau null dacă token-ul e invalid/expirat
 */
function consumeToken(token) {
    if (tokens.has(token)) {
        const filePath = tokens.get(token);
        tokens.delete(token); // Securitate ridicată: se consumă la prima utilizare
        console.log(`[TokenManager] Token-ul ${token} a fost consumat cu succes pentru fișierul: ${filePath}`);
        return filePath;
    }
    console.log(`[TokenManager] Încercare eșuată de a consuma un token invalid sau expirat: ${token}`);
    return null;
}

module.exports = {
    generateToken,
    consumeToken
};
