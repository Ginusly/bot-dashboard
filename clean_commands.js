const fs = require('fs');
const files = [
    'bot/commands/setlevel.js',
    'bot/commands/setxp.js',
    'bot/commands/setbotname.js',
    'bot/commands/points.js'
];
files.forEach(f => {
    if (fs.existsSync(f)) {
        fs.unlinkSync(f);
        console.log(`Deleted ${f}`);
    } else {
        console.log(`Not found ${f}`);
    }
});
