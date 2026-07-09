import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Dimensions, Switch, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../ThemeContext'; 
import { useLanguage } from '../LanguageContext'; 

const { width } = Dimensions.get('window');

export default function SettingsScreen({ navigation }) {
    const { isDarkMode, themeColor, colors, toggleDarkMode, changeThemeColor, cursorSensitivity, setCursorSensitivity, scrollSensitivity, setScrollSensitivity, zoomSensitivity, setZoomSensitivity } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    
    const [colorModalVisible, setColorModalVisible] = useState(false);
    const [langModalVisible, setLangModalVisible] = useState(false);

    const themeColors = [
        { name: 'Albastru', value: '#007AFF' }, { name: 'Mov', value: '#A855F7' }, { name: 'Verde', value: '#34C759' }, { name: 'Roșu', value: '#FF3B30' }, { name: 'Galben', value: '#FFCC00' }, { name: 'Portocaliu', value: '#FF9500' }
    ];

    const availableLanguages = [
        { code: 'en', name: 'English' },
        { code: 'ar', name: 'Arabic (العربية)' },
        { code: 'bn', name: 'Bengali (বাংলা)' },
        { code: 'zh', name: 'Chinese (中文)' },
        { code: 'nl', name: 'Dutch (Nederlands)' },
        { code: 'fr', name: 'French (Français)' },
        { code: 'de', name: 'German (Deutsch)' },
        { code: 'hi', name: 'Hindi (हिन्दी)' },
        { code: 'id', name: 'Indonesian (Bahasa Indonesia)' },
        { code: 'it', name: 'Italian (Italiano)' },
        { code: 'ja', name: 'Japanese (日本語)' },
        { code: 'ko', name: 'Korean (한국어)' },
        { code: 'fa', name: 'Persian (فارسی)' },
        { code: 'pl', name: 'Polish (Polski)' },
        { code: 'pt', name: 'Portuguese (Português)' },
        { code: 'ro', name: 'Romanian (Română)' },
        { code: 'ru', name: 'Russian (Русский)' },
        { code: 'es', name: 'Spanish (Español)' },
        { code: 'ta', name: 'Tamil (தமிழ்)' },
        { code: 'th', name: 'Thai (ไทย)' },
        { code: 'tr', name: 'Turkish (Türkçe)' },
        { code: 'uk', name: 'Ukrainian (Українська)' },
        { code: 'vi', name: 'Vietnamese (Tiếng Việt)' }
    ];

    const handleColorSelect = (color) => { changeThemeColor(color); setColorModalVisible(false); };
    const handleLanguageSelect = (code) => { setLanguage(code); setLangModalVisible(false); };

    const renderSensitivityControl = (label, value, setter) => {
        const decrease = () => setter(prev => Math.max(0.1, parseFloat((prev - 0.1).toFixed(1))));
        const increase = () => setter(prev => Math.min(3.0, parseFloat((prev + 0.1).toFixed(1))));
        return (
            <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
                <View style={styles.stepperContainer}>
                    <TouchableOpacity onPress={decrease} style={[styles.stepperBtn, { backgroundColor: colors.glassInput }]}><Text style={[styles.stepperBtnText, { color: colors.text }]}>-</Text></TouchableOpacity>
                    <Text style={[styles.stepperValue, { color: themeColor }]}>{value.toFixed(1)}x</Text>
                    <TouchableOpacity onPress={increase} style={[styles.stepperBtn, { backgroundColor: colors.glassInput }]}><Text style={[styles.stepperBtnText, { color: colors.text }]}>+</Text></TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
            <LinearGradient colors={[themeColor, 'transparent']} start={{ x: 1, y: 0 }} end={{ x: 0.2, y: 0.75 }} style={styles.backgroundAccent} />

            <View style={styles.safeArea}>
                <View style={styles.headerContainer}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={[styles.backIcon, { color: colors.text }]}>←</Text></TouchableOpacity>
                    <View>
                        <Text style={[styles.titleText, { color: colors.text }]}>{t('settings_title')}</Text>
                        <View style={[styles.titleUnderline, { backgroundColor: themeColor }]} />
                    </View>
                </View>

                <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.sectionTitle, { color: colors.subText }]}>{t('general')}</Text>
                    <TouchableOpacity style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.7} onPress={() => setLangModalVisible(true)}>
                        <Text style={[styles.settingLabel, { color: colors.text }]}>{t('language')}</Text>
                        <Text style={[styles.valueIndicator, { color: themeColor }]}>{availableLanguages.find(l => l.code === language)?.name}</Text>
                    </TouchableOpacity>

                    <Text style={[styles.sectionTitle, { color: colors.subText, marginTop: 20 }]}>{t('appearance')}</Text>
                    <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.settingLabel, { color: colors.text }]}>{isDarkMode ? t('dark_mode') : t('light_mode')}</Text>
                        <Switch value={isDarkMode} onValueChange={toggleDarkMode} trackColor={{ false: 'rgba(0,0,0,0.2)', true: themeColor }} thumbColor={'#FFFFFF'} />
                    </View>
                    <TouchableOpacity style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.7} onPress={() => setColorModalVisible(true)}>
                        <Text style={[styles.settingLabel, { color: colors.text }]}>{t('theme_color')}</Text>
                        <View style={[styles.colorIndicator, { backgroundColor: themeColor }]} />
                    </TouchableOpacity>

                    <Text style={[styles.sectionTitle, { color: colors.subText, marginTop: 30 }]}>{t('touchpad')}</Text>
                    {renderSensitivityControl(t('cursor_sens'), cursorSensitivity, setCursorSensitivity)}
                    {renderSensitivityControl(t('scroll_sens'), scrollSensitivity, setScrollSensitivity)}
                    {renderSensitivityControl(t('zoom_sens'), zoomSensitivity, setZoomSensitivity)}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>

            {/* MODAL LIMBĂ ACTUALIZAT - FUNDAL NEGRU SOLID */}
            <Modal animationType="fade" transparent={true} visible={langModalVisible}>
                <View style={[styles.modalOverlay, { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)' }]}>
                    <View style={[styles.modalView, { backgroundColor: isDarkMode ? '#000000' : '#FFFFFF', borderColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{t('select_language')}</Text>
                        <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
                            {availableLanguages.map((lang) => (
                                <TouchableOpacity 
                                    key={lang.code} 
                                    style={[styles.langOption, { backgroundColor: colors.card, borderColor: language === lang.code ? themeColor : colors.border }]} 
                                    onPress={() => handleLanguageSelect(lang.code)}
                                >
                                    <Text style={[styles.langText, { color: colors.text }]}>{lang.name}</Text>
                                    {language === lang.code && <Text style={{ color: themeColor }}>✓</Text>}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={[styles.closeModalButton, { backgroundColor: colors.glassInput, borderColor: colors.border }]} onPress={() => setLangModalVisible(false)}>
                            <Text style={[styles.closeModalText, { color: colors.text }]}>{t('cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* MODAL CULORI ACTUALIZAT - FUNDAL NEGRU SOLID */}
            <Modal animationType="fade" transparent={true} visible={colorModalVisible}>
                <View style={[styles.modalOverlay, { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)' }]}>
                    <View style={[styles.modalView, { backgroundColor: isDarkMode ? '#000000' : '#FFFFFF', borderColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{t('choose_theme')}</Text>
                        <View style={styles.colorsGrid}>
                            {themeColors.map((color, index) => (
                                <TouchableOpacity key={index} style={[styles.colorOption, { backgroundColor: color.value }]} onPress={() => handleColorSelect(color.value)}>
                                    {themeColor === color.value && <Text style={styles.checkMark}>✓</Text>}
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={[styles.closeModalButton, { backgroundColor: colors.glassInput, borderColor: colors.border }]} onPress={() => setColorModalVisible(false)}>
                            <Text style={[styles.closeModalText, { color: colors.text }]}>{t('cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1 },
    backgroundAccent: { position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, opacity: 0.3 },
    safeArea: { flex: 1, alignItems: 'center', paddingTop: 60 },
    headerContainer: { flexDirection: 'row', alignItems: 'center', width: '85%', marginBottom: 30 },
    backButton: { marginRight: 20, padding: 10 },
    backIcon: { fontSize: 28 },
    titleText: { fontSize: 40, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -1 },
    titleUnderline: { width: 50, height: 4, marginTop: -5, marginLeft: 2 },
    scrollContainer: { flex: 1, width: '85%' },
    sectionTitle: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 15, marginLeft: 5 },
    settingCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, borderRadius: 18, marginBottom: 12, borderWidth: 1 },
    settingLabel: { fontSize: 18, fontWeight: '500' },
    valueIndicator: { fontSize: 16, fontWeight: '700' },
    colorIndicator: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#FFFFFF' },
    stepperContainer: { flexDirection: 'row', alignItems: 'center' },
    stepperBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    stepperBtnText: { fontSize: 20, fontWeight: 'bold' },
    stepperValue: { width: 50, textAlign: 'center', fontSize: 16, fontWeight: 'bold' },
    
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    modalView: { width: '85%', maxHeight: '80%', borderRadius: 25, padding: 25, alignItems: 'center', borderWidth: 1 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 25 },
    colorsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 },
    colorOption: { width: 60, height: 60, borderRadius: 30, margin: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255, 255, 255, 0.2)' },
    
    langOption: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
    langText: { fontSize: 16, fontWeight: '500' },
    checkMark: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
    closeModalButton: { marginTop: 10, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 15, borderWidth: 1 },
    closeModalText: { fontSize: 16, fontWeight: '600' }
});