import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity } from 'react-native';
import WebSocketService from '../../WebSocket';

import { useTheme } from '../../../ThemeContext'; 
import { useLanguage } from '../../../LanguageContext'; // IMPORT NOU

export default function Keyboard() {
    const { colors } = useTheme(); 
    const { t } = useLanguage(); // EXTRAGERE FUNCȚIE TRADUCERE
    
    const [text, setText] = useState('');
    const [cursorPosition, setCursorPosition] = useState({ start: 0, end: 0 });
    const [commandText, setCommandText] = useState('');
    const [commadCursorPosition, setCommandCurosrPosition] = useState({ start: 0, end: 0 });

    const handleSelectionChange = () => {
        setCursorPosition({ start: text.length, end: text.length });
    };

    function handleKeyPress(e) {
        let key = e.nativeEvent.key;
        if(key != 'Backspace' && key != 'Enter'){
            key = key.charCodeAt(0);
        }
        else if(key == 'Backspace'){
            key = 8;
        }
        else if(key == 'Enter'){
            key = 13;
        }
        WebSocketService.sendCommand('KM', 'KEYBOARD', { type: 'press', key: key });
    };

    const handleCommandSelectionChange = () => {
        setCommandCurosrPosition({ start: commandText.length, end: commandText.length });
    }; 

    function handelCommandTextChange(newText){
        if(commandText != ''){
            if(commandText < newText)
                setCommandText(commandText + " + " + newText[newText.length - 1]);
            else{
                let poz = commandText.lastIndexOf('+');
                if(poz != -1)
                    setCommandText(commandText.substring(0, poz - 1));
                else
                    setCommandText('');
            }
        }
        else{
            setCommandText(newText);
        }
    }

    const onCommandPressed = (command) => () => {
        setCommandText((prevCommandText) => prevCommandText + (prevCommandText ? ' + ' : '') + command.toSend);
    };

    function resetCommandText(){
        setCommandText('');
    }

    function onCommandSumbmit(command){
        resetCommandText();
        WebSocketService.sendCommand('KM', 'KEYBOARD', { type: 'shortcut', command: command });
    }
    
    const Commands1 = [
        { text: 'WIN', toSend: 'win' }, 
        { text: 'CTRL', toSend: 'control' }, 
        { text: 'SHIFT', toSend: 'shift' }, 
        { text: 'ALT', toSend: 'alt' }, 
        { text: 'TAB', toSend: 'tab' }, 
        { text: 'FN', toSend: 'fn' }
    ];
      
    const Commands2 = [
        { text: 'ENT', toSend: 'enter' }, 
        { text: 'ESC', toSend: 'escape' }, 
        { text: 'INS', toSend: 'insert' }, 
        { text: 'DEL', toSend: 'delete' }, 
        { text: 'HOME', toSend: 'home' }, 
        { text: 'END', toSend: 'end' }
    ];
      
    const Function1_6 = [
        { text: 'F1', toSend: 'f1' }, 
        { text: 'F2', toSend: 'f2' }, 
        { text: 'F3', toSend: 'f3' }, 
        { text: 'F4', toSend: 'f4' }, 
        { text: 'F5', toSend: 'f5' }, 
        { text: 'F6', toSend: 'f6' }
    ];
      
    const Function7_12 = [
        { text: 'F7', toSend: 'f7' }, 
        { text: 'F8', toSend: 'f8' }, 
        { text: 'F9', toSend: 'f9' }, 
        { text: 'F10', toSend: 'f10' }, 
        { text: 'F11', toSend: 'f11' }, 
        { text: 'F12', toSend: 'f12' }
    ];

    return(
        <View style={styles.container}>
            <TextInput 
                style={[styles.KeyboradInput, { backgroundColor: colors.glassInput, borderColor: colors.border, color: colors.text }]}
                placeholder={t('keyboard_typing_placeholder')}
                placeholderTextColor={colors.subText}
                onKeyPress={handleKeyPress}
                onChangeText={(text) => {setText(text)}}
                value={text}
                onSelectionChange={handleSelectionChange}
                selection={cursorPosition}
                multiline={true}
                caretHidden={true}
            />

            <TextInput
                style={[styles.CommandInput, { backgroundColor: colors.glassInput, borderColor: colors.border, color: colors.text }]}
                placeholder={t('keyboard_command_placeholder')}
                placeholderTextColor={colors.subText}
                onChangeText={handelCommandTextChange}
                value={commandText}
                onSelectionChange={handleCommandSelectionChange}
                selection={commadCursorPosition}
                onSubmitEditing={() => onCommandSumbmit(commandText)}
                caretHidden={true}
            />

            <View style={styles.buttonView}> 
               {Commands1.map(command =>(
                    <TouchableOpacity 
                        style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={onCommandPressed(command)}
                        key={command.text}
                    >
                        <Text style={[styles.ButtonText, { color: colors.text }]}> {command.text} </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.buttonView}> 
                {Commands2.map(command =>(
                     <TouchableOpacity 
                         style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }]}
                         onPress={onCommandPressed(command)}
                         key={command.text}
                     >
                        <Text style={[styles.ButtonText, { color: colors.text }]}> {command.text} </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.buttonView}> 
                {Function1_6.map(command =>(
                     <TouchableOpacity 
                         style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }]}
                         onPress={onCommandPressed(command)}
                         key={command.text}
                     >
                        <Text style={[styles.ButtonText, { color: colors.text }]}> {command.text} </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.buttonView}> 
                {Function7_12.map(command =>(
                     <TouchableOpacity 
                         style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }]}
                         onPress={onCommandPressed(command)}
                         key={command.text}
                     >
                        <Text style={[styles.ButtonText, { color: colors.text }]}> {command.text} </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.buttonView}> 
                <TouchableOpacity style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onCommandPressed({toSend: 'pagedown' })}>
                    <Text style={[styles.ButtonText, { color: colors.text }]}> PGDN </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onCommandPressed({toSend: 'up' })}>
                    <Text style={[styles.ButtonText, { color: colors.text }]}> UP </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onCommandPressed({toSend: 'pageup' })}>
                    <Text style={[styles.ButtonText, { color: colors.text }]}> PGUP </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.buttonView}> 
                <TouchableOpacity style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onCommandPressed({toSend: 'left' })}>
                    <Text style={[styles.ButtonText, { color: colors.text }]}> LEFT </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onCommandPressed({toSend: 'down' })}>
                    <Text style={[styles.ButtonText, { color: colors.text }]}> DOWN </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onCommandPressed({toSend: 'right' })}>
                    <Text style={[styles.ButtonText, { color: colors.text }]}> RIGHT </Text>
                </TouchableOpacity>
            </View>

        </View>
    )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', alignItems: 'center', paddingBottom: 20, width: '100%' },
  button: { alignItems: 'center', justifyContent: "center", borderWidth: 1, height: 38, width: 58, borderRadius: 10, margin: 4 },
  KeyboradInput:{ borderWidth: 1, width: '95%', height: 100, borderRadius: 15, margin: 20, textAlignVertical: 'top', textAlign: 'left', padding: 15, fontSize: 15 },
  CommandInput:{ borderWidth: 1, width: '95%', height: 50, borderRadius: 15, marginBottom: 20, padding: 15, fontSize: 15 },
  buttonView: { flexDirection: 'row' },
  ButtonText: { fontSize: 12, margin: 5, fontWeight: 'bold' }
});