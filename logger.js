const ansi = require('ansicolor').nice
const fs = require('fs')
const logger = require('ololog').configure({
    time: true,
    /*  Injects a function after the "render" step            */
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

exports.logger = logger