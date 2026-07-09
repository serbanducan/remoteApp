import React, { useState } from 'react';
import { 
    StyleSheet, Text, View, TouchableOpacity, TextInput, StatusBar, 
    Dimensions, Image, KeyboardAvoidingView, ScrollView, Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AddComputer, EditComputer } from './ComputerManager.js';
import { serverConnect } from '../WebSocket.js';
import { showCustomAlert } from '../CustomAlert.js';
import { useTheme } from '../../ThemeContext';
import { useLanguage } from '../../LanguageContext'; // IMPORT NOU

const { width } = Dimensions.get('window');

export default function AddComputerScreen({ route, navigation }) {
    const { isDarkMode, themeColor, colors } = useTheme();
    const { t } = useLanguage(); // EXTRAGERE FUNCȚIE TRADUCERE

    const { editMode, computerToEdit } = route?.params || {};

    const [computerName, setComputerName] = useState(computerToEdit?.name || '');
    const [ipAdress, setIpAdress] = useState(computerToEdit?.ip || '');
    const [portNr, setPortNr] = useState(computerToEdit?.port ? computerToEdit.port.toString() : '');
    const [serverPassword, setServerPassword] = useState(computerToEdit?.password || '');
    const [macAddress, setMacAddress] = useState(computerToEdit?.macAddress || '');
    
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const onSaveComputer = async () => {
        if(computerName != '' && ipAdress != '' && portNr != '' && serverPassword != ''){
            let formattedMac = macAddress.trim();
            if (formattedMac.length > 0) {
                const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
                if (!macRegex.test(formattedMac)) {
                    showCustomAlert("Eroare MAC", "Adresa MAC trebuie să aibă formatul valid (ex: AA:BB:CC:DD:EE:FF)");
                    return;
                }
            }

            // Validare IP
            const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
            if (!ipRegex.test(ipAdress.trim())) {
                showCustomAlert("Eroare IP", "Adresa IP introdusă nu este un format IPv4 valid (ex: 192.168.1.100).");
                return;
            }

            // Validare Port
            const portNumber = parseInt(portNr.trim(), 10);
            if (isNaN(portNumber) || portNumber <= 0 || portNumber > 65535) {
                showCustomAlert("Eroare Port", "Portul trebuie să fie un număr între 1 și 65535.");
                return;
            }

            if(computerName.length <= 20){
                let selectedComputerID;
                if (editMode) {
                    selectedComputerID = await EditComputer(computerToEdit.id, computerName, ipAdress, portNr, serverPassword, macAddress);
                } else {
                    await AddComputer(computerName, ipAdress, portNr, serverPassword, macAddress);
                }
                
                if(!editMode) {
                    serverConnect();
                } else if(selectedComputerID == computerToEdit.id) {
                    serverConnect();
                }
                navigation.navigate('Computer');  
            } else {
                // TRADUS ALERTA
                showCustomAlert(t('alert_name_long_title'), t('alert_name_long_msg'));
            }
        } else {
            // TRADUS ALERTA
            showCustomAlert(t('alert_incomplete_title'), t('alert_incomplete_msg'));
        }
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
                <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

                <LinearGradient colors={[themeColor, 'transparent']} start={{ x: 1, y: 0 }} end={{ x: 0.2, y: 0.75 }} style={styles.backgroundAccent} />

                <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" >
                    <View style={styles.headerContainer}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
                        </TouchableOpacity>
                        <View>
                            <Text style={[styles.titleText, { color: colors.text }]}>
                                {editMode ? t('edit_device') : t('add_device')}
                            </Text>
                            <View style={[styles.titleUnderline, { backgroundColor: themeColor }]} />
                        </View>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputSection}>
                            <Text style={[styles.label, { color: colors.subText }]}>{t('label_computer_name')}</Text>
                            <TextInput
                                style={[styles.glassInput, { backgroundColor: colors.glassInput, borderColor: colors.border, color: colors.text }]}
                                value={computerName} 
                                onChangeText={setComputerName}
                                placeholder={t('placeholder_name')}
                                placeholderTextColor={colors.subText}
                            />
                        </View>

                        <View style={styles.inputSection}>
                            <Text style={[styles.label, { color: colors.subText }]}>{t('label_ip_address')}</Text>
                            <TextInput
                                style={[styles.glassInput, { backgroundColor: colors.glassInput, borderColor: colors.border, color: colors.text }]}
                                value={ipAdress} 
                                onChangeText={setIpAdress}
                                placeholder={t('placeholder_ip')}
                                placeholderTextColor={colors.subText}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputSection}>
                            <Text style={[styles.label, { color: colors.subText }]}>{t('label_mac_address')}</Text>
                            <TextInput
                                style={[styles.glassInput, { backgroundColor: colors.glassInput, borderColor: colors.border, color: colors.text }]}
                                value={macAddress} 
                                onChangeText={setMacAddress}
                                placeholder={t('placeholder_mac')}
                                placeholderTextColor={colors.subText}
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={styles.inputSection}>
                            <Text style={[styles.label, { color: colors.subText }]}>{t('label_port_number')}</Text>
                            <TextInput
                                style={[styles.glassInput, { backgroundColor: colors.glassInput, borderColor: colors.border, color: colors.text }]}
                                value={portNr} 
                                onChangeText={setPortNr}
                                placeholder={t('placeholder_port')}
                                placeholderTextColor={colors.subText}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputSection}>
                            <Text style={[styles.label, { color: colors.subText }]}>{t('label_server_password')}</Text>
                            <View style={[styles.passwordContainer, { backgroundColor: colors.glassInput, borderColor: colors.border }]}>
                                <TextInput
                                    style={[styles.passwordInput, { color: colors.text }]}
                                    value={serverPassword} 
                                    onChangeText={setServerPassword}
                                    placeholder={t('placeholder_password')}
                                    placeholderTextColor={colors.subText}
                                    secureTextEntry={!isPasswordVisible}
                                />
                                <TouchableOpacity style={styles.eyeIconContainer} activeOpacity={0.7} onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                    <Image source={isPasswordVisible ? require('../../assets/icons/visible-icon.png') : require('../../assets/icons/hide-icon.png')} style={[styles.eyeIcon, { tintColor: colors.subText }]} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.AddButton, { borderColor: themeColor }]} activeOpacity={0.9} onPress={onSaveComputer} >
                        <LinearGradient colors={[`${themeColor}80`, `${themeColor}20`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.addGradient}>
                            <Text style={[styles.AddButtonText, { color: colors.text }]}>
                                {editMode ? t('update_computer') : t('save_computer')}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1 },
    backgroundAccent: { position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, opacity: 0.3 },
    scrollContainer: { flexGrow: 1, alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
    headerContainer: { flexDirection: 'row', alignItems: 'center', width: '85%', marginBottom: 20 },
    backButton: { marginRight: 20, padding: 10 },
    backIcon: { fontSize: 28, fontWeight: '300' },
    titleText: { fontSize: 36, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -1 },
    titleUnderline: { width: 50, height: 4, marginTop: -5, marginLeft: 2 },
    formContainer: { width: '85%', marginTop: 20, marginBottom: 30 },
    inputSection: { marginBottom: 25 },
    label: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, marginLeft: 5 },
    glassInput: { fontSize: 16, height: 60, borderRadius: 15, paddingHorizontal: 20, borderWidth: 1 },
    passwordContainer: { flexDirection: 'row', alignItems: 'center', height: 60, borderRadius: 15, borderWidth: 1 },
    passwordInput: { flex: 1, fontSize: 16, height: '100%', paddingHorizontal: 20 },
    eyeIconContainer: { paddingHorizontal: 15, height: '100%', justifyContent: 'center', alignItems: 'center' },
    eyeIcon: { width: 24, height: 24, resizeMode: 'contain' },
    AddButton: { width: width * 0.85, height: 60, borderRadius: 30, overflow: 'hidden', borderWidth: 1, marginTop: 'auto' },
    addGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    AddButtonText: { fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 }
});