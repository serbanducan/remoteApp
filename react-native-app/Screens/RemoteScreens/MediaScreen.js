import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import WebSocketService from '../WebSocket';

import { useTheme } from '../../ThemeContext'; 
import { useLanguage } from '../../LanguageContext'; // IMPORT NOU

const { width } = Dimensions.get('window');

export default function MediaScreen({ navigation }) {
    const { isDarkMode, themeColor, colors } = useTheme();
    const { t } = useLanguage(); // EXTRAGERE FUNCȚIE TRADUCERE

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
                    <Text style={[styles.titleText, { color: colors.text }]}>{t('media_title')}</Text>
                    <View style={[styles.titleUnderline, { backgroundColor: themeColor }]} />
                </View>
            </View>

            <View style={styles.controlsContainer}>
                <View style={styles.ButtonArea}>
                    <TouchableOpacity style={[styles.glassButton, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => WebSocketService.sendCommand('MEDIA', 'VOLUME_DOWN', {})}>
                        <Image source={require("../../assets/icons/volumeDown-icon.png")} style={[styles.Icons, { tintColor: colors.text }]} resizeMode="contain"/>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.glassButton, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => WebSocketService.sendCommand('MEDIA', 'VOLUME_UP', {})}>
                        <Image source={require("../../assets/icons/volumeUp-icon.png")} style={[styles.Icons, { tintColor: colors.text }]} resizeMode="contain"/>
                    </TouchableOpacity>
                </View>

                <View style={styles.ButtonArea}>
                     <TouchableOpacity style={[styles.glassButton, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => WebSocketService.sendCommand('MEDIA', 'PREVIOUS', {})}>
                         <Image source={require("../../assets/icons/previous-icon.png")} style={[styles.Icons, { tintColor: colors.text }]} resizeMode="contain"/>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.glassButton, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => WebSocketService.sendCommand('MEDIA', 'PLAY_PAUSE', {})}>
                         <Image source={require("../../assets/icons/media-icon.png")} style={[styles.Icons, { tintColor: colors.text }]} resizeMode="contain"/>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.glassButton, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => WebSocketService.sendCommand('MEDIA', 'NEXT', {})}>
                         <Image source={require("../../assets/icons/next-icon.png")} style={[styles.Icons, { tintColor: colors.text }]} resizeMode="contain"/>
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
    glassButton: { flex: 1, justifyContent: "center", alignItems: "center", height: 140, borderRadius: 20, marginHorizontal: 10, borderWidth: 1 },
    Icons: { width: 50, height: 50 }
});