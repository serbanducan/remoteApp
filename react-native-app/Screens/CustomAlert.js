import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useTheme } from './../ThemeContext'; 
import { useLanguage } from './../LanguageContext'; // IMPORT NOU

export const alertRef = React.createRef();

export const showCustomAlert = (title, message, onClose) => {
  if (alertRef.current) {
    alertRef.current.show(title, message, onClose);
  }
};

const CustomAlert = forwardRef((props, ref) => {
  // Folosim o coadă (Queue) pentru a respecta ordinea cronologică (FIFO)
  const [alertQueue, setAlertQueue] = useState([]);
  
  const { isDarkMode, themeColor, colors } = useTheme();
  const { t } = useLanguage(); // EXTRAGEM FUNCȚIA DE TRADUCERE

  useImperativeHandle(ref, () => ({
    show: (newTitle, newMessage, onCloseCallback) => {
      // MODIFICARE: Adăugăm noua alertă la FINALUL listei
      // Astfel, alertele vechi sunt afișate primele, în ordinea în care au fost declanșate.
      setAlertQueue(currentQueue => [
        ...currentQueue,
        { title: newTitle, message: newMessage, onClose: onCloseCallback }
      ]);
    },
    hide: () => {
      setAlertQueue([]); 
    }
  }));

  const handleClose = () => {
    const currentAlert = alertQueue[0];
    setAlertQueue(currentQueue => {
      const newQueue = [...currentQueue];
      newQueue.shift(); // Șterge alerta pe care tocmai ai citit-o, făcând loc următoarei
      return newQueue;
    });
    if (currentAlert && currentAlert.onClose) {
      setTimeout(() => {
        currentAlert.onClose();
      }, 100);
    }
  };

  const isVisible = alertQueue.length > 0;
  // Extragem mereu prima alertă din coadă (cea mai veche nerezolvată)
  const currentAlert = alertQueue[0];

  return (
    <Modal 
      animationType="fade" 
      transparent={true} 
      visible={isVisible} 
      onRequestClose={handleClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.4)' }]}>
        {currentAlert && (
          <View style={[styles.modalView, { backgroundColor: colors.background, borderColor: themeColor, shadowColor: themeColor }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{currentAlert.title}</Text>
            <Text style={[styles.modalMessage, { color: colors.subText }]}>{currentAlert.message}</Text>
            
            <TouchableOpacity 
              style={[styles.modalButton, { borderColor: themeColor, backgroundColor: `${themeColor}20` }]} 
              activeOpacity={0.8} 
              onPress={handleClose}
            >
              <Text style={[styles.modalButtonText, { color: colors.text }]}>{t('ok_button')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
});

export default CustomAlert;

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalView: { 
    width: '80%', 
    borderRadius: 25, 
    padding: 25, 
    alignItems: 'center', 
    borderWidth: 1, 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.4, 
    shadowRadius: 20, 
    elevation: 15 
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 10, 
    textAlign: 'center' 
  },
  modalMessage: { 
    fontSize: 16, 
    textAlign: 'center', 
    marginBottom: 25, 
    lineHeight: 22 
  },
  modalButton: { 
    width: '100%', 
    padding: 15, 
    borderRadius: 15, 
    alignItems: 'center', 
    borderWidth: 1 
  }
});