const fs = require('fs');
const path = require('path');
const os = require('os');

function getAppDir() {
    const appData = process.env.APPDATA || path.join(os.homedir(), '.antigravity');
    const targetDir = path.join(appData, 'AntigravityRemote');
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    return targetDir;
}

const CONFIG_PATH = path.join(getAppDir(), 'config.json');

function loadConfig() {
    const defaultSettings = { isManualPort: false, savedPort: 0 };
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
            return { ...defaultSettings, ...data };
        }
    } catch (err) {
        console.warn("Eroare la citirea config.json:", err.message);
    }
    return defaultSettings;
}

function saveConfig(newSettings) {
    try {
        const currentConfig = loadConfig();
        const updatedConfig = { ...currentConfig, ...newSettings };
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(updatedConfig, null, 2), 'utf8');
        console.log("⚙️ Configurare salvată permanent în:", CONFIG_PATH);
    } catch (err) {
        console.error("Eroare la salvarea configurației:", err);
    }
}

module.exports = { loadConfig, saveConfig };
