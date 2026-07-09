const fs = require('fs');
const path = require('path');
 
const { startWebSocketServer } = require('./server/websocket'); 

const CONFIG_PATH = path.join(__dirname, 'server_config.json');
const args = process.argv.slice(2); 

const mode = args[0]; 

function getConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        }
    } catch (e) {
        console.error("Eroare la citirea config:", e);
    }
    return { 
        serverPassword: null, 
        autoPort: true, 
        manualPort: 8080,
        isDarkMode: true,
        themeColor: '#007AFF',
        language: 'ro'
    };
}

function saveConfig(config) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error("Eroare la salvarea config:", e);
        return false;
    }
}

function getPasswordFromConfig() {
    return getConfig().serverPassword;
}

module.exports = {
    getConfig,
    saveConfig,
    getPasswordFromConfig
};
