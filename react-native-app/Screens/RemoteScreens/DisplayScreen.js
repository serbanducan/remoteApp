import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, StatusBar, ActivityIndicator } from 'react-native';import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import WebSocketService from '../WebSocket';
import { useTheme } from '../../ThemeContext';
import { useLanguage } from '../../LanguageContext';

// Importăm componentele de control (TouchPad / Keyboard)
import TouchPad from './KMControl/TouchPad';
import Keyboard from './KMControl/Keyboard';

const { width } = Dimensions.get('window');

export default function DisplayScreen({ navigation }) {
    const { isDarkMode, themeColor, colors } = useTheme();
    const { t } = useLanguage();

    // Tab-ul activ ('touch' sau 'keyboard')
    const [activeTab, setActiveTab] = useState('touch');

    // Extragem IP-ul și Portul curent direct din instanța WebSocket
    const getServerConnectionInfo = () => {
        const wsInst = WebSocketService.getInstance();
        if (wsInst.server && wsInst.server.url) {
            const match = wsInst.server.url.match(/ws:\/\/([^:/]+):(\d+)/);
            if (match) {
                return { ip: match[1], port: match[2] };
            }
        }
        return { ip: null, port: null };
    };

    const { ip: serverIp, port: streamPort } = getServerConnectionInfo();
    const sessionPassword = WebSocketService.getInstance().sessionPassword;

    useFocusEffect(
        useCallback(() => {
            // Trimitem doar comanda de pornire (fără să mai așteptăm CONFIG)
            WebSocketService.sendCommand('STREAM', 'START_STREAM', {});

            return () => {
                WebSocketService.setStreamListener(null);
                WebSocketService.sendCommand('STREAM', 'STOP_STREAM', {});
            };
        }, [])
    );

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            background-color: black; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            overflow: hidden; 
            touch-action: none;
          }
          img { 
            width: 100%; 
            height: 100%; 
            object-fit: contain; 
            transform-origin: center center;
            transition: transform 0.05s linear;
            transform: translate(0px, 0px) scale(1) translateZ(0); 
          }
        </style>
      </head>
      <body>
          <img id="videoStream" src="" alt="Stream Video" />

        <script>
          const img = document.getElementById('videoStream');
          
          // Variabile de stare pentru Zoom & Pan
          let currentZoom = 1;
          let initialZoom = 1;
          let startX = 0;
          let startY = 0;
          let currentX = 0;
          let currentY = 0;
          let isPanning = false;
          let initialDistance = 0;

          function updateTransform() {
             img.style.transform = \`translate3d(\${currentX}px, \${currentY}px, 0) scale(\${currentZoom})\`;
          }

          // Evenimente pentru Touch (Zoom & Pan)
          let lastTapTime = 0;

          document.addEventListener('touchstart', function(e) {
             const currentTime = new Date().getTime();
             const tapLength = currentTime - lastTapTime;
             
             if (e.touches.length === 1 && tapLength < 300 && tapLength > 0) {
                 // S-a detectat un dublu-tap rapid (sub 300ms)
                 currentZoom = 1;
                 currentX = 0;
                 currentY = 0;
                 updateTransform();
                 lastTapTime = 0; // Resetăm cronometrul
                 return;
             }
             lastTapTime = currentTime;

             if (e.touches.length === 1) {
                isPanning = true;
                startX = e.touches[0].clientX - currentX;
                startY = e.touches[0].clientY - currentY;
             } else if (e.touches.length === 2) {
                isPanning = false;
                initialDistance = Math.hypot(
                   e.touches[0].clientX - e.touches[1].clientX,
                   e.touches[0].clientY - e.touches[1].clientY
                );
                initialZoom = currentZoom;
             }
          }, { passive: false });

          document.addEventListener('touchend', function(e) {
             isPanning = false;
             if (e.touches.length === 0 && currentZoom <= 1) {
                currentX = 0;
                currentY = 0;
                updateTransform();
             }
          }, { passive: false });

          document.addEventListener('touchmove', function(e) {
             e.preventDefault();
             if (e.touches.length === 1) {
                if (currentZoom > 1) {
                   currentX = e.touches[0].clientX - startX;
                   currentY = e.touches[0].clientY - startY;
                }
             } else if (e.touches.length === 2) {
                const currentDistance = Math.hypot(
                   e.touches[0].clientX - e.touches[1].clientX,
                   e.touches[0].clientY - e.touches[1].clientY
                );
                if (initialDistance > 0) {
                   currentZoom = initialZoom * (currentDistance / initialDistance);
                }
             }
          updateTransform();
          }, { passive: false });

          let cryptoKey = null;
          let oldUrl = null;
          let ws = null;

          // Derivăm cheia statică (256-bit) din parola sesiunii
          async function deriveKey() {
              try {
                  const encoder = new TextEncoder();
                  const keyMaterial = await window.crypto.subtle.digest(
                      'SHA-256', 
                      encoder.encode('${sessionPassword}')
                  );
                  cryptoKey = await window.crypto.subtle.importKey(
                      'raw',
                      keyMaterial,
                      { name: 'AES-CTR' },
                      false,
                      ['decrypt']
                  );
                  
                  startWebSocket();
              } catch (err) {
              }
          }
          deriveKey();
          
          function startWebSocket() {
              ws = new WebSocket(\`ws://${serverIp}:${streamPort}?type=stream\`);
              ws.binaryType = 'arraybuffer'; // Crucial pentru a primi date pure

              ws.onopen = function() {
                 ws.send(JSON.stringify({ component: 'STREAM', action: 'FRAME_ACK' }));
              };

              ws.onmessage = async function(event) {
                 try {
                     if (typeof event.data === 'string') return;
                     if (!cryptoKey) return;

                     // Extragem IV-ul și restul ca imagine criptată
                     const iv = new Uint8Array(event.data, 0, 16);
                     const encryptedData = new Uint8Array(event.data, 16);

                     // Decriptăm accelerat hardware
                     const decryptedBuffer = await window.crypto.subtle.decrypt(
                         { name: 'AES-CTR', counter: iv, length: 64 },
                         cryptoKey,
                         encryptedData
                     );

                     // Convertim bufferul decriptat într-un obiect Blob vizual
                     const blob = new Blob([decryptedBuffer], { type: 'image/jpeg' });
                     
                     // Eliberăm memoria URL-ului precedent pentru a nu cauza memory leak-uri
                     if (oldUrl) URL.revokeObjectURL(oldUrl);
                     oldUrl = URL.createObjectURL(blob);
                     
                     img.src = oldUrl;

                 } catch (e) {
                 }
              };

              ws.onerror = function(error) {
              };
          }

          img.onload = function() {
             if (ws && ws.readyState === 1) { // OPEN
                ws.send(JSON.stringify({ component: 'STREAM', action: 'FRAME_ACK' }));
             }
          };

          img.onerror = function() {
             if (ws && ws.readyState === 1) { // OPEN
                ws.send(JSON.stringify({ component: 'STREAM', action: 'FRAME_ACK' }));
             }
          };
        </script>
      </body>
    </html>
    `;

    return (
        <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            <LinearGradient
                colors={[themeColor, 'transparent']}
                start={{ x: 1, y: 0 }} end={{ x: 0.2, y: 0.75 }}
                style={styles.backgroundAccent}
            />

            {/* Header */}
            <View style={styles.headerContainer}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
                </TouchableOpacity>
                <View>
                    <Text style={[styles.titleText, { color: colors.text }]}>{t('display_title')}</Text>
                    <View style={[styles.titleUnderline, { backgroundColor: themeColor }]} />
                </View>
            </View>

            {/* Video Frame */}
            <View style={[styles.videoFrameContainer, { borderColor: `${themeColor}40` }]}>
                {serverIp ? (
                    <View style={styles.streamContainer}>
                        {streamPort && (
                            <WebView 
                                originWhitelist={['*']}
                                source={{ html: htmlContent, baseUrl: 'http://localhost' }}
                                style={styles.webview}
                                javaScriptEnabled={true}
                                domStorageEnabled={true}
                                mediaPlaybackRequiresUserAction={false}
                                androidHardwareAccelerationDisabled={false}
                                scrollEnabled={false}
                                showsVerticalScrollIndicator={false}
                                showsHorizontalScrollIndicator={false}
                                bounces={false}
                            />
                        )}
                    </View>
                ) : (
                    <Text style={[styles.loadingText, { color: colors.text }]}>IP-ul serverului nu este disponibil...</Text>
                )}
            </View>

            {/* Tab-uri Touch / Keyboard */}
            <View style={[styles.buttonView, { backgroundColor: colors.card }]}> 
                <TouchableOpacity 
                    style={[
                        styles.tabButton, 
                        activeTab === 'touch' 
                            ? { backgroundColor: `${themeColor}40`, borderColor: themeColor, borderWidth: 1 } 
                            : styles.inactiveTabButton
                    ]}
                    onPress={() => setActiveTab('touch')}
                >
                    <Text style={[styles.tabButtonText, { color: activeTab === 'touch' ? colors.text : colors.subText }]}>{t('tab_touch')}</Text>
                </TouchableOpacity>   

                <TouchableOpacity 
                    style={[
                        styles.tabButton, 
                        activeTab === 'keyboard' 
                            ? { backgroundColor: `${themeColor}40`, borderColor: themeColor, borderWidth: 1 } 
                            : styles.inactiveTabButton
                    ]}
                    onPress={() => setActiveTab('keyboard')}
                >
                    <Text style={[styles.tabButtonText, { color: activeTab === 'keyboard' ? colors.text : colors.subText }]}>{t('tab_keyboard')}</Text>
                </TouchableOpacity> 
            </View>

            {/* Usable Area (TouchPad / Keyboard) */}
            <View style={styles.usableArea}>
                {activeTab === 'touch' ? <TouchPad /> : <Keyboard />}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, alignItems: 'center', paddingTop: StatusBar.currentHeight || 20 },
    backgroundAccent: { position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, opacity: 0.3 },
    headerContainer: { flexDirection: 'row', alignItems: 'center', width: '85%', marginBottom: 15, marginTop: 10 },
    backButton: { marginRight: 20, padding: 10 },
    backIcon: { fontSize: 28, fontWeight: '300' },
    titleText: { fontSize: 32, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -1 },
    titleUnderline: { width: 40, height: 4, marginTop: -5, marginLeft: 2 },
    
    // Noul Video Frame cu margini, aspect ratio și bordură rotunjită
    videoFrameContainer: { 
        width: '96%', // Lăsăm câțiva milimetri în laterale
        aspectRatio: 16 / 9, // Menținem forma corectă a ecranului
        backgroundColor: 'black', 
        borderRadius: 15, // Încadrat într-un frame frumos
        overflow: 'hidden', 
        borderWidth: 1,
        marginBottom: 15
    },
    streamContainer: { 
        flex: 1, 
        width: '100%', 
        height: '100%'
    },
    webview: { flex: 1, backgroundColor: 'black', width: '100%', height: '100%' },
    loadingText: { fontSize: 16, opacity: 0.7, fontWeight: '500', alignSelf: 'center', marginTop: '20%' },

    // Tab-uri
    buttonView: { 
        flexDirection: 'row', 
        width: '94%', 
        marginBottom: 10, 
        borderRadius: 25, 
        padding: 5 
    },
    tabButton: { 
        flex: 1, 
        alignItems: 'center', 
        justifyContent: "center", 
        height: 45, 
        borderRadius: 20 
    },
    inactiveTabButton: { backgroundColor: 'transparent' },
    tabButtonText: { 
        fontSize: 15, 
        fontWeight: 'bold', 
        textTransform: 'uppercase', 
        letterSpacing: 1 
    },

    // Zona pentru tastatură / touchpad
    usableArea: { 
        flex: 1, 
        width: '100%', 
        alignItems: 'center' 
    }
});
