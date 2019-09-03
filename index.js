var tradeio = require('./lib/tradeio');
var arbitrageBot = require('./lib/arbitrage-bot');
var trading_utils = require('./lib/trading-utils');
var log = require("./logger/logger").logger;
var CronJob = require('cron').CronJob;
const moment = require("moment");

log.green("/////////////////////////////////////////////");
log.green("///// Starting Trade IO Arbitrageg BOT /////");
log.green("/////////////////////////////////////////////");


require('./config/config.js');

let start = moment().add(1,"minute").seconds(process.env.StartSecond).milliseconds(0);

log.green("Arbitrage bot starting date is set at :", start.toDate());

tradeio.account().then(function (balances) {
    log.green("Initiating balance from account...");
    log.green("Balances :", balances);
    if(balances.size > 0){
        process.env.MaxBTC = balances.get("btc");
        process.env.MaxUSDT = balances.get("usdt");
        process.env.MaxETH = balances.get("eth");
    }
});


const job = new CronJob(start, function() {
    log.green("Starting date reached, waking up !");

    tradeio.info().then(function (infos) {
        infos = trading_utils.formatInfos(infos.symbols);
        arbitrageBot.start(infos);
    });
});
job.start();
    

