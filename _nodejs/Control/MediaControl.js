const { exec } = require('child_process');

function identifyMediaScreen(data){
    
    const action = data.action;

    if(action === 'VOLUME_DOWN'){
        volumeDown();
    }
    else if(action === 'VOLUME_UP'){
        volumeUp();
    }
    else if(action === 'PREVIOUS'){
        Previous();
    }
    else if(action === 'PLAY_PAUSE'){
        Pause();
    }
    else if(action === 'NEXT'){
        Next();
    }

}

function volumeUp(){
    exec(`powershell -Command "(new-object -ComObject WScript.Shell).SendKeys([char]175)"`, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error: ${stderr}`);
        }
    });
}

function volumeDown(){
    exec(`powershell -Command "(new-object -ComObject WScript.Shell).SendKeys([char]174)"`, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error: ${stderr}`);
        }
    });
}

function Pause(){
    exec(`powershell -Command "Add-Type -TypeDefinition '\
        using System; \
        using System.Runtime.InteropServices; \
        public class Keyboard { \
            [DllImport(\\"user32.dll\\", SetLastError=true)] \
            public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo); \
            public const int VK_MEDIA_PLAY_PAUSE = 0xB3; \
        }'; [Keyboard]::keybd_event([Keyboard]::VK_MEDIA_PLAY_PAUSE, 0, 0, [UIntPtr]::Zero)"`, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error: ${stderr}`);
            }
        });
}

function Previous(){
    exec(`powershell -Command "Add-Type -TypeDefinition '\
        using System; \
        using System.Runtime.InteropServices; \
        public class Keyboard { \
            [DllImport(\\"user32.dll\\", SetLastError=true)] \
            public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo); \
            public const int VK_MEDIA_PREV_TRACK = 0xB1; \
        }'; [Keyboard]::keybd_event([Keyboard]::VK_MEDIA_PREV_TRACK, 0, 0, [UIntPtr]::Zero)"`, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error: ${stderr}`);
            }
        });
}

function Next(){
    exec(`powershell -Command "Add-Type -TypeDefinition '\
        using System; \
        using System.Runtime.InteropServices; \
        public class Keyboard { \
            [DllImport(\\"user32.dll\\", SetLastError=true)] \
            public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo); \
            public const int VK_MEDIA_NEXT_TRACK = 0xB0; \
        }'; [Keyboard]::keybd_event([Keyboard]::VK_MEDIA_NEXT_TRACK, 0, 0, [UIntPtr]::Zero)"`, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error: ${stderr}`);
            }
        });
        
}

module.exports = {
    identifyMediaScreen
};