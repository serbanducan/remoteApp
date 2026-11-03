import React from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useTheme } from '../../../ThemeContext'; 

export default function FileList({ files, onFolderPress, onFilePress }) {
    const { themeColor, colors } = useTheme();

    function truncateText(text, maxLength = 25) {
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }
        return text;
    }

    function renderItems() {
        if (!files || !Array.isArray(files)) return null;

        return files.map((item, index) => {
            const isFolderOrDrive = item.type === 'directory' || item.type === 'drive';
            const iconSource = isFolderOrDrive 
                ? require("../../../assets/icons/folder-icon.png") 
                : require("../../../assets/icons/file-icon.png");
            
            const iconStyle = [
                isFolderOrDrive ? styles.FolderIcon : styles.FileIcon, 
                { tintColor: isFolderOrDrive ? themeColor : colors.text }
            ];
            
            const handlePress = () => {
                if (isFolderOrDrive) {
                    onFolderPress(item.name);
                } else {
                    onFilePress(item.name);
                }
            };

            return (
                <TouchableOpacity
                    key={index} 
                    style={[styles.File, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.7}
                    onPress={handlePress}
                >
                    <Image source={iconSource} style={iconStyle} resizeMode="contain" />
                    <Text style={[styles.IconText, { color: colors.text }]}>{truncateText(item.name)}</Text>
                </TouchableOpacity>
            );
        });
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {renderItems()}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, width: '100%' },
    File: { flexDirection: 'row', width: '100%', height: 65, borderRadius: 18, marginBottom: 12, alignItems: "center", paddingHorizontal: 20, borderWidth: 1 },
    FolderIcon: { width: 30, height: 30, marginRight: 15 },
    FileIcon: { width: 25, height: 30, marginRight: 15 },
    IconText: { fontSize: 18, fontWeight: '500', letterSpacing: 0.5 }
}); 