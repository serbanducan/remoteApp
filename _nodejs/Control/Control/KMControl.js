const robot = require('robotjs');
const KM = require('../../build/Release/KMFunctions');

function identifyKMControlScreen(data){

    let action = data.action;

    if(action == 'KEYBOARD'){
        input(data.data);
    }
    else if(action == 'SLIDE' || action == 'TOUCH' || action == 'ACTION'){
        touchpad(data);
    }
}

function input(data){
    

    if(data.type == 'press'){
        KM.sendKeyPress(data.key);
    }
    else if(data.type == 'shortcut'){
        sendCommand(data.command);
    }
    else if(command == 'holdUp'){
        robot.mouseToggle('up', 'left');
    }

   
}

function sendCommand(command){
    
        let poz = -1;
        let commandArray = [];
        poz = command.indexOf(' + ');
        while(poz != -1){
            if(command.substring(0, poz) != 'win')
                commandArray.push(command.substring(0, poz));
            else
                commandArray.push('command');
            command = command.substring(poz + 3);
            poz = command.indexOf(' + ');
        }
        commandArray.push(command);
        console.log(commandArray)
        pressKeyCombination(commandArray);
}

function pressKeyCombination(keys) {
    keys.forEach(key => {
        console.log(key);
        robot.keyToggle(key, 'down'); 
    });

    keys.reverse().forEach(key => {
        robot.keyToggle(key, 'up');  
    });
}

function touchpad(data){

    action = data.action;


    if(action == 'SLIDE')
    {
        parameters = data.data;
        
        if(parameters.type == 'zoom')
        {
            delta = parameters.delta;
            KM.zoom(delta);
        }
        else
        {
            let x = parameters.dx;
            let y = parameters.dy;
            if(parameters.type == 'cursor')
            {    
                KM.setCursorPosition(x, y);
            }
            else if(parameters.type == 'scroll')
            {
                KM.scroll(x, y);
            }
        }
      
        
    }
    else if(action == 'TOUCH')
    {
        parameters = data.data;
        if(parameters.button == 'left')
        {
            if(parameters.state == 'click')
            {
                KM.leftClick();
            }
            else if(parameters.state == 'down')
            {
                robot.mouseToggle('down', 'left');
            }
        }
        else if(parameters.button == 'right')
        {
            if(parameters.state == 'click')
            {
                KM.rightClick();
            }
            else if(parameters.state == 'down')
            {
                robot.mouseToggle('down', 'right');
            }
        }
    }
    else if(action == 'ACTION')
    {
        parameters = data.data;
        if(parameters.type == 'show')
        {
            KM.restoreAllWindows();
        }
        else if(parameters.type == 'hide')
        {
            KM.minimizeAllWindows();
        }
    }
    

}

module.exports = {
    identifyKMControlScreen
};


