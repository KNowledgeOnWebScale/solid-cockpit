const { exec } = require('child_process');

function Solid_server_init() {
    exec('npx @solid/community-server -p 3000 -c @css:config/file.json', (error, stdout, stderr) => {
        if (error) {
        return console.error(`Error: ${error.message}`);
        } 
    });
};

Solid_server_init();