const ansi = require('ansicolor').nice
const fs = require('fs')

const infoLogFile = 'logs/info.log';
const tradeLogFile = 'logs/trade.log'
const errorLogFile = 'logs/error.log'

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
    let fd;
    try {
        fs.openSync(filename, 'r')
        log("The file ", filename, "exists!");
    } catch (error) {
        fs.writeFileSync(filename, '', function (err) {
            if (err) {
                log.error(err);
            }
            log("The file", filename, " was created!");
        });
    }
}

exports.logger = logger