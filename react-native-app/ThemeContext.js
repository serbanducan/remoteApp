import React, { createContext, useState, useContext, useEffect } from 'react';
import { File, Paths } from 'expo-file-system';

const ThemeContext = createContext();

// MODIFICARE: Salvăm acum toate setările în 'settings_config.json'
const settingsFile = new File(Paths.document, 'settings_config.json');

export const ThemeProvider = ({ children }) => {
  // --- SETĂRI ASPECT ---
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [themeColor, setThemeColor] = useState('#007AFF');
  
  // --- SETĂRI TOUCHPAD (NOU) ---
  const [cursorSensitivity, setCursorSensitivity] = useState(1.0);
  const [scrollSensitivity, setScrollSensitivity] = useState(1.0);
  const [zoomSensitivity, setZoomSensitivity] = useState(1.0);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeSettings = async () => {
      try {
        if (!settingsFile.exists) {
          // Structura implicită la prima deschidere a aplicației
          const defaultSettings = {
              isDarkMode: true,
              themeColor: '#007AFF',
              cursorSensitivity: 1.0,
              scrollSensitivity: 1.0,
              zoomSensitivity: 1.0
          }; 

          await settingsFile.write(JSON.stringify(defaultSettings));
        }
        else {
          const rawSettings = await settingsFile.text();
          const settings = JSON.parse(rawSettings);

          // Folosim "Fallback" (??) în caz că setările vechi nu aveau aceste chei
          setIsDarkMode(settings.isDarkMode ?? true);
          setThemeColor(settings.themeColor ?? '#007AFF');
          setCursorSensitivity(settings.cursorSensitivity ?? 1.0);
          setScrollSensitivity(settings.scrollSensitivity ?? 1.0);
          setZoomSensitivity(settings.zoomSensitivity ?? 1.0);
        }
      } catch (error) {
      } finally {
        setIsReady(true);
      }
    };

    initializeSettings();
  }, []);

  // Salvarea automată ori de câte ori ORICE setare se modifică
  useEffect(() => {
    if (isReady) {
      const persistSettings = async () => {
        try {
          const rawSettings = {
              isDarkMode: isDarkMode,
              themeColor: themeColor,
              cursorSensitivity: cursorSensitivity,
              scrollSensitivity: scrollSensitivity,
              zoomSensitivity: zoomSensitivity
          }; 

          await settingsFile.write(JSON.stringify(rawSettings));
        } catch (error) {
        }
      };

      persistSettings();
    }
  }, [isDarkMode, themeColor, cursorSensitivity, scrollSensitivity, zoomSensitivity, isReady]);

  // Paleta de culori sincronizată cu tema
  const colors = {
    primary: themeColor,
    background: isDarkMode ? '#0A0B10' : '#F2F2F7',
    text: isDarkMode ? '#FFFFFF' : '#1C1C1E',
    subText: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.5)',
    card: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)',
    border: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    glassInput: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
    statusDotRed: '#FF3B30',
    statusDotGreen: '#34C759',
  };

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);
  const changeThemeColor = (color) => setThemeColor(color);

  if (!isReady) return null;

  return (
    <ThemeContext.Provider value={{ 
        // Aspect
        isDarkMode, themeColor, colors, toggleDarkMode, changeThemeColor,
        // Touchpad
        cursorSensitivity, setCursorSensitivity,
        scrollSensitivity, setScrollSensitivity,
        zoomSensitivity, setZoomSensitivity
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);