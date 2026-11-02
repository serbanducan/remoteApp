const express = require('express');
const fs = require('fs');
const path = require('path');
const open = require('open');

// Calea către fișierul de configurare, aflat cu un nivel mai sus față de folderul GUI
const CONFIG_PATH = path.join(__dirname, '../server_config.json');

function startSetupGUI(onCompleteCallback) {
    const app = express();
    const PORT = 4000;
    
    // Flag de siguranță pentru a preveni pornirea dublă a serverului WebSocket
    let isFinished = false; 

    app.use(express.urlencoded({ extended: true }));
    
    // Servim folderul de iconițe pentru a fi accesibil în browser
    app.use('/icons', express.static(path.join(__dirname, 'icons')));

    // Ruta principală care încarcă interfața grafică
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'setup.html'));
    });

    // ==========================================
    // SISTEMUL DE HEARTBEAT (DETECTARE ÎNCHIDERE TAB)
    // ==========================================
    let lastPing = Date.now();

    // Ruta pe care browserul o apelează în fiecare secundă pentru a spune "Sunt aici!"
    app.post('/ping', (req, res) => {
        lastPing = Date.now();
        res.sendStatus(200);
    });

    // Verificăm constant dacă browserul a fost închis
    const monitorInterval = setInterval(() => {
        const timeSinceLastPing = Date.now() - lastPing;
        
        // Dacă au trecut mai mult de 3 secunde fără semnal, tab-ul e închis
        if (timeSinceLastPing > 3000 && !isFinished) {
            clearInterval(monitorInterval); // Oprim ceasul
            isFinished = true;
            console.log("Tab închis detectat. Pornim serverul WebSocket cu datele existente...");
            
            if (onCompleteCallback) {
                onCompleteCallback(); // Server.js va prelua parola veche
            }
            server.close();
        }
    }, 1000);
    // ==========================================

    // Pornim serverul de setup pe portul 4000
    const server = app.listen(PORT, async () => {
        console.log(`Interfața de setup a pornit pe http://127.0.0.1:${PORT}`);
        await open(`http://127.0.0.1:${PORT}`);
        
        // Resetăm timer-ul fix când se deschide browserul
        lastPing = Date.now();
    });

    // Ruta apelată când utilizatorul apasă butonul "Save Settings"
    app.post('/save', (req, res) => {
        try {
            const password = req.body.password;
            const startup = req.body.startup === 'on';

            const configData = {
                serverPassword: password, 
                openOnStartup: startup,
                lastUpdated: new Date().toISOString()
            };

            // Salvăm noile date în fișierul JSON
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2));

            res.send(`
                <body style="background:#0A0B10; color:white; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh;">
                    <div style="text-align:center;">
                        <h2 style="color:#34C759;">✓ Setări Salvate!</h2>
                        <p>Poți închide această fereastră. Serverul WebSocket a pornit.</p>
                    </div>
                </body>
            `);

            console.log("Configurație nouă salvată. Pornim WebSocket...");

            // Declanșăm pornirea WebSocket-ului imediat
            if (!isFinished) {
                isFinished = true;
                clearInterval(monitorInterval); // Oprim ceasul de heartbeat pentru că am terminat cu succes
                if (onCompleteCallback) {
                    onCompleteCallback(); 
                }
            }
            server.close(); // Închidem serverul de setup în fundal

        } catch (error) {
            console.error("Eroare la salvare:", error);
            res.status(500).send("Eroare internă la salvarea setărilor.");
        }
    });
}

module.exports = { startSetupGUI };