const { exec } = require('child_process');
exec('npx tsc --noEmit', { cwd: 'c:\\Users\\brahi\\Downloads\\alive-management-system\\frontend' }, (error, stdout, stderr) => {
  if (error) {
    console.log('Errors found:');
    console.log(stdout);
    console.log(stderr);
  } else {
    console.log('No TypeScript errors!');
  }
});
