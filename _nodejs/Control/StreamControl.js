const { spawn } = require('child_process');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { sendStream, sendMessage } = require('../server/sendMessage');

let ffmpegProcess = null;
let frameBuffer = Buffer.alloc(0);
let isClientReady = true;

function handleClientAck() {
    isClientReady = true;
}

function stopStreaming() {
    console.log("Se oprește stream-ul...");
    if (ffmpegProcess) {
        ffmpegProcess.kill('SIGKILL');
        ffmpegProcess = null;
    }
    frameBuffer = Buffer.alloc(0);
}

function identifyStreamScreen(data) {
    if (data.action === 'START_STREAM') {
        if (ffmpegProcess) return; // Procesul este deja activ
        
        console.log("Pornire stream video Desktop...");
        frameBuffer = Buffer.alloc(0);
        isClientReady = true;

        // Trimitem portul activ curent înapoi către client
        const activePort = require('./websocket').getDynamicPort();
        sendMessage({
            component: 'STREAM',
            action: 'CONFIG',
            port: activePort
        });
        
        // Lansare FFmpeg in fundal folosind binarul instalat anterior
        ffmpegProcess = spawn(ffmpegPath, [
            '-f', 'gdigrab',
            '-framerate', '30',
            '-draw_mouse', '1', // Forțează desenarea cursorului de mouse
            '-i', 'desktop',
            '-c:v', 'mjpeg',
            '-q:v', '5', // Calitate decentă vs viteză
            '-vsync', 'cfr', // Forțează constant framerate (previne pauzele pe ecran static)
            '-f', 'image2pipe',
            '-' // Output direcționat către stdout
        ]);

        ffmpegProcess.stdout.on('data', (chunk) => {
            // Adăugăm chunk-ul curent în bufferul global
            frameBuffer = Buffer.concat([frameBuffer, chunk]);

            // Căutare markeri JPEG (Start: FF D8 / End: FF D9)
            let start = frameBuffer.indexOf(Buffer.from([0xFF, 0xD8]));
            let end = frameBuffer.indexOf(Buffer.from([0xFF, 0xD9]));

            while (start !== -1 && end !== -1 && end > start) {
                // Tăiere cadru complet (adaugam 2 biti pentru a pastra D9 la final)
                const frame = frameBuffer.slice(start, end + 2);
                
                // Filtrare cadre corupte / incomplete sub 5KB (5000 octeți)
                if (frame.length > 5000) {
                    if (isClientReady) {
                        isClientReady = false;
                        // Trimitere directă binară către motorul de criptare AES-CTR
                        sendStream(frame);
                    }
                }

                // Decupare buffer (eliminam ce a fost procesat, indiferent dacă l-am trimis sau nu)
                frameBuffer = frameBuffer.slice(end + 2);
                
                // Re-căutare pentru posibile cadre rămase în același buffer
                start = frameBuffer.indexOf(Buffer.from([0xFF, 0xD8]));
                end = frameBuffer.indexOf(Buffer.from([0xFF, 0xD9]));
            }
        });

        ffmpegProcess.stderr.on('data', (data) => {
            // Nu logăm fiecare warning/frame render log deoarece înfundă consola.
        });

        ffmpegProcess.on('close', (code) => {
            console.log(`Proces FFmpeg încheiat (cod ${code})`);
            ffmpegProcess = null;
            frameBuffer = Buffer.alloc(0);
        });

    } else if (data.action === 'STOP_STREAM') {
        stopStreaming();
    } else if (data.action === 'FRAME_ACK') {
        handleClientAck();
    }
}

module.exports = { identifyStreamScreen, stopStreaming };
