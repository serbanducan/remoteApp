document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements - Tabs
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    // DOM Elements - Server
    const passwordInput = document.getElementById('password');
    const autoStartupCheck = document.getElementById('autoStartup');
    const autoPortCheck = document.getElementById('autoPort');
    const manualPortGroup = document.getElementById('manualPortGroup');
    const manualPortInput = document.getElementById('manualPort');
    const saveServerBtn = document.getElementById('saveServerBtn');
    const statusBadge = document.getElementById('statusBadge');

    // DOM Elements - Custom Alert
    const customAlertOverlay = document.getElementById('customAlertOverlay');
    const customAlertTitle = document.getElementById('customAlertTitle');
    const customAlertMsg = document.getElementById('customAlertMsg');
    const customAlertBtn = document.getElementById('customAlertBtn');

    // DOM Elements - Aspect
    const customSelectDisplay = document.getElementById('customSelectDisplay');
    const customSelectText = document.getElementById('customSelectText');
    const customOptionsContainer = document.getElementById('customOptionsContainer');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const colorPickerContainer = document.getElementById('colorPicker');
    const saveThemeBtn = document.getElementById('saveThemeBtn');

    // State
    let currentConfig = {
        isDarkMode: true,
        themeColor: '#007AFF',
        language: 'ro'
    };

    // Dictionary of language names
    const languageNames = {
        en: 'English',
        ro: 'Română',
        es: 'Español',
        fr: 'Français',
        de: 'Deutsch',
        it: 'Italiano',
        pt: 'Português',
        zh: '中文',
        ja: '日本語',
        ko: '한국어',
        ru: 'Русский',
        ar: 'العربية',
        hi: 'हिन्दी'
    };

    // Color Palette matching mobile app presets or typical ones
    const presetColors = [
        '#007AFF', // Blue
        '#34C759', // Green
        '#FF3B30', // Red
        '#FF9500', // Orange
        '#AF52DE', // Purple
        '#FF2D55'  // Pink
    ];

    // --- TABS LOGIC ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tab.getAttribute('data-target')).classList.add('active');
        });
    });

    // --- THEME & TRANSLATION LOGIC ---
    function applyTranslations() {
        const lang = currentConfig.language || 'ro';
        const dict = translations[lang] || translations['en'];

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) {
                el.innerText = dict[key];
            }
        });
        
        // Also update the status badge text specifically if needed
        updateStatusUI(window.lastStatus || { online: false });
    }

    function renderLanguageSelect() {
        customOptionsContainer.innerHTML = '';
        
        Object.keys(translations).forEach(lang => {
            const option = document.createElement('div');
            option.className = 'custom-option';
            if (lang === currentConfig.language) {
                option.classList.add('selected');
                customSelectText.innerText = languageNames[lang] || lang;
            }
            option.innerText = languageNames[lang] || lang;
            
            option.addEventListener('click', () => {
                document.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                customSelectText.innerText = languageNames[lang] || lang;
                
                currentConfig.language = lang;
                applyTranslations();
                
                // Close dropdown
                customSelectDisplay.classList.remove('open');
            });
            
            customOptionsContainer.appendChild(option);
        });

        // Toggle dropdown open/close
        customSelectDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            customSelectDisplay.classList.toggle('open');
        });

        // Close when clicking outside
        document.addEventListener('click', () => {
            customSelectDisplay.classList.remove('open');
        });
    }

    // --- CUSTOM ALERT LOGIC ---
    function showCustomAlert(title, message) {
        customAlertTitle.innerText = title;
        customAlertMsg.innerText = message;
        customAlertOverlay.classList.add('active');
    }

    customAlertBtn.addEventListener('click', () => {
        customAlertOverlay.classList.remove('active');
    });

    function applyThemeToUI(isDark, accentColor) {
        const root = document.documentElement;
        
        if (isDark) {
            root.style.setProperty('--bg-color', '#0A0B10');
            root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.04)');
            root.style.setProperty('--dropdown-bg', 'rgba(20, 20, 25, 0.95)');
            root.style.setProperty('--text', '#FFFFFF');
            root.style.setProperty('--subtext', 'rgba(255, 255, 255, 0.4)');
            root.style.setProperty('--border', 'rgba(255, 255, 255, 0.1)');
        } else {
            root.style.setProperty('--bg-color', '#F2F2F7');
            root.style.setProperty('--card-bg', '#FFFFFF');
            root.style.setProperty('--dropdown-bg', 'rgba(255, 255, 255, 0.95)');
            root.style.setProperty('--text', '#1C1C1E');
            root.style.setProperty('--subtext', 'rgba(0, 0, 0, 0.5)');
            root.style.setProperty('--border', 'rgba(0, 0, 0, 0.1)');
        }

        root.style.setProperty('--primary', accentColor);
    }

    function renderColorPicker() {
        colorPickerContainer.innerHTML = '';
        presetColors.forEach(color => {
            const dot = document.createElement('div');
            dot.className = 'color-dot';
            if (color.toLowerCase() === currentConfig.themeColor.toLowerCase()) {
                dot.classList.add('active');
            }
            dot.style.backgroundColor = color;
            
            dot.addEventListener('click', () => {
                document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                currentConfig.themeColor = color;
                applyThemeToUI(currentConfig.isDarkMode, currentConfig.themeColor);
            });
            
            colorPickerContainer.appendChild(dot);
        });
    }

    darkModeToggle.addEventListener('change', (e) => {
        currentConfig.isDarkMode = e.target.checked;
        applyThemeToUI(currentConfig.isDarkMode, currentConfig.themeColor);
    });

    saveThemeBtn.addEventListener('click', async () => {
        saveThemeBtn.disabled = true;
        saveThemeBtn.innerText = "Se salvează...";
        
        const success = await window.api.saveConfig(currentConfig);
        
        saveThemeBtn.disabled = false;
        applyTranslations(); // reset button text to correct language
    });

    // --- SERVER LOGIC ---
    autoPortCheck.addEventListener('change', () => {
        manualPortGroup.style.display = autoPortCheck.checked ? 'none' : 'block';
    });

    saveServerBtn.addEventListener('click', async () => {
        currentConfig.serverPassword = passwordInput.value;
        currentConfig.autoStartup = autoStartupCheck.checked;
        currentConfig.autoPort = autoPortCheck.checked;
        currentConfig.manualPort = parseInt(manualPortInput.value, 10) || 8080;

        const passwordValue = passwordInput.value;

        if (!passwordValue) {
            showCustomAlert(dict['error_title'] || "Eroare", dict['password_required'] || "Vă rugăm să introduceți o parolă de siguranță!");
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{8,}$/;
        if (!passwordRegex.test(passwordValue)) {
            showCustomAlert(dict['error_title'] || "Eroare", dict['invalid_password_msg'] || "Parola trebuie să aibă minim 8 caractere, o literă mare, una mică și o cifră sau caracter special.");
            return;
        }

        if (!currentConfig.autoPort && (currentConfig.manualPort < 1024 || currentConfig.manualPort > 65535)) {
            showCustomAlert(dict['error_title'] || "Eroare", dict['invalid_port_msg'] || "Portul manual trebuie să fie între 1024 și 65535!");
            return;
        }

        currentConfig.serverPassword = passwordValue;
        saveServerBtn.disabled = true;

        const success = await window.api.saveConfig(currentConfig);
        
        saveServerBtn.disabled = false;

        if (!success) {
            const lang = currentConfig.language || 'ro';
            const dict = translations[lang] || translations['en'];
            showCustomAlert(dict['error_title'] || "Eroare", dict['save_error_msg'] || "Eroare la salvarea setărilor.");
        }
    });

    function updateStatusUI(status) {
        window.lastStatus = status; // cache for translations
        const lang = currentConfig.language || 'ro';
        const dict = translations[lang] || translations['en'];

        if (status.online) {
            statusBadge.className = "status-badge status-online";
            statusBadge.innerText = `${dict['connected'] || 'Connected'} : ${status.port}`;
        } else {
            statusBadge.className = "status-badge status-offline";
            statusBadge.innerText = dict['disconnected'] || 'Disconnected';
        }
    }

    // Listen for server status updates
    window.api.onServerStatus((status) => {
        updateStatusUI(status);
    });

    // Listen for client connection status
    window.api.onClientStatus((isConnected) => {
        const dot = document.getElementById('clientIndicatorDot');
        const text = document.getElementById('clientIndicatorText');
        const lang = currentConfig.language || 'ro';
        const dict = translations[lang] || translations['en'];

        if (isConnected) {
            dot.style.backgroundColor = '#34C759'; // Green
            text.innerText = dict['client_connected'] || 'Client Conectat';
            text.style.color = '#34C759';
        } else {
            dot.style.backgroundColor = '#FF3B30'; // Red
            text.innerText = dict['client_disconnected'] || 'Fără Client';
            text.style.color = 'var(--text)';
        }
    });

    // --- INITIALIZATION ---
    const config = await window.api.getConfig();
    currentConfig = { ...currentConfig, ...config };
    
    // Load Server UI
    if (currentConfig.serverPassword) passwordInput.value = currentConfig.serverPassword;
    autoStartupCheck.checked = currentConfig.autoStartup !== undefined ? currentConfig.autoStartup : false;
    autoPortCheck.checked = currentConfig.autoPort !== undefined ? currentConfig.autoPort : true;
    manualPortInput.value = currentConfig.manualPort || "8080";
    autoPortCheck.dispatchEvent(new Event('change'));

    // Load Theme UI
    darkModeToggle.checked = currentConfig.isDarkMode;
    renderLanguageSelect();
    renderColorPicker();
    applyThemeToUI(currentConfig.isDarkMode, currentConfig.themeColor);
    applyTranslations();

    // Initial Status Check
    const status = await window.api.getStatus();
    updateStatusUI(status);
});
