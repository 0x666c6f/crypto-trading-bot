var tradeio = require('./tradeio');
var arbitrageBot = require('./arbitrage-bot')
var trading_utils = require('./trading-utils')
var log = require("./logger").logger
var CronTime = require('cron').CronTime;
var CronJob = require('cron').CronJob;

log.green("/////////////////////////////////////////////")
log.green("///// Starting Trade IO Arbitrageg BOT /////")
log.green("/////////////////////////////////////////////")


require('./config.js')

const startDate = new Date(Date.parse(process.env.StartDate))
log.green("Arbitrage bot starting date is set at :", startDate)
const job = new CronJob(startDate, function() {
    tradeio.info().then(function (infos) {
        infos = trading_utils.formatInfos(infos.symbols);
        arbitrageBot.start(infos)
    });
});
job.start();


