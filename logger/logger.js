const ansi = require('ansicolor').nice;
const fs = require('fs');

const logger = require('ololog').configure({
    time: { yes: true, format: 'iso' }
});


function createFile(filename) {
    try {
        fs.openSync(filename, 'r');
    } catch (error) {
        fs.writeFileSync(filename, '', function (err) {
        });
    }
}

function createLogFolder(folderPath) {
    try {
        fs.readdirSync(folderPath);
    } catch (error) {
        try {
            fs.mkdirSync(folderPath, "777");
            return;
        } catch (error) {
        }
    }
}
exports.logger = logger;