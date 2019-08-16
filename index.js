var tradeio = require('./tradeio');
var arbitrageBot = require('./arbitrage-bot')
var trading_utils = require('./trading-utils')

require('./config.js')

tradeio.info().then(function (infos) {
    infos = trading_utils.formatInfos(infos.symbols);
    arbitrageBot.start(infos)
});

