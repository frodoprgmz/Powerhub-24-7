const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const desktopPath = path.join(require('os').homedir(), 'Desktop', 'Powerhub_24_7.apk');

console.log('Rozpoczynam budowanie APK w chmurze Expo...');

try {
  // Start build
  const buildCmd = 'npx eas-cli build -p android --profile apk --non-interactive --json';
  const buildOutput = execSync(buildCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
  
  const jsonMatch = buildOutput.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (!jsonMatch) {
    console.error('Nie znaleziono danych JSON z buildu.');
    process.exit(1);
  }
  
  const builds = JSON.parse(jsonMatch[0]);
  const buildId = builds[0].id;
  console.log('Build ID: ' + buildId);
  console.log('Trwa budowanie (zazwyczaj 5-10 minut). Możesz sprawdzić status w Expo Dashboard.');
  
  let downloadUrl = null;
  while(true) {
    execSync('ping 127.0.0.1 -n 30 > nul'); // sleep 30s
    
    const viewCmd = 'npx eas-cli build:view ' + buildId + ' --json';
    const viewOutput = execSync(viewCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const viewJsonMatch = viewOutput.match(/\{[\s\S]*\}/);
    if (viewJsonMatch) {
      const buildInfo = JSON.parse(viewJsonMatch[0]);
      if (buildInfo.status === 'FINISHED') {
        downloadUrl = buildInfo.artifacts.buildUrl;
        console.log('Build zakończony! Pobieram plik...');
        break;
      } else if (buildInfo.status === 'ERRORED') {
        console.error('Błąd podczas budowania APK na serwerach Expo.');
        process.exit(1);
      } else {
        console.log('Status: ' + buildInfo.status + '...');
      }
    }
  }

  if (downloadUrl) {
    const file = fs.createWriteStream(desktopPath);
    https.get(downloadUrl, function(response) {
      response.pipe(file);
      file.on('finish', function() {
        file.close(() => {
          console.log('Zrobione! Plik APK zapisano na pulpicie: ' + desktopPath);
        });
      });
    }).on('error', function(err) {
      fs.unlink(desktopPath, () => {});
      console.error('Błąd pobierania pliku: ' + err.message);
    });
  }

} catch(err) {
  console.error('Skrypt zakończony błędem:', err.message);
}
