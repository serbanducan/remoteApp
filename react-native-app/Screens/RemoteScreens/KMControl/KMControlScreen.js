import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import Keyboard from './Keyboard';
import TouchPad from './TouchPad';

import { useTheme } from '../../../ThemeContext'; 
import { useLanguage } from '../../../LanguageContext'; // IMPORT NOU

const { width } = Dimensions.get('window');

export default function KMControlScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('touch'); 
  const { isDarkMode, themeColor, colors } = useTheme();
  const { t } = useLanguage(); // EXTRAGERE FUNCȚIE TRADUCERE

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
            <Text style={[styles.titleText, { color: colors.text }]}>{t('control_title')}</Text>
            <View style={[styles.titleUnderline, { backgroundColor: themeColor }]} />
        </View>
      </View>

      <View style={[styles.buttonView, { backgroundColor: colors.card }]}> 
        <TouchableOpacity 
          style={[
            styles.button, 
            activeTab === 'touch' 
              ? { backgroundColor: `${themeColor}40`, borderColor: themeColor, borderWidth: 1 } 
              : styles.inactiveButton
          ]}
          onPress={() => setActiveTab('touch')}
        >
          <Text style={[styles.buttonText, { color: activeTab === 'touch' ? colors.text : colors.subText }]}>{t('tab_touch')}</Text>
        </TouchableOpacity>   

        <TouchableOpacity 
          style={[
            styles.button, 
            activeTab === 'keyboard' 
              ? { backgroundColor: `${themeColor}40`, borderColor: themeColor, borderWidth: 1 } 
              : styles.inactiveButton
          ]}
          onPress={() => setActiveTab('keyboard')}
        >
          <Text style={[styles.buttonText, { color: activeTab === 'keyboard' ? colors.text : colors.subText }]}>{t('tab_keyboard')}</Text>
        </TouchableOpacity> 
      </View>

      <View style={styles.usableArea}>
        {activeTab === 'touch' ? <TouchPad /> : <Keyboard />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingTop: StatusBar.currentHeight || 20, 
    alignItems: 'center' 
  },
  backgroundAccent: { position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, opacity: 0.3 },
  headerContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    width: '85%', 
    marginBottom: 20, 
    marginTop: 10 
  },
  backButton: { marginRight: 20, padding: 10 },
  backIcon: { fontSize: 28, fontWeight: '300' },
  titleText: { fontSize: 32, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -1 },
  titleUnderline: { width: 40, height: 4, marginTop: -5, marginLeft: 2 },
  buttonView: { 
    flexDirection: 'row', 
    width: '90%', 
    marginBottom: 15, 
    borderRadius: 25, 
    padding: 5 
  },
  button: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: "center", 
    height: 45, 
    borderRadius: 20 
  },
  inactiveButton: { backgroundColor: 'transparent' },
  usableArea: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: "center", 
    width: '100%' 
  },
  buttonText: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  }
});