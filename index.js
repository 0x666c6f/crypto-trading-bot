var tradeio = require('./tradeio');
var arbitrageBot = require('./arbitrage-bot');
var trading_utils = require('./trading-utils');
var log = require("./logger").logger;
var CronJob = require('cron').CronJob;
const moment = require("moment");

log.green("/////////////////////////////////////////////");
log.green("///// Starting Trade IO Arbitrageg BOT /////");
log.green("/////////////////////////////////////////////");


require('./config.js');

let start = moment().add(1,"minute");
start.set("second", process.env.StartSecond);

log.green("Arbitrage bot starting date is set at :", start.toDate());

const job = new CronJob(start, function() {
    log.green("Starting date reached, waking up !");

    tradeio.info().then(function (infos) {
        infos = trading_utils.formatInfos(infos.symbols);
        arbitrageBot.start(infos);
    });
});
job.start();
    
    

    

