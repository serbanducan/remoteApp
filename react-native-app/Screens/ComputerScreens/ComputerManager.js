import { File, Paths } from 'expo-file-system';

const file = new File(Paths.document, 'Computers.json');

export const getComputerData = async () => {
    try {
      if (!file.exists) {
        const defaultData = {
          selectedComputer: null,
          computers: [],
          id: 0
        };

        await file.write(JSON.stringify(defaultData));
        return defaultData;
      }

      const fileData = await file.text();
      return JSON.parse(fileData);
      
    } catch (error) {
    }
}

export const selectComputer = async (computersData, selectedComputer) => {
    if (!computersData) return;
    
    const updatedData = JSON.parse(JSON.stringify(computersData));
    updatedData.selectedComputer = selectedComputer;
    
    await saveDataToFile(updatedData);
    return updatedData;
};

export const deleteComputer = async (computersData, computerID) => {
    if (!computersData) return;

    const updatedData = JSON.parse(JSON.stringify(computersData));
    updatedData.computers = updatedData.computers.filter(comp => comp.id !== computerID);
    
    const currentlySelected = updatedData.selectedComputer;
    if(currentlySelected && computerID === currentlySelected.id){
      updatedData.selectedComputer = null;
    }
    
    await saveDataToFile(updatedData);
    return updatedData;
};
    
export const AddComputer = async (name, ip, port, password, macAddress) => {
    try {
        let computersData;

        if (!file.exists) {
            computersData = { 
                selectedComputer: null ,
                computers: [],
                id: 0 
            };
        } else {
            const fileData = await file.text();
            computersData = JSON.parse(fileData);
        }
        
        const newComputer = {
            "name": name,
            "ip": ip,
            "port": port, 
            "password": password,
            "macAddress": macAddress,
            "id": computersData.id + 1
        };

        computersData.selectedComputer = newComputer;
        computersData.computers.push(newComputer);
        computersData.id++;
        
        await saveDataToFile(computersData);
    
      } catch (error) {
      }
}

const saveDataToFile = async (data) => {
    try {
      await file.write(JSON.stringify(data)); 
    } catch (error) {
    }
};

export const EditComputer = async (id, name, ip, port, password, macAddress) => {
    try {
        if (!file.exists) return;
        
        const fileData = await file.text();
        let computersData = JSON.parse(fileData);

        const index = computersData.computers.findIndex(comp => comp.id === id);
        if (index !== -1) {
            computersData.computers[index].name = name;
            computersData.computers[index].ip = ip;
            computersData.computers[index].port = port;
            computersData.computers[index].password = password;
            computersData.computers[index].macAddress = macAddress;
        }

        if (computersData.selectedComputer && computersData.selectedComputer.id === id) {
            computersData.selectedComputer.name = name;
            computersData.selectedComputer.ip = ip;
            computersData.selectedComputer.port = port;
            computersData.selectedComputer.password = password;
            computersData.selectedComputer.macAddress = macAddress;
        }

        await file.write(JSON.stringify(computersData)); 
        return computersData.selectedComputer.id;
        
    } catch (error) {
    }
};