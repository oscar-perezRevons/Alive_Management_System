const fs = require('fs');
let code = fs.readFileSync('C:/Users/brahi/Downloads/alive-management-system/frontend/src/pages/LandingPage.tsx', 'utf8');
const lines = code.split('\n');
lines.forEach((line, i) => {
  if (line.includes('scrollIntoView') || line.includes('ref') || line.includes('tabRef')) {
    console.log((i+1) + ': ' + line.trim());
  }
});
