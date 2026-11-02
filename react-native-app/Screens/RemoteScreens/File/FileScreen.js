import { StatusBar, Modal, Dimensions } from 'react-native';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import WebSocketService from '../../WebSocket';
import FileList from './FileList';
import { startHttpDownload } from './FileDownload';
import { File, Paths } from 'expo-file-system';
import * as FileSystem from 'expo-file-system';
import { getComputerData } from '../../ComputerScreens/ComputerManager';
import { showCustomAlert } from '../../CustomAlert';

import { useTheme } from '../../../ThemeContext'; 
import { useLanguage } from '../../../LanguageContext';

import { Platform } from 'react-native';
import { StorageAccessFramework } from 'expo-file-system';

const { width } = Dimensions.get('window');

export default function FileScreen({ navigation }) {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  
  const [selectedFileName, setSelectedFileName] = useState(null); 
  const [modalVisible, setModalVisible] = useState(false); 

  // State-uri noi pentru progres descărcare
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [selectedDirectoryUri, setSelectedDirectoryUri] = useState(null);

  const { isDarkMode, themeColor, colors } = useTheme();
  const { t } = useLanguage(); 

  useEffect(() => {
    WebSocketService.setFileListener((newData) => {
      setFiles(newData);
    });
    return () => WebSocketService.setFileListener(null);
  }, []);

  useEffect(() => {
    WebSocketService.setFileDownloadListener(async (msg) => {
      if (msg && msg.action === 'FORCE_DOWNLOAD') {
        const { token, fileName, port } = msg;
        try {
          const computerData = await getComputerData();
          const serverIp = computerData?.selectedComputer?.ip;
          if (!serverIp) {
            throw new Error(t('error_no_ip') || "Server IP not found.");
          }

          setDownloadStatus(t('downloading') || 'Downloading...');

          const finalFile = await startHttpDownload(serverIp, port, token, fileName);

          // Folosim Storage Access Framework (doar pe Android) pentru a salva fișierul decriptat
          if (Platform.OS === 'android' && selectedDirectoryUri) {
            try {
              const newFileUri = await StorageAccessFramework.createFileAsync(
                selectedDirectoryUri,
                fileName,
                'application/octet-stream' 
              );

              // Citim fișierul decriptat ca Base64
              const fileData = await FileSystem.readAsStringAsync(finalFile.uri, {
                encoding: FileSystem.EncodingType.Base64
              });

              // Îl scriem în locația publică aleasă
              await StorageAccessFramework.writeAsStringAsync(newFileUri, fileData, {
                encoding: FileSystem.EncodingType.Base64,
              });

              console.log("Fișier salvat cu succes în:", newFileUri);
            } catch (safError) {
              console.error("Eroare la mutarea fișierului prin SAF:", safError);
              throw new Error("Nu s-a putut salva fișierul în folderul selectat.");
            }
          }

          setIsDownloading(false);
          setDownloadStatus('');
          setSelectedDirectoryUri(null); // Resetăm folderul ales

          showCustomAlert(
            t('download_success_title') || 'Download Success',
            `${t('download_success_msg') || 'File downloaded successfully:'}\n${fileName}`
          );
        } catch (error) {
          setIsDownloading(false);
          setDownloadStatus('');
          setSelectedDirectoryUri(null);
          showCustomAlert(
            t('download_error_title') || 'Download Error',
            error.message || 'An error occurred during download.'
          );
        }
      }
    });
    return () => WebSocketService.setFileDownloadListener(null);
  }, [t, selectedDirectoryUri]); // Am adăugat selectedDirectoryUri la dependințe

  useEffect(() => {
    WebSocketService.sendCommand('FILE_SYSTEM', 'SHOW', { path: currentPath });
  }, [currentPath]);

  function onUp(folderName){
    let path = currentPath.toString() + folderName + '\\';
    setCurrentPath(path);
  }

  function onDown(){
    if (currentPath === "") return;
    let path = currentPath.toString();
    let poz = path.lastIndexOf('\\'); 
    path = path.substring(0, poz);
    poz = path.lastIndexOf('\\');
    path = path.substring(0, poz + 1);
    setCurrentPath(path);
  }

  function onFile(fileName){
    setSelectedFileName(fileName);
    handleDownload(fileName); // Apelăm direct logica de download fără modal!
  }

  async function handleDownload(fileName) {
    if (Platform.OS === 'android') {
      try {
        const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          setSelectedDirectoryUri(permissions.directoryUri);
        } else {
          // Utilizatorul a anulat alegerea folderului, oprim descărcarea.
          return;
        }
      } catch (e) {
        console.error("Eroare la cererea permisiunilor SAF:", e);
        // Fallback dacă SAF nu funcționează (ex. Android vechi sau setări stricte)
      }
    }

    setModalVisible(false); 
    setIsDownloading(true);
    setDownloadStatus(t('requesting_ticket') || 'Requesting ticket...');

    let fullPath = currentPath.toString() + fileName;
    WebSocketService.sendCommand('FILE_SYSTEM', 'REQUEST_DOWNLOAD', { path: fullPath });
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <LinearGradient
        colors={[themeColor, 'transparent']}
        start={{ x: 1, y: 0 }} end={{ x: 0.2, y: 0.75 }}
        style={styles.backgroundAccent}
      />

      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => onDown()}>
            <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <View>
            <Text style={[styles.titleText, { color: colors.text }]}>{t('files_title')}</Text>
            <View style={[styles.titleUnderline, { backgroundColor: themeColor }]} />
        </View>
      </View>

      <View style={[styles.pathNavigationContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.pathTextContainer}>
          <Text style={[styles.pathText, { color: colors.subText }]} numberOfLines={1} ellipsizeMode="middle">
            {currentPath || t('root_directory')}
          </Text>
        </View>
      </View>
      
      <View style={styles.listContainer}>
        <FileList files={files} onFolderPress={onUp} onFilePress={onFile} />
      </View>

      {/* Modalul pentru selecție fișier și inițiere descărcare */}
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0,0,0,0.4)' }]}>
          <View style={[styles.modalView, { backgroundColor: colors.background, borderColor: themeColor }]}>
            
            <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedFileName}</Text>
            
            <TouchableOpacity style={[styles.modalButtonDownload, { backgroundColor: `${themeColor}20`, borderColor: themeColor }]} onPress={handleDownload}>
              <Text style={[styles.modalButtonTextDownload, { color: colors.text }]}>{t('download_file')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonTextCancel}>{t('cancel')}</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* Modalul pentru progresul descărcării */}
      <Modal animationType="fade" transparent={true} visible={isDownloading}>
        <View style={[styles.modalOverlay, { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalView, { backgroundColor: colors.background, borderColor: themeColor }]}>
            
            <Text style={[styles.progressTitle, { color: colors.text }]}>
              {t('downloading_file') || 'Downloading File'}
            </Text>
            
            <Text style={[styles.progressFileName, { color: colors.subText }]} numberOfLines={1} ellipsizeMode="middle">
              {selectedFileName}
            </Text>
            

            
            <Text style={[styles.progressStatusText, { color: colors.text }]}>
              {downloadStatus}
            </Text>

          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, alignItems: 'center', paddingTop: StatusBar.currentHeight || 20 },
  backgroundAccent: { position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, opacity: 0.3 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', width: '85%', marginBottom: 20, marginTop: 10 },
  backButton: { marginRight: 20, padding: 10 },
  backIcon: { fontSize: 28, fontWeight: '300' },
  titleText: { fontSize: 32, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -1 },
  titleUnderline: { width: 40, height: 4, marginTop: -5, marginLeft: 2 },
  pathNavigationContainer: { width: '90%', borderRadius: 15, padding: 15, marginBottom: 20, borderWidth: 1 },
  pathTextContainer: { width: '100%' },
  pathText: { fontSize: 14, fontStyle: 'italic' },
  listContainer: { flex: 1, width: '90%' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalView: { width: '85%', borderRadius: 25, padding: 25, alignItems: 'center', borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' },
  modalButtonDownload: { width: '100%', padding: 15, borderRadius: 15, marginBottom: 10, alignItems: 'center', borderWidth: 1 },
  modalButtonTextDownload: { fontSize: 16, fontWeight: 'bold' },
  modalButtonCancel: { backgroundColor: 'rgba(255, 69, 58, 0.1)', width: '100%', padding: 15, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 69, 58, 0.3)' },
  modalButtonTextCancel: { color: '#FF453A', fontSize: 16, fontWeight: 'bold' },

  // Stiluri noi pentru progres descărcare
  progressTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  progressFileName: { fontSize: 14, marginBottom: 20, textAlign: 'center', width: '90%' },
  progressBarContainer: { width: '100%', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 15 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressStatusText: { fontSize: 14, fontWeight: '600', textAlign: 'center' }
});