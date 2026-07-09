import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFocusEffect } from '@react-navigation/native'; 
import { LinearGradient } from 'expo-linear-gradient';
import { serverConnect } from './WebSocket';
import WebSocketService from './WebSocket';
import { useTheme } from '../ThemeContext'; 
import { useLanguage } from '../LanguageContext'; 
import { showCustomAlert } from './CustomAlert'; 

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [serverConected, setServerConected] = useState(WebSocketService.serverConnection());
  const [isConnecting, setIsConnecting] = useState(false);
  const { isDarkMode, themeColor, colors } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    serverConnect();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setServerConected(WebSocketService.serverConnection());
      setIsConnecting(WebSocketService.getInstance().isConnecting);
      
      WebSocketService.setConnectionListener((newData) => {
        setServerConected(newData);
        setIsConnecting(WebSocketService.getInstance().isConnecting);
      });

      const interval = setInterval(() => {
        setIsConnecting(WebSocketService.getInstance().isConnecting);
      }, 500);

      return () => {
        WebSocketService.setConnectionListener(null);
        clearInterval(interval);
      };
    }, [])
  );

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <LinearGradient colors={[themeColor, 'transparent']} start={{ x: 1, y: 0 }} end={{ x: 0.2, y: 0.75 }} style={styles.backgroundAccent} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <Text style={[styles.titleText, { color: colors.text }]}>{t('home_title')}</Text>
          <View style={[styles.titleUnderline, { backgroundColor: themeColor }]} />
          
          <View style={[styles.statusContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statusDot, { backgroundColor: isConnecting ? '#F5A623' : (serverConected ? colors.statusDotGreen : colors.statusDotRed) }]} />
            <Text style={[styles.statusText, { color: colors.text }]}>
              {isConnecting ? "CONNECTING..." : (serverConected ? t('connected') : t('disconnected'))}
            </Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity style={[styles.glassButton, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => navigation.navigate('Remote')} >
            <View style={[styles.iconCircle, { backgroundColor: colors.border }]}><Image source={require("../assets/icons/remote-icon.png")} style={[styles.Icons, { tintColor: colors.text }]} resizeMode="contain" /></View>
            <View style={styles.textContainer}>
               <Text style={[styles.IconText, { color: colors.text }]}>{t('remotes_title')}</Text>
               <Text style={[styles.subText, { color: colors.subText }]}>{t('remotes_desc')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.glassButton, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => navigation.navigate('Computer')} >
            <View style={[styles.iconCircle, { backgroundColor: colors.border }]}><Image source={require("../assets/icons/computer-icon.png")} style={[styles.Icons, { tintColor: colors.text }]} resizeMode="contain"/></View>
            <View style={styles.textContainer}>
               <Text style={[styles.IconText, { color: colors.text }]}>{t('computers_title')}</Text>
               <Text style={[styles.subText, { color: colors.subText }]}>{t('computers_desc')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.glassButton, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => navigation.navigate('Settings')} >
            <View style={[styles.iconCircle, { backgroundColor: colors.border }]}><Image source={require("../assets/icons/settings-icon.png")} style={[styles.Icons, { tintColor: colors.text }]} resizeMode="contain" /></View>
            <View style={styles.textContainer}>
               <Text style={[styles.IconText, { color: colors.text }]}>{t('settings_title')}</Text>
               <Text style={[styles.subText, { color: colors.subText }]}>{t('settings_desc')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.ConnectButton, { borderColor: themeColor }]} activeOpacity={0.9} onPress={() => { 
            if (serverConected) {
                WebSocketService.getInstance().disconnect();
            } else {
                serverConnect(); 
            }
        }} >
          <LinearGradient colors={[`${themeColor}80`, `${themeColor}20`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.connectGradient}>
            <Text style={[styles.ConnectText, { color: colors.text }]}>
                {isConnecting ? "CONNECTING..." : (serverConected ? t('btn_disconnect') : t('btn_connect'))}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  backgroundAccent: { position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, opacity: 0.3 },
  safeArea: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 60 },
  headerContainer: { alignItems: 'flex-start', width: '85%' },
  titleText: { fontSize: 52, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -1 },
  titleUnderline: { width: 50, height: 6, marginTop: -8, marginLeft: 2 },
  statusContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginTop: 15, borderWidth: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  statusText: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  menuContainer: { width: '100%', alignItems: 'center' },
  glassButton: { width: width * 0.88, height: 110, borderRadius: 24, marginVertical: 12, flexDirection: 'row', alignItems: "center", paddingHorizontal: 20, borderWidth: 1 },
  iconCircle: { width: 65, height: 65, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  textContainer: { marginLeft: 20 },
  Icons: { width: 32, height: 32 },
  IconText: { fontSize: 22, fontWeight: '700' },
  subText: { fontSize: 14, marginTop: 2 },
  ConnectButton: { width: width * 0.65, height: 65, borderRadius: 32, overflow: 'hidden', borderWidth: 1 },
  connectGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  ConnectText: { fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 4 }
});