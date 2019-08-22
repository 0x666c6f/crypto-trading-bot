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

try {
    
    const startDate = new Date(Date.parse(process.env.StartDate));
    const startMoment = moment(startDate.getTime());
    if(startMoment.isAfter(moment.now())){
        log.green("Arbitrage bot starting date is set at :", startDate);
        const job = new CronJob(startDate, function() {
            log.green("Starting date reached, waking up !");
        
            tradeio.info().then(function (infos) {
                infos = trading_utils.formatInfos(infos.symbols);
                arbitrageBot.start(infos);
            });
        });
        job.start();
    
    } else {
        log.green("No/Wrong start date set Arbitrage bot starting now");

        tradeio.info().then(function (infos) {
            infos = trading_utils.formatInfos(infos.symbols);
            arbitrageBot.start(infos);
        });
    }
    
} catch (error) {
    log.green("Error while starting bot :",error);

}
    

