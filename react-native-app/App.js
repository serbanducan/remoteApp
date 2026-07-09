import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';

import HomeScreen from "./Screens/HomeScreen.js" 
import RemoteScreen from "./Screens/RemoteScreen.js" 
import ComputerScreen from "./Screens/ComputerScreen.js" 
import SettingsScreen from "./Screens/SettingsScreen.js"
import KMControlScreen from "./Screens/RemoteScreens/KMControl/KMControlScreen.js"
import PowerScreen from "./Screens/RemoteScreens/PowerScreen.js"
import MediaScreen from "./Screens/RemoteScreens/MediaScreen.js"
import FileScreen from "./Screens/RemoteScreens/File/FileScreen.js"
import AddComputerScreen from "./Screens/ComputerScreens/AddComputerScreen.js"
import LocalComputersScreen from "./Screens/ComputerScreens/LocalComputersScreen.js"
import DisplayScreen from "./Screens/RemoteScreens/DisplayScreen.js"

// Importăm serviciul de WebSocket și noua Alertă
import WebSocketService, { serverConnect } from './Screens/WebSocket.js'
import CustomAlert, { alertRef } from './Screens/CustomAlert.js'; 

import { ThemeProvider } from './ThemeContext';
import { LanguageProvider } from './LanguageContext';

const Stack = createNativeStackNavigator();

export const navigationRef = createNavigationContainerRef();

const MyDarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0A0B10', 
  },
};

export default function App() {

  useEffect(() => {
    // Înregistrăm handler-ul de navigare pentru redirecționare la deconectare
    WebSocketService.setNavigationHandler((screenName) => {
      if (navigationRef.isReady()) {
        const currentRoute = navigationRef.getCurrentRoute();
        const remoteScreens = ['Remote', 'KMControl', 'Power', 'Media', 'File'];
        if (currentRoute && remoteScreens.includes(currentRoute.name)) {
          if (currentRoute.name !== screenName) {
            navigationRef.navigate(screenName);
          }
        }
      }
    });

    // Folosim funcția modernă de conectare care citește singură datele din fișier
    serverConnect(); 
  }, []);

  return (
  <LanguageProvider>
    <ThemeProvider>
      <NavigationContainer ref={navigationRef} theme={MyDarkTheme}>
        <Stack.Navigator
          screenOptions={{
            animationEnabled: false,
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{headerShown: false }}
          />
          <Stack.Screen 
            name="Remote" 
            component={RemoteScreen} 
            options={{headerShown: false }}
          />
          <Stack.Screen 
            name="Computer" 
            component={ComputerScreen} 
            options={{headerShown: false }}
          />
          <Stack.Screen 
            name="KMControl" 
            component={KMControlScreen} 
            options={{headerShown: false }}
          />
          <Stack.Screen 
            name="Power" 
            component={PowerScreen} 
            options={{headerShown: false }}
          />
          <Stack.Screen 
            name="Media" 
            component={MediaScreen} 
            options={{headerShown: false }}
          />
          <Stack.Screen 
            name="File" 
            component={FileScreen} 
            options={{headerShown: false }}
          />
          <Stack.Screen 
            name="Display" 
            component={DisplayScreen} 
            options={{headerShown: false }}
          />
          <Stack.Screen
            name="AddComputer"
            component={AddComputerScreen}
            options={{headerShown: false }}
          />
          <Stack.Screen 
            name="LocalComputers" 
            component={LocalComputersScreen} 
            options={{headerShown: false }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>

      {/* Alerta stă aici și va apărea peste orice ecran când este apelată */}
      <CustomAlert ref={alertRef} />
    </ThemeProvider>
  </LanguageProvider>
  );
}