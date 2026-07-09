import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; 
import { LinearGradient } from 'expo-linear-gradient';
import WebSocketService, { serverConnect } from './WebSocket';
import { getComputerData, selectComputer, deleteComputer } from './ComputerScreens/ComputerManager';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';

const { width } = Dimensions.get('window');

export default function ComputerScreen({ navigation }) {
  const [computersData, setComputersData] = useState(null); 
  const { isDarkMode, themeColor, colors } = useTheme();
  const { t } = useLanguage();

  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        const fileData = await getComputerData();
        setComputersData(fileData); 
      };
      loadData(); 
    }, [])
  );

  const handleSelect = async (computerID) => {
    WebSocketService.getInstance().disconnect();
    const newData = await selectComputer(computersData, computerID);
    setComputersData(newData);
    serverConnect();
  };

  const handleDelete = async (computerID) => {
    const newData = await deleteComputer(computersData, computerID);
    setComputersData(newData);
  };

  let selectedComputer = computersData?.selectedComputer || null;
  let computersList = computersData?.computers || null;
  
  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <LinearGradient colors={[themeColor, 'transparent']} start={{ x: 1, y: 0 }} end={{ x: 0.2, y: 0.75 }} style={styles.backgroundAccent} />

      <View style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={[styles.backIcon, { color: colors.text }]}>←</Text></TouchableOpacity>
          <View>
            <Text style={[styles.titleText, { color: colors.text }]}>{t('computers_title')}</Text>
            <View style={[styles.titleUnderline, { backgroundColor: themeColor }]} />
          </View>
        </View>

        <View style={styles.selectedPanel}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>{t('selected_device')}</Text>
          {selectedComputer ? (
            <View style={[styles.activeDetails, { backgroundColor: colors.card, borderColor: themeColor }]}>
              <View>
                <Text style={[styles.activeComputerName, { color: colors.text }]}>{selectedComputer.name}</Text>
                <Text style={[styles.activeComputerIP, { color: colors.subText }]}>{selectedComputer.ip} : {selectedComputer.port}</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.activeDetails, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyStateText, { color: colors.subText }]}>{t('no_active_computer')}</Text>
            </View>
          )}
        </View>

        <View style={styles.listContainer}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>{t('saved_devices')}</Text>
          {computersList != null && computersList.length > 0 ? (
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {computersList.map((computer, index) => {
                const isSelected = selectedComputer && selectedComputer.id === computer.id;
                return (
                  <View key={index} style={[styles.computerCard, { backgroundColor: colors.card, borderColor: colors.border }, isSelected && styles.computerCardSelected]}>
                    <View style={styles.computerInfo}>
                      <Text style={[styles.computerName, { color: colors.text }]}>{computer.name}</Text>
                      <Text style={[styles.computerIP, { color: colors.subText }]}>{computer.ip}</Text>
                    </View>
                    <View style={styles.actionButtons}>
                      {!isSelected && (
                        <TouchableOpacity style={[styles.actionBtnSelect, { borderColor: themeColor, backgroundColor: `${themeColor}20` }]} onPress={() => handleSelect(computer)}>
                          <Text style={[styles.actionBtnTextSelect, { color: themeColor }]}>{t('btn_connect_card')}</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={[styles.actionBtnEdit, { borderColor: '#FF9500', backgroundColor: 'rgba(255, 149, 0, 0.15)' }]} onPress={() => navigation.navigate('AddComputer', { editMode: true, computerToEdit: computer })}>
                        <Text style={styles.actionBtnTextEdit}>{t('btn_edit')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtnDelete, { borderColor: '#FF3B30', backgroundColor: 'rgba(255, 59, 48, 0.15)' }]} onPress={() => handleDelete(computer.id)}><Text style={styles.actionBtnTextDelete}>X</Text></TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyListContainer}><Text style={[styles.emptyStateText, { color: colors.subText }]}>{t('no_saved_computers')}</Text></View>
          )}
        </View>

        <TouchableOpacity style={[styles.AddButton, { borderColor: themeColor }]} activeOpacity={0.9} onPress={() => navigation.navigate('LocalComputers')}>
          <LinearGradient colors={[`${themeColor}80`, `${themeColor}20`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.addGradient}>
            <Text style={[styles.AddButtonText, { color: colors.text }]}>{t('add_new_computer')}</Text>
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
  titleText: { fontSize: 40, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -1 },
  titleUnderline: { width: 50, height: 4, marginTop: -5, marginLeft: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 15, marginLeft: 5 },
  selectedPanel: { width: '85%', marginBottom: 25 },
  activeDetails: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 1 },
  activeComputerName: { fontSize: 22, fontWeight: 'bold' },
  activeComputerIP: { fontSize: 14, marginTop: 4 },
  listContainer: { flex: 1, width: '85%' },
  scrollView: { flex: 1 },
  computerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 18, paddingVertical: 15, paddingHorizontal: 20, marginBottom: 12, borderWidth: 1 },
  computerCardSelected: { opacity: 0.5 },
  computerInfo: { flex: 1 },
  computerName: { fontSize: 18, fontWeight: '600' },
  computerIP: { fontSize: 12, marginTop: 4 },
  actionButtons: { flexDirection: 'row', alignItems: 'center' },
  actionBtnSelect: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 12, marginRight: 10, borderWidth: 1 },
  actionBtnTextSelect: { fontSize: 14, fontWeight: 'bold' },
  actionBtnEdit: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 12, marginRight: 10, borderWidth: 1 },
  actionBtnTextEdit: { color: '#FF9500', fontSize: 14, fontWeight: 'bold' },
  actionBtnDelete: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  actionBtnTextDelete: { color: '#FF3B30', fontSize: 16, fontWeight: 'bold' },
  emptyStateText: { fontSize: 16, fontStyle: 'italic' },
  emptyListContainer: { alignItems: 'center', paddingTop: 30 },
  AddButton: { width: width * 0.85, height: 60, borderRadius: 30, overflow: 'hidden', marginBottom: 40, borderWidth: 1 },
  addGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  AddButtonText: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 }
});