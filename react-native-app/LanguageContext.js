import React, { createContext, useState, useContext, useEffect } from 'react';
import { File, Paths } from 'expo-file-system';
import { translations } from './translations'; // IMPORTĂM DICȚIONARUL

const LanguageContext = createContext();
const languageFile = new File(Paths.document, 'language_config.json');

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        if (!languageFile.exists) {
          await languageFile.write(JSON.stringify({ language: 'en' }));
        } else {
          const raw = await languageFile.text();
          const settings = JSON.parse(raw);
          setLanguage(settings.language ?? 'en');
        }
      } catch (error) {
      } finally {
        setIsReady(true);
      }
    };
    initializeLanguage();
  }, []);

  useEffect(() => {
    if (isReady) {
      const persist = async () => {
        try {
          await languageFile.write(JSON.stringify({ language }));
        } catch (error) {
        }
      };
      persist();
    }
  }, [language, isReady]);

  // FUNCȚIA MAGICĂ DE TRADUCERE
  const t = (key) => {
    return translations[language]?.[key] || key; 
  };

  if (!isReady) return null;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);