const cmd = require('node-cmd');

function identifyPowerScreen(action){

    if(action === 'SHUTDOWN'){
        cmd.run('shutdown -s');
    }
    else if(action === 'RESTART'){
        cmd.run('shutdown -r');
    }
    else if(action === 'HIBERNATE'){
        cmd.run('shutdown /h');
    }
    else if(action === 'SLEEP'){
        cmd.run('rundll32.exe powrprof.dll,SetSuspendState 0,1,0');
    }
    else if(action === 'LOGOUT'){
        cmd.run('shutdown /l');
    }
    else if(action === 'LOCK'){
        cmd.run('Rundll32.exe user32.dll,LockWorkStation');
    }
}

module.exports = {
    identifyPowerScreen
}