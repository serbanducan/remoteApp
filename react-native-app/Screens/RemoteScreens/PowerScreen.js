import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import dgram from 'react-native-udp';
import { Buffer } from 'buffer';
import WebSocketService from '../WebSocket';
import { getComputerData } from '../ComputerScreens/ComputerManager';
import { showCustomAlert } from '../CustomAlert';

import { useTheme } from '../../ThemeContext'; 
import { useLanguage } from '../../LanguageContext';

const { width } = Dimensions.get('window');

export default function PowerScreen({ navigation }) {
  const { isDarkMode, themeColor, colors } = useTheme();
  const { t } = useLanguage(); // EXTRAGERE FUNCȚIE TRADUCERE

  const handleCommand = (action) => {
    if (WebSocketService.serverConnection()) {
      WebSocketService.sendCommand('POWER', action, {});
    } else {
      showCustomAlert(t('ws_send_fail_title'), t('ws_send_fail_msg'));
    }
  };

  const handleWakeOnLan = async () => {
    try {
      const data = await getComputerData();
      const macRaw = data?.selectedComputer?.macAddress;

      if (!macRaw) {
        showCustomAlert(t('info_title'), t('wol_no_mac_msg'));
        return;
      }

      const cleanMac = macRaw.replace(/[^0-9a-fA-F]/g, '');
      if (cleanMac.length !== 12) {
        showCustomAlert(t('wol_error_title'), "Adresa MAC salvată este invalidă.");
        return;
      }

      const macBytes = [];
      for (let i = 0; i < 12; i += 2) {
        macBytes.push(parseInt(cleanMac.substring(i, i + 2), 16));
      }

      const packet = Buffer.alloc(102);
      for (let i = 0; i < 6; i++) packet[i] = 0xff;
      for (let i = 0; i < 16; i++) {
        for (let j = 0; j < 6; j++) {
          packet[6 + i * 6 + j] = macBytes[j];
        }
      }

      const socket = dgram.createSocket('udp4');
      
      socket.bind(0, () => {
        // ⚠️ TRAPA ASINCRONĂ: Punem try-catch EXPLICIT în interiorul callback-ului!
        try {
          socket.setBroadcast(true);
          socket.send(packet, 0, packet.length, 9, '255.255.255.255', (err) => {
            if (err) {
              showCustomAlert(t('wol_error_title'), t('wol_error_msg'));
            } else {
              showCustomAlert("Wake-on-LAN", "Semnalul de pornire a fost trimis!");
            }
            try { socket.close(); } catch(e) {}
          });
        } catch (asyncError) {
          console.error("Eroare în thread-ul asincron UDP:", asyncError);
          showCustomAlert(t('wol_error_title'), "Sistemul Android a blocat trimiterea pachetului binar.");
          try { socket.close(); } catch(e) {}
        }
      });

      // Gestionăm și cazul în care socket-ul dă eroare la nivel de instanță
      socket.on('error', (err) => {
        console.error("Socket error listener:", err);
        try { socket.close(); } catch(e) {}
      });

    } catch (error) {
      showCustomAlert(t('wol_error_title'), "A apărut o problemă la inițializarea WoL.");
    }
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <LinearGradient
        colors={[themeColor, 'transparent']}
        start={{ x: 1, y: 0 }} end={{ x: 0.2, y: 0.75 }}
        style={styles.backgroundAccent}
      />

      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <View>
            <Text style={[styles.titleText, { color: colors.text }]}>{t('power_title')}</Text>
            <View style={[styles.titleUnderline, { backgroundColor: themeColor }]} />
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.ButtonArea}>
          <TouchableOpacity style={[styles.glassButton, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => handleCommand('SHUTDOWN')}>
            <Text style={[styles.IconText, { color: colors.text }]}>{t('shut_down')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.glassButton, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => handleCommand('RESTART')}>
            <Text style={[styles.IconText, { color: colors.text }]}>{t('restart')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ButtonArea}>
          <TouchableOpacity style={[styles.glassButton, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => handleCommand('HIBERNATE')}>
            <Text style={[styles.IconText, { color: colors.text }]}>{t('hibernate')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.glassButton, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => handleCommand('SLEEP')}>
            <Text style={[styles.IconText, { color: colors.text }]}>{t('sleep')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ButtonArea}>
          <TouchableOpacity style={[styles.glassButton, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => handleCommand('LOGOUT')}>
            <Text style={[styles.IconText, { color: colors.text }]}>{t('log_out')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.glassButton, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => handleCommand('LOCK')}>
            <Text style={[styles.IconText, { color: colors.text }]}>{t('lock')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ButtonArea}>
          <TouchableOpacity 
            style={[styles.glassButton, { backgroundColor: colors.card, borderColor: colors.border, flex: undefined, width: '95%' }]} 
            activeOpacity={0.8} 
            onPress={handleWakeOnLan}
          >
            <Text style={[styles.IconText, { color: colors.text }]}>{t('wake_on_lan')}</Text>
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, alignItems: 'center', paddingTop: StatusBar.currentHeight || 20 },
  backgroundAccent: { position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, opacity: 0.3 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', width: '85%', marginBottom: 40, marginTop: 10 },
  backButton: { marginRight: 20, padding: 10 },
  backIcon: { fontSize: 28, fontWeight: '300' },
  titleText: { fontSize: 32, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -1 },
  titleUnderline: { width: 40, height: 4, marginTop: -5, marginLeft: 2 },
  controlsContainer: { width: '90%', flex: 1, justifyContent: 'center', paddingBottom: 50 },
  ButtonArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  glassButton: { flex: 1, justifyContent: "center", alignItems: "center", height: 120, borderRadius: 20, marginHorizontal: 10, borderWidth: 1 },
  IconText: { fontSize: 18, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }
});