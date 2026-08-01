const fs = require('fs');
let code = fs.readFileSync('C:/Users/brahi/Downloads/alive-management-system/frontend/src/pages/LandingPage.tsx', 'utf8');
const lines = code.split('\n');
lines.forEach((line, i) => {
  if (line.includes('SECRETARÍA & GP') || line.includes('telemetry tabs') || line.toLowerCase().includes('02 puntuaciones') || line.includes('overflow-x-auto')) {
    console.log((i+1) + ': ' + line.trim());
  }
});
