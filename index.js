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

const startDate = new Date(Date.parse(process.env.StartDate));

try {
    
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
        log.green("No/Wrong start date set Arbitrage bot will only keep seconds in date");

        let start = moment().add(1,"minute");
        start.set("second", startDate.getSeconds());
        
        log.green("Arbitrage bot starting date is set at :", start.toDate());

        const job = new CronJob(start, function() {
            log.green("Starting date reached, waking up !");
        
            tradeio.info().then(function (infos) {
                infos = trading_utils.formatInfos(infos.symbols);
                arbitrageBot.start(infos);
            });
        });
        job.start();
    }
    
} catch (error) {
    log.green("Error while starting bot :",error);

}
    

