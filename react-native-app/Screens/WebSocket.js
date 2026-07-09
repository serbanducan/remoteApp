import 'react-native-get-random-values';
import { File, Paths } from 'expo-file-system'; // IMPORT NOU
import CryptoJS from 'crypto-js';

import { getComputerData } from './ComputerScreens/ComputerManager';
import { showCustomAlert } from './CustomAlert'; 
import { translations } from '../translations'; // IMPORT NOU PENTRU DICȚIONAR

class WebSocketService {
  static instance = null;

  constructor() {
    this.server = null;
    this.isConnected = false;
    this.fileListener = null;
    this.fileDownloadListener = null;
    this.streamListener = null;
    this.connectionListener = null; 
    this.navigationHandler = null; 
    this.isConnecting = false;
      
    this.sessionPassword = null;
    this.isLoggedin = false;
    this.connectionTimeout = null;

    // Variabilă care va ține limba curentă
    this.language = 'en'; 
  }

  static getInstance() {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  static setFileListener(callback) {
    this.getInstance().fileListener = callback;
  }

  static setFileDownloadListener(callback) {
    this.getInstance().fileDownloadListener = callback;
  }

  static setStreamListener(callback) {
    this.getInstance().streamListener = callback;
  }


  static setConnectionListener(callback){
    this.getInstance().connectionListener = callback;
  }

  static setNavigationHandler(callback){
    this.getInstance().navigationHandler = callback;
  }

  // Funcție internă de traducere pentru WebSocket
  t(key) {
    return translations[this.language]?.[key] || key;
  }

  connect(url, password) { 
    this.sessionPassword = password; 
    this.isLoggedin = false; 
    this.isAuthFailed = false;

    // Închidem conexiunea veche dacă există
    if (this.server && (this.server.readyState === WebSocket.OPEN || this.server.readyState === WebSocket.CONNECTING)) {
        this.server.close();
    }

    this.server = new WebSocket(url);
    this.isConnected = true;

    // (Timerul este acum inițializat în serverConnect conform scriptului)

    this.server.onopen = () => {
      WebSocketService.sendCommand('AUTH', 'PING', {}); 
    };

    this.server.onmessage = (message) => {
      try {
        let data;
        const rawData = JSON.parse(message.data);

        if (rawData.encrypted && rawData.payload) {
            // 1. Decriptare AES
            const bytes = CryptoJS.AES.decrypt(rawData.payload, this.sessionPassword);
            const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
            
            if (!decryptedText) {
                return;
            }
            
            data = JSON.parse(decryptedText);

            // 2. Prevenire Replay Attack (Timeout de 2 secunde)
            if (Date.now() - data.timestamp > 2000) {
                return;
            }
        } else {
            // Fallback pentru pachetele necriptate pre-autentificare (ex: AUTH_RESULT, CONNECTION_REJECTED)
            data = rawData;
        }
      
        if (data.component === 'AUTH_RESULT') {
            if (data.status === 'SUCCESS') {
                if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
                showCustomAlert(this.t('ws_connected_title'), this.t('ws_connected_msg'));
                if (this.connectionListener) this.connectionListener(true);
                this.isLoggedin = true;
                this.isConnecting = false;
            } 
        }
        if (data.component === 'FILE_SYSTEM' && this.fileListener) {
            this.fileListener(data.data); 
        }
        if (data.component === 'FILE_DOWNLOAD' && this.fileDownloadListener) {
            this.fileDownloadListener(data);
        }
        if (data.component === 'STREAM' && this.streamListener) {
            this.streamListener(data);
        }

        if(data.component === 'SERVER_ERROR') {
          showCustomAlert(this.t('ws_pc_error_title'), data.message);
        }
        if(data.component === 'SYSTEM' && data.action === 'CONNECTION_REJECTED') {
          this.isAuthFailed = true;
          if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
          showCustomAlert(this.t('connection_rejected_title'), this.t(data.errorKey), () => {
            if (this.server) this.server.close();
            this.isConnecting = false;
            if (this.navigationHandler) {
              this.navigationHandler('Home');
            }
          });
        }
      } catch (e) {
      }
    };

    this.server.onerror = (error) => {
      // Nu curățăm timeout-ul aici. Lăsăm pe seama onclose sau a timeout-ului
      this.isConnecting = false;
    };

    this.server.onclose = (event) => {
      
      if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
      }

      if (event.code === 4001) {
          this.isAuthFailed = true;

          showCustomAlert(this.t('ws_auth_error_title'), this.t('ws_auth_error_msg'));
          this.isLoggedin = false;
          this.isConnected = false;
          this.isConnecting = false;
          if (this.connectionListener) {
              this.connectionListener(false);
          }
          return;
      }

      if (this.isLoggedin) {
        showCustomAlert(
          this.t('ws_closed_title'), 
          this.t('ws_closed_msg'),
          () => {
            if (this.navigationHandler) {
              this.navigationHandler('Home');
            }
          }
        );
      } else if (!this.isAuthFailed) {
        // Dacă nu s-a logat și nu a eșuat explicit prin 4001 sau timeout
        // înseamnă că a eșuat conexiunea direct din TCP (Server oprit / IP greșit)
        showCustomAlert(this.t('ws_timeout_title'), this.t('ws_timeout_msg'));
      }
      
      this.server = null;
      this.isConnected = false;
      this.sessionPassword = false;
      this.isLoggedin = null;
      this.isConnecting = false;
      
      if (this.connectionListener) {
          this.connectionListener(false);
      }
    };
  }

  disconnect() {
    if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
    }
    if (this.server) {
      this.server.close();
      this.server = null;
      this.isConnected = false;
      this.sessionPassword = null;
    }
    this.isConnecting = false;
  }

  static sendCommand(component, action, data) {
    const inst = this.getInstance();

    if (inst.isConnected && inst.sessionPassword) {
      const rawPayload = {
        component: component,
        action: action,
        data: data,
        timestamp: Date.now() 
      };

      const jsonString = JSON.stringify(rawPayload);
      const encryptedString = CryptoJS.AES.encrypt(jsonString, inst.sessionPassword).toString();      

      const secureMessage = JSON.stringify({
        encrypted: true,
        payload: encryptedString
      });

      try {
        inst.server.send(secureMessage);
      } catch (e) {
      }
    }
  }

  static serverConnection() {
    return !!this.getInstance().isLoggedin;
  }
}

export async function serverConnect() {
  try {
    const inst = WebSocketService.getInstance();

    if (inst.isConnecting) {
        return;
    }
    
    inst.isConnecting = true;
    inst.isAuthFailed = false;

    // 1. Inițializăm timerul de 5 secunde EXACT la pornirea procedurii
    inst.connectionTimeout = setTimeout(() => {
        if (!inst.isLoggedin && !inst.isAuthFailed) {
            inst.isAuthFailed = true;
            if (inst.server) inst.server.close();
            showCustomAlert(inst.t('ws_timeout_title'), inst.t('ws_timeout_msg'));
            
            if (inst.connectionListener) inst.connectionListener(false);
            inst.isConnecting = false;
        }
    }, 5000);

    // 2. CITIM LIMBA CURENTĂ DIN FIȘIER
    const langFile = new File(Paths.document, 'language_config.json');
    if (langFile.exists) {
       try {
           const raw = await langFile.text();
           inst.language = JSON.parse(raw).language || 'en';
       } catch (e) { console.log(e); }
    }

    // 3. INIȚIALIZĂM CONEXIUNEA
    const computerData = await getComputerData();
    const selectedComputer = computerData?.selectedComputer;

    if (selectedComputer?.id != null && selectedComputer?.ip) {
        const url = `ws://${selectedComputer.ip}:${selectedComputer.port}`;
        inst.connect(url, selectedComputer.password);
    } else {
        if (inst.connectionTimeout) clearTimeout(inst.connectionTimeout);
        showCustomAlert(inst.t('ws_no_pc_title'), inst.t('ws_no_pc_msg'));
        inst.isConnecting = false;
    }
  } catch (error) {
    const inst = WebSocketService.getInstance();
    if (inst.connectionTimeout) clearTimeout(inst.connectionTimeout);
    inst.isConnecting = false;
  }
}

export default WebSocketService;