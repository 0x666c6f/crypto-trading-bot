var tradeio = require('./tradeio');
var arbitrageBot = require('./arbitrage-bot')
var trading_utils = require('./trading-utils')
var log = require("./logger").logger

log.green("/////////////////////////////////////////////")
log.green("///// Starting Trade IO Arbitrageg BOT /////")
log.green("/////////////////////////////////////////////")


require('./config.js')

tradeio.info().then(function (infos) {
    infos = trading_utils.formatInfos(infos.symbols);
    arbitrageBot.start(infos)
});

