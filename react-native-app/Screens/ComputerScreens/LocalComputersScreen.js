import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, StatusBar, ActivityIndicator, PermissionsAndroid, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../ThemeContext';
import { useLanguage } from '../../LanguageContext';
import { useFocusEffect } from '@react-navigation/native';
import Zeroconf from 'react-native-zeroconf';

const { width } = Dimensions.get('window');
const zeroconf = new Zeroconf();

// Funcția care cere permisiunile native pe Android
const requestLocalNetworkPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      // Pe Android 13+ (API 33+) cerem NEARBY_WIFI_DEVICES
      if (Platform.Version >= 33) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES
        );
      }
      // Pe toate versiunile cerem Locație (obligatoriu pentru mDNS pe Android)
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn("Eroare la cererea permisiunilor:", err);
      return false;
    }
  }
  return true;
};

export default function LocalComputersScreen({ navigation }) {
  const { isDarkMode, themeColor, colors } = useTheme();
  const { t } = useLanguage();
  const [discoveredComputers, setDiscoveredComputers] = useState([]);
  const [scanStatus, setScanStatus] = useState('searching'); // 'searching', 'found', 'timeout'
  const [retryTrigger, setRetryTrigger] = useState(0);

  useFocusEffect(
    useCallback(() => {
    let isMounted = true;
    let scanActive = true;

    setScanStatus('searching');
    setDiscoveredComputers([]); // Reset list on new scan

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const onResolved = (service) => {
      const serviceType = (service.type || '').toLowerCase();
      const fullName = (service.fullName || '').toLowerCase();

      if (serviceType.includes('serban-remote') || fullName.includes('serban-remote')) {
        const adrese = service.addresses || [];
        const targetIp = service.txt?.realIp || adrese.find(ip => {
          if (ip.includes(':')) return false; // Ignoră adresele IPv6
          if (ip === '127.0.0.1') return false; // Loopback
          if (ip.startsWith('169.254.')) return false; // APIPA (link-local)
          if (ip.startsWith('192.168.56.')) return false; // VirtualBox Host-Only
          if (ip.startsWith('192.168.137.')) return false; // Windows Internet Connection Sharing hotspot
          return true; // Acceptă orice altă adresă IPv4 validă primită de la mDNS
        });
        
        if (targetIp) {
          scanActive = false; // Oprire imediată a scanării
          try { zeroconf.stop(); } catch(e) {}
          
          if (isMounted) {
            setScanStatus('found');
            
            const realPcName = service.txt?.deviceName || service.name || "PC Necunoscut";
            
            const newComputer = {
              name: realPcName,
              ip: targetIp,
              port: service.port
            };
            setDiscoveredComputers(prev => {
              if (!prev.find(c => c.ip === newComputer.ip)) {
                return [...prev, newComputer];
              }
              return prev;
            });
          }
        }
      }
    };

    const onError = (err) => {
      console.warn("Eroare Zeroconf:", err);
    };

    const runContinuousScan = async () => {
      // 1. Cerem permisiunea OBLIGATORIE pe APK:
      await requestLocalNetworkPermissions();

      try { 
        zeroconf.on('resolved', onResolved); 
        zeroconf.on('error', onError);
      } catch(e) {}

      if (!isMounted || !scanActive) return;

      // Pornim o singură scanare continuă
      try { zeroconf.scan('serban-remote', 'tcp', 'local.'); } catch(e) {}

      // Așteptăm 12 secunde
      await sleep(12000);

      if (!isMounted || !scanActive) return;

      // Timeout atins
      try { zeroconf.stop(); } catch(e) {}
      
      // Dacă nici după 12 secunde nu am găsit nimic, setăm starea la timeout
      setScanStatus(prevStatus => {
        // Dacă a fost deja găsit, nu rescriem statusul
        if (prevStatus === 'found') return prevStatus;
        return 'timeout';
      });
    };

    runContinuousScan();

    return () => {
      isMounted = false;
      scanActive = false;
      try {
          zeroconf.stop();
          zeroconf.removeDeviceListeners();
      } catch (e) {}
    };
  }, [retryTrigger])
  );

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <LinearGradient colors={[themeColor, 'transparent']} start={{ x: 1, y: 0 }} end={{ x: 0.2, y: 0.75 }} style={styles.backgroundAccent} />

      <View style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={[styles.titleText, { color: colors.text }]}>{t('local_devices_title')}</Text>
            <View style={[styles.titleUnderline, { backgroundColor: themeColor }]} />
          </View>
        </View>

        <View style={styles.listContainer}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>{t('searching_network')}</Text>
          
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {discoveredComputers.map((computer, index) => {
              return (
                <View key={index} style={[styles.computerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.computerInfo}>
                    <Text style={[styles.computerName, { color: colors.text }]}>{computer.name}</Text>
                    <Text style={[styles.computerIP, { color: colors.subText }]}>{computer.ip}:{computer.port}</Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.actionBtnSelect, { borderColor: themeColor, backgroundColor: `${themeColor}20` }]} 
                      onPress={() => navigation.navigate('AddComputer', { editMode: false, computerToEdit: computer })}
                    >
                      <Text style={[styles.actionBtnTextSelect, { color: themeColor }]}>{t('btn_connect_card')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            
            {scanStatus === 'searching' && (
              <View style={{ alignItems: 'center', paddingTop: discoveredComputers.length > 0 ? 30 : 50 }}>
                <ActivityIndicator size="large" color={themeColor} />
              </View>
            )}

            {scanStatus === 'timeout' && discoveredComputers.length === 0 && (
              <View style={{ alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 }}>
                <Text style={{ color: colors.subText, fontSize: 16, textAlign: 'center', marginBottom: 15, lineHeight: 24 }}>
                  {t('mdns_no_pc_found')}
                </Text>
                <TouchableOpacity 
                  style={{ paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: themeColor, backgroundColor: `${themeColor}10` }}
                  onPress={() => setRetryTrigger(prev => prev + 1)}
                >
                  <Text style={{ color: themeColor, fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' }}>{t('mdns_retry')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>

        <TouchableOpacity 
          style={[styles.AddButton, { borderColor: themeColor }]} 
          activeOpacity={0.9} 
          onPress={() => navigation.navigate('AddComputer')}
        >
          <LinearGradient colors={[`${themeColor}80`, `${themeColor}20`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.addGradient}>
            <Text style={[styles.AddButtonText, { color: colors.text }]}>{t('manually_add_device')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  backgroundAccent: { position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, opacity: 0.3 },
  safeArea: { flex: 1, alignItems: 'center', paddingTop: 60 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', width: '85%', marginBottom: 30 },
  backButton: { marginRight: 20, padding: 10 },
  backIcon: { fontSize: 28, fontWeight: '300' },
  titleText: { fontSize: 32, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -1 },
  titleUnderline: { width: 50, height: 4, marginTop: -5, marginLeft: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 15, marginLeft: 5 },
  listContainer: { flex: 1, width: '85%' },
  scrollView: { flex: 1 },
  computerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 18, paddingVertical: 15, paddingHorizontal: 20, marginBottom: 12, borderWidth: 1 },
  computerInfo: { flex: 1 },
  computerName: { fontSize: 18, fontWeight: '600' },
  computerIP: { fontSize: 12, marginTop: 4 },
  actionButtons: { flexDirection: 'row', alignItems: 'center' },
  actionBtnSelect: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1 },
  actionBtnTextSelect: { fontSize: 14, fontWeight: 'bold' },
  emptyListContainer: { alignItems: 'center', paddingTop: 50 },
  AddButton: { width: width * 0.85, height: 60, borderRadius: 30, overflow: 'hidden', marginBottom: 40, borderWidth: 1 },
  addGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  AddButtonText: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }
});
