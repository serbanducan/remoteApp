import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Dimensions, StatusBar, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../ThemeContext'; 
import { useLanguage } from '../LanguageContext';
import WebSocketService from './WebSocket';
import { showCustomAlert } from './CustomAlert';

const { width } = Dimensions.get('window');

export default function RemoteScreen({ navigation }) {
  const { isDarkMode, themeColor, colors } = useTheme();
  const { t } = useLanguage();

  const handleNavigation = (screenName) => {
    if (screenName === 'Power' || WebSocketService.serverConnection()) {
      navigation.navigate(screenName);
    } else {
      showCustomAlert(t('ws_send_fail_title'), t('ws_send_fail_msg'), () => {
        navigation.navigate('Home');
      });
    }
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <LinearGradient colors={[themeColor, 'transparent']} start={{ x: 1, y: 0 }} end={{ x: 0.2, y: 0.75 }} style={styles.backgroundAccent} />

      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={[styles.backIcon, { color: colors.text }]}>←</Text></TouchableOpacity>
        <View>
            <Text style={[styles.titleText, { color: colors.text }]}>{t('remote_title')}</Text>
            <View style={[styles.titleUnderline, { backgroundColor: themeColor }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.menuContainer} style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={[styles.glassButton, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => handleNavigation('KMControl')} >
          <View style={[styles.iconCircle, { backgroundColor: colors.border }]}><Image source={require("../assets/icons/mouse-icon.png")} style={[styles.Icons, { tintColor: colors.text }]} resizeMode="contain"/></View>
          <Text style={[styles.IconText, { color: colors.text }]}>{t('km_control')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.glassButton, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => handleNavigation('Power')}>
          <View style={[styles.iconCircle, { backgroundColor: colors.border }]}><Image source={require("../assets/icons/power-icon.png")} style={[styles.Icons, { tintColor: colors.text }]} resizeMode="contain"/></View>
          <Text style={[styles.IconText, { color: colors.text }]}>{t('power_options')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.glassButton, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => handleNavigation('Media')}>
          <View style={[styles.iconCircle, { backgroundColor: colors.border }]}><Image source={require("../assets/icons/media-icon.png")} style={[styles.Icons, { tintColor: colors.text }]} resizeMode="contain"/></View>
          <Text style={[styles.IconText, { color: colors.text }]}>{t('media_control')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.glassButton, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => handleNavigation('File')}>
          <View style={[styles.iconCircle, { backgroundColor: colors.border }]}><Image source={require("../assets/icons/folder-icon.png")} style={[styles.Icons, { tintColor: colors.text }]} resizeMode="contain\"/></View>
          <Text style={[styles.IconText, { color: colors.text }]}>{t('files_explorer')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.glassButton, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => handleNavigation('Display')}>
          <View style={[styles.iconCircle, { backgroundColor: colors.border }]}><Image source={require("../assets/icons/computer-icon.png")} style={[styles.Icons, { tintColor: colors.text }]} resizeMode="contain"/></View>
          <Text style={[styles.IconText, { color: colors.text }]}>{t('display_title')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  backgroundAccent: { position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, opacity: 0.3 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', width: '85%', alignSelf: 'center', paddingTop: 60, marginBottom: 30 },
  backButton: { marginRight: 20, padding: 10 },
  backIcon: { fontSize: 28, fontWeight: '300' },
  titleText: { fontSize: 36, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -1 },
  titleUnderline: { width: 50, height: 4, marginTop: -5, marginLeft: 2 },
  scrollContainer: { width: '100%', flex: 1 },
  menuContainer: { width: '100%', alignItems: 'center', marginTop: 10, paddingBottom: 20 },
  glassButton: { flexDirection: 'row', width: width * 0.88, height: 85, borderRadius: 20, marginVertical: 10, alignItems: "center", paddingHorizontal: 20, borderWidth: 1 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  Icons: { width: 24, height: 24 },
  IconText: { fontSize: 18, fontWeight: '600', letterSpacing: 0.5 }
});