import React, { useEffect, useRef, useMemo } from 'react';
import { View, PanResponder, StyleSheet, Text } from 'react-native';
import WebSocketService from '../../WebSocket';
import { useTheme } from '../../../ThemeContext'; 
import { useLanguage } from '../../../LanguageContext'; // IMPORT NOU

export default function TouchPad() {
    // Extragem TOATE setările din Contextul nostru global
    const { 
        themeColor, 
        colors, 
        cursorSensitivity, 
        scrollSensitivity, 
        zoomSensitivity 
    } = useTheme();

    // Extragem funcția de traducere
    const { t } = useLanguage();

    // ==========================================
    // VARIABILE LOCALE (useRef)
    // ==========================================
    const touches = useRef([
        { isSet: false, id: null, firstTouch: {posX: 0, posY: 0 }, lastTouch: {posX: 0, posY: 0 } },
        { isSet: false, id: null, firstTouch: {posX: 0, posY: 0 }, lastTouch: {posX: 0, posY: 0 } },
        { isSet: false, id: null, firstTouch: {posX: 0, posY: 0 }, lastTouch: {posX: 0, posY: 0 } },
    ]);

    const firstTouchTime = useRef(0);  
    const lastTouchNumber = useRef(0);
    const maxTouchNumber = useRef(0);
    const Select = useRef(false);
    const lastSendTime = useRef(0);

    // NOU: Buzunar secret pentru sensibilități (prevenim Stale Closures)
    const activeSensitivities = useRef({
        cursor: 1.0,
        scroll: 1.0,
        zoom: 1.0
    });

    // NOU: useEffect care ține sensibilitățile actualizate în fundal
    useEffect(() => {
        activeSensitivities.current = {
            cursor: cursorSensitivity,
            scroll: scrollSensitivity,
            zoom: zoomSensitivity
        };
    }, [cursorSensitivity, scrollSensitivity, zoomSensitivity]);

    // ==========================================
    // LOGICĂ GESTIONARE DEGETE (SLOT SYSTEM)
    // ==========================================

    const addTouches = (currentTouches) => {
        currentTouches.forEach(touch => {
            const isTracked = touches.current.find(t => t.isSet && t.id === touch.identifier);
            if (!isTracked) {
                const freeSlot = touches.current.find(t => !t.isSet);
                if (freeSlot) {
                    freeSlot.isSet = true;
                    freeSlot.id = touch.identifier;
                    freeSlot.firstTouch.posX = freeSlot.lastTouch.posX = touch.pageX; 
                    freeSlot.firstTouch.posY = freeSlot.lastTouch.posY = touch.pageY; 
                }
            }
        });
    };

    const removeTouches = (currentTouches) => {
        touches.current.forEach(slot => {
            if (slot.isSet) {
                const stillOnScreen = currentTouches.find(t => t.identifier === slot.id);
                if (!stillOnScreen) {
                    slot.isSet = false;
                    slot.id = null;
                }
            }
        });
    };

    const updateTouches = (currentTouches) => {
        currentTouches.forEach(touch => {
            const slot = touches.current.find(t => t.isSet && t.id === touch.identifier);
            if (slot) {
                slot.lastTouch.posX = touch.pageX;
                slot.lastTouch.posY = touch.pageY;
            }
        });
    };

    // ==========================================
    // LOGICĂ MIȘCARE CU MULTIPLICATORI DE SENSIBILITATE
    // ==========================================

    const getSlideDirection = (x, y) => {
        if(Math.abs(y) > Math.abs(x)){
            return y < 0 ? "top" : "bottom";
        }
        return x < 0 ? 'left' : 'right';
    };

    const oneTouchMovement = (slot, currentTouch) => {
        // Aplicăm Cursor Sensitivity
        let x = (currentTouch.pageX - slot.lastTouch.posX) * activeSensitivities.current.cursor;
        let y = (currentTouch.pageY - slot.lastTouch.posY) * activeSensitivities.current.cursor;
        
        WebSocketService.sendCommand('KM', 'SLIDE', { type: 'cursor', dx: x, dy: y });
    };

    const twoTouchMovement = (activeSlots, currentTouches) => {
        let dx1 = currentTouches[0].pageX - activeSlots[0].lastTouch.posX;  
        let dy1 = currentTouches[0].pageY - activeSlots[0].lastTouch.posY;  
        let dx2 = currentTouches[1].pageX - activeSlots[1].lastTouch.posX;  
        let dy2 = currentTouches[1].pageY - activeSlots[1].lastTouch.posY;  
        
        let slideDirection = getSlideDirection(dx1, dy1);
        
        if(slideDirection !== getSlideDirection(dx2, dy2)){
            // Aplicăm Zoom Sensitivity
            let distance = Math.sqrt((currentTouches[0].pageX - currentTouches[1].pageX)**2 + (currentTouches[0].pageY - currentTouches[1].pageY)**2);
            let lastDistance = Math.sqrt((activeSlots[0].lastTouch.posX - activeSlots[1].lastTouch.posX)**2 + (activeSlots[0].lastTouch.posY - activeSlots[1].lastTouch.posY)**2);
            
            let zoomDelta = (lastDistance - distance) * activeSensitivities.current.zoom;
            
            WebSocketService.sendCommand('KM', 'SLIDE', { type: 'zoom', delta: zoomDelta });
        } else {
            // Aplicăm Scroll Sensitivity
            if(slideDirection === 'left' || slideDirection === 'right'){
                let scrollX = ((dx1 + dx2) / 2) * activeSensitivities.current.scroll;
                WebSocketService.sendCommand('KM', 'SLIDE', { type: 'scroll', dx: scrollX, dy: 0 });
            } else {
                let scrollY = ((dy1 + dy2) / 2) * activeSensitivities.current.scroll;
                WebSocketService.sendCommand('KM', 'SLIDE', { type: 'scroll', dx: 0, dy: scrollY });
            }
        }
    };

    const threeTouchMovement = (activeSlots, currentTouches) => {
        let dx1 = currentTouches[0].pageX - activeSlots[0].lastTouch.posX;  
        let dy1 = currentTouches[0].pageY - activeSlots[0].lastTouch.posY;  
        let dx2 = currentTouches[1].pageX - activeSlots[1].lastTouch.posX;  
        let dy2 = currentTouches[1].pageY - activeSlots[1].lastTouch.posY;  
        let dx3 = currentTouches[2].pageX - activeSlots[2].lastTouch.posX;  
        let dy3 = currentTouches[2].pageY - activeSlots[2].lastTouch.posY;  

        let d2 = getSlideDirection(dx2, dy2);
        if(getSlideDirection(dx1, dy1) === d2 && d2 === getSlideDirection(dx3, dy3)){
            if(d2 === 'top') WebSocketService.sendCommand('KM', 'ACTION', { type: 'show' });
            if(d2 === 'bottom') WebSocketService.sendCommand('KM', 'ACTION', { type: 'hide' });
        }
    };

    const touchMovements = (currentTouches) => {
        const activeSlots = currentTouches.map(t => touches.current.find(slot => slot.isSet && slot.id === t.identifier)).filter(s => s);

        if(currentTouches.length === 1 && activeSlots[0]){
            oneTouchMovement(activeSlots[0], currentTouches[0]);
        }
        else if(currentTouches.length === 2 && activeSlots.length === 2){
            twoTouchMovement(activeSlots, currentTouches);
        }
        else if(currentTouches.length === 3 && activeSlots.length === 3){
            threeTouchMovement(activeSlots, currentTouches);
        }
    };

    // ==========================================
    // PAN RESPONDER
    // ==========================================
    const panResponder = useMemo(() => PanResponder.create({
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: (event) => {
            const currentTouches = event.nativeEvent.touches;
            addTouches(currentTouches);
            lastTouchNumber.current = currentTouches.length;
            firstTouchTime.current = Date.now();
            maxTouchNumber.current = lastTouchNumber.current;
        },

        onPanResponderMove: (event) => {
            const currentTouches = event.nativeEvent.touches;
            if(currentTouches.length > 3) return; 

            if(currentTouches.length !== lastTouchNumber.current){
                if(currentTouches.length > lastTouchNumber.current) addTouches(currentTouches);
                else removeTouches(currentTouches);
                
                lastTouchNumber.current = currentTouches.length;
                if(lastTouchNumber.current > maxTouchNumber.current) maxTouchNumber.current = lastTouchNumber.current;
            }

            const now = Date.now();
            if (now - lastSendTime.current > 16) { 
                touchMovements(currentTouches);
                lastSendTime.current = now;
            }

            updateTouches(currentTouches);
        },

        onPanResponderRelease: () => {
            if (Date.now() - firstTouchTime.current < 400) {
                const s1 = touches.current[0];
                const s2 = touches.current[1];

                const isTap = (slot) => 
                    Math.abs(slot.firstTouch.posX - slot.lastTouch.posX) < 15 &&
                    Math.abs(slot.firstTouch.posY - slot.lastTouch.posY) < 15;

                if (s1.isSet && isTap(s1)) {
                    if (maxTouchNumber.current === 1) {
                        WebSocketService.sendCommand('KM', 'TOUCH', { button: 'left', state: 'click' });
                        Select.current = false;
                    } 
                    else if (maxTouchNumber.current === 2 && s2.isSet && isTap(s2)) {
                        WebSocketService.sendCommand('KM', 'TOUCH', { button: 'right', state: 'click' });
                        Select.current = false;
                    }
                    else if(maxTouchNumber.current === 3){
                        if(Select.current === false){
                            WebSocketService.sendCommand('KM', 'TOUCH', { button: 'left', state: 'down' });
                            Select.current = true;
                        } else {
                            WebSocketService.sendCommand('KM', 'TOUCH', { button: 'left', state: 'up' });
                            Select.current = false;
                        }    
                    }
                }
            }

            touches.current.forEach(s => { s.isSet = false; s.id = null; });
            lastTouchNumber.current = 0;
        }
    }), []);

    useEffect(() => {
        return () => {
            if (Select.current) WebSocketService.sendCommand('KM', 'TOUCH', { button: 'left', state: 'up' });
        };
    }, []);

    return (
        <View 
            style={[styles.Touchpad, { backgroundColor: colors.card, borderColor: `${themeColor}40` }]} 
            {...panResponder.panHandlers}
        >
            <Text style={[styles.Text, { color: colors.subText }]}>{t('touchpad_guide_1')}</Text>
            <Text style={[styles.Text, { color: colors.subText }]}>{t('touchpad_guide_2')}</Text>
            <Text style={[styles.Text, { color: colors.subText }]}>{t('touchpad_guide_3')}</Text>
            <Text style={[styles.Text, { color: colors.subText }]}>{t('touchpad_guide_4')}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    Touchpad:{
      borderWidth: 1,
      width: "90%",
      height: '93%',
      borderRadius: 30, 
      alignItems: 'center',
      justifyContent: "center",
    },
    Text:{
        fontSize: 14,
        margin: 5,
        fontWeight: '600', 
        textAlign: 'center', 
    }
});