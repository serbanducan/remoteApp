import { File, Paths } from 'expo-file-system';
import CryptoJS from 'crypto-js';
import WebSocketService from '../../WebSocket';

/**
 * Convertește un Uint8Array într-un WordArray CryptoJS
 */
function uint8ArrayToWordArray(u8arr) {
    const len = u8arr.length;
    const words = [];
    for (let i = 0; i < len; i += 4) {
        words.push(
            (u8arr[i] << 24) |
            ((u8arr[i + 1] || 0) << 16) |
            ((u8arr[i + 2] || 0) << 8) |
            (u8arr[i + 3] || 0)
        );
    }
    return CryptoJS.lib.WordArray.create(words, len);
}

/**
 * Convertește un WordArray CryptoJS într-un Uint8Array
 */
function wordArrayToUint8Array(wordArray) {
    const len = wordArray.sigBytes;
    const words = wordArray.words;
    const u8arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        u8arr[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    return u8arr;
}

/**
 * Descarcă un fișier criptat AES-CTR și îl decriptează iterativ folosind Streams.
 */
export async function startHttpDownload(serverIp, port, token, fileName, onProgress) {
    const downloadUrl = `http://${serverIp}:${port}/download?token=${token}`;
    
    // Faza 1: Descărcarea Oarbă în fișier temporar
    const tempFile = new File(Paths.document, fileName + '.enc');
    const finalFile = new File(Paths.document, fileName);
    

    if (onProgress) onProgress(0.1); 

    await File.downloadFileAsync(downloadUrl, tempFile, { idempotent: true });

    if (onProgress) onProgress(0.5); // Descărcare completă, începem decriptarea


    // Faza 2: Decriptare Iterativă (Chunking via Streams)
    try {
        const sessionPassword = WebSocketService.getInstance().sessionPassword;
        if (!sessionPassword) throw new Error("Parola sesiunii lipsește!");

        // Cheia statică de 32 bytes
        const keyHash = CryptoJS.SHA256(sessionPassword);

        // Deschidem stream-urile nativ (Zero Memory Bloat)
        const reader = tempFile.readableStream().getReader();
        const writer = finalFile.writableStream().getWriter();

        // Citim primii 16 bytes pentru IV
        const firstRead = await reader.read();
        if (firstRead.done) throw new Error("Fișier gol.");

        let chunk = firstRead.value; // Uint8Array
        if (chunk.length < 16) throw new Error("Fișier corupt sau lipsă IV.");

        const ivBytes = chunk.slice(0, 16);
        const ivWordArray = uint8ArrayToWordArray(ivBytes);

        const cipher = CryptoJS.algo.AES.createDecryptor(keyHash, { 
            mode: CryptoJS.mode.CTR, 
            padding: CryptoJS.pad.NoPadding, 
            iv: ivWordArray 
        });

        // Procesăm restul din primul chunk
        const firstDataBytes = chunk.slice(16);
        if (firstDataBytes.length > 0) {
            const decWords = cipher.process(uint8ArrayToWordArray(firstDataBytes));
            await writer.write(wordArrayToUint8Array(decWords));
        }

        // Loop de streaming continuu pentru restul fișierului
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const decWords = cipher.process(uint8ArrayToWordArray(value));
            await writer.write(wordArrayToUint8Array(decWords));
        }

        await writer.close();

        // Faza 3: Cleanup
        // Deși delete() nu e în API standard la fel de vizibil, 
        // putem folosi fs.unlink sau pur și simplu rescriem fișierul temporar
        try {
            // Nu avem un unlink direct în noul API File, dar ștergerea fișierului se poate face golindu-l
            // Așteptăm eventual expo-file-system File.delete() sau îl lăsăm ca suprascriere
        } catch (e) {}

        if (onProgress) onProgress(1); 
        
        return finalFile;
    } catch (error) {
        throw error;
    }
}
