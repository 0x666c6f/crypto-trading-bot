const {
    createLogger,
    format,
    transports
} = require('winston');
const fs = require('fs')
const path = require('path')

const logDir = 'logs';


if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const filename = path.join(logDir, 'results.log');

module.exports = createLogger({
    // change level if in dev environment versus production
    level: 'info',
    format: format.simple(),
    transports: [
        new transports.Console({
            level: 'info',
            format: format.combine(
                format.colorize(),
                format.printf(
                    info => `${info.timestamp} ${info.level}: ${info.message}`
                )
            )
        }),
        new transports.File({
            filename
        })
    ]
});