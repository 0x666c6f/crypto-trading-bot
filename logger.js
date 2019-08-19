const ansi = require('ansicolor').nice
const fs = require('fs')

const infoLogFile = 'logs/info.log';
const tradeLogFile = 'logs/trade.log'
const errorLogFile = 'logs/error.log'
const logFolder = 'logs'

createLogFolder(logFolder)
createFile(infoLogFile)
createFile(tradeLogFile)
createFile(errorLogFile)

const logger = require('ololog').configure({
    time: true,
    'render+'(text, {
        consoleMethod = ''
    }) {
        if (text) {
            const strippedText = ansi.strip(text).trim() + '\n' // remove ANSI codes
            fs.appendFileSync('logs/info.log', strippedText)

            if ((consoleMethod === 'green')) {
                fs.appendFileSync('logs/trade.log', strippedText)
            }
            if ((consoleMethod === 'error') || (consoleMethod === 'warn')) {

                fs.appendFileSync('logs/error.log', strippedText)
            }
        }
        return text
    }
})


function createFile(filename) {
    try {
        fs.openSync(filename, 'r')
    } catch (error) {
        fs.writeFileSync(filename, '', function (err) {
        });
    }
}

function createLogFolder(folderPath) {
    try {
        fs.readdirSync(folderPath)
    } catch (error) {
        try {
            fs.mkdirSync(folderPath, "777")
            return;
        } catch (error) {
        }
    }
}
exports.logger = logger