const fs = require('fs');
let code = fs.readFileSync('C:/Users/brahi/Downloads/alive-management-system/frontend/src/pages/LandingPage.tsx', 'utf8');
const lines = code.split('\n');
console.log(lines.slice(760, 780).join('\n'));
