const { execSync } = require('child_process');
const fs = require('fs').promises; // NOU: Folosim versiunea de fs care suportă async/await
const pathModule = require('path');

async function getFiles(directoryPath) {
  if (directoryPath === '') {
    return listDrives();
  } else {
    return await getDir(directoryPath);
  }
}

function listDrives() {
  try {
    // Folosim PowerShell în loc de WMIC
    // Această comandă returnează doar literele partițiilor (ex: C, D)
    const stdout = execSync('powershell -command "Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name"').toString();
    
    // Curățăm rezultatul de spații și linii noi
    const driveLetters = stdout
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0); // Păstrăm doar liniile valide

    // Transformăm literele în obiectele noastre JSON
    return driveLetters.map(letter => ({
      name: letter + ':',       // Ce afișăm pe ecran (ex: "C:")
      type: 'drive',            // Tipul pentru FileList
      path: letter + ':\\'      // Calea exactă pentru navigare (ex: "C:\")
    }));
  } catch (error) {
    console.error('Eroare la citirea partițiilor cu PowerShell:', error);
    return []; 
  }
}

async function getDir(directory) {
  try {
    // NOU: fs.readdir asincron nu blochează serverul Node.js
    const items = await fs.readdir(directory, { withFileTypes: true });

    // NOU: Mapăm rezultatele în obiecte clare
    let content = items.map(item => ({
      name: item.name,
      type: item.isDirectory() ? 'directory' : 'file',
      path: pathModule.join(directory, item.name) // Construim calea corectă automat
    }));

    // OPȚIONAL: Sortăm ca folderele să apară mereu primele, apoi fișierele
    content.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'directory' ? -1 : 1;
    });

    return content;
  } catch (err) {
    console.error('Eroare la citirea folderului (poate nu ai acces):', err);
    return []; // Returnăm o listă goală dacă folderul e protejat de Windows
  }
}

module.exports = {
  getFiles
};