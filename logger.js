const ansi = require('ansicolor').nice;
const fs = require('fs');

const infoLogFile = 'logs/info.log';
const errorLogFile = 'logs/error.log';
const logFolder = 'logs';

createLogFolder(logFolder);
createFile(infoLogFile);
createFile(errorLogFile);

const logger = require('ololog').configure({
    time: { yes: true, format: 'iso' } ,
    'render+'(text, {
        consoleMethod = ''
    }) {
        if (text) {
            const strippedText = ansi.strip(text).trim() + '\n';
            fs.appendFileSync('logs/info.log', strippedText);

            if ((consoleMethod === 'error') || (consoleMethod === 'warn')) {

                fs.appendFileSync('logs/error.log', strippedText);
            }
        }
        return text;
    }
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