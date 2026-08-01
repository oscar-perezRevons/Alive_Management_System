const fs = require('fs');
let codeLogin = fs.readFileSync('C:/Users/brahi/Downloads/alive-management-system/frontend/src/pages/LoginPage.tsx', 'utf8');
const linesLogin = codeLogin.split('\n');
console.log('=== LOGIN PAGE ===');
console.log(linesLogin.slice(140, 180).join('\n'));

let codeReg = fs.readFileSync('C:/Users/brahi/Downloads/alive-management-system/frontend/src/pages/RegisterPage.tsx', 'utf8');
const linesReg = codeReg.split('\n');
console.log('=== REGISTER PAGE ===');
console.log(linesReg.slice(250, 290).join('\n'));
