const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.js'));
files.push('../App.js');

for (const file of files) {
  const filePath = path.join(screensDir, file);
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace fontWeight: 'bold' with fontFamily + bold
  content = content.replace(/fontWeight:\s*'bold'/g, "fontFamily: 'Helvetica', fontWeight: 'bold'");
  content = content.replace(/fontWeight:\s*'900'/g, "fontFamily: 'Helvetica', fontWeight: '900'");
  content = content.replace(/fontWeight:\s*'600'/g, "fontFamily: 'Helvetica', fontWeight: 'bold'"); // promote 600 to bold for that thick Helvetica look
  
  // To make sure we don't duplicate:
  content = content.replace(/fontFamily:\s*'Helvetica',\s*fontFamily:\s*'Helvetica',/g, "fontFamily: 'Helvetica',");

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Fonts updated in screens!');
