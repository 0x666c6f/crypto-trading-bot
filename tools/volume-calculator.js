require('../config/config.js/index.js');
const trading_utils = require('../lib/trading-utils');
var log = require("../logger/logger").logger;
var tradeIO = require('../lib/tradeio');
const moment = require("moment");

const volumes = new Map();
let btcVol = 0;
let ethVol = 0;
let usdtVol = 0;
let tradeNb = 0;

let processDate = moment(process.argv[2], "YYYY-MM-DD", true);
log.green("Processing volumes for", processDate.toDate(), "...");

tradeIO.tickers().then(async function (tickers){
    const formattedTickers = trading_utils.formatTickers(tickers.tickers);
 
    const valBTC = formattedTickers.get('btc_usdt').askPrice;
    const valEth = formattedTickers.get('eth_usdt').askPrice;

    for (const ticker of tickers.tickers) {
        log("Processing volume for pair :", ticker.symbol.toUpperCase());
        let baseAsset = ticker.symbol.split("_")[1];
        let tickerVolume = 0;

        let page = 1;
        let stop = false;
        while(!stop){
            let tickerTrades = await tradeIO.closedTrades(ticker.symbol,undefined,undefined,page,200);
            if (tickerTrades.data.length != 0){
                for(const trade of tickerTrades.data){
                    let date = moment(trade.createdAt, "YYYY-MM-DDTHH:mm:ss.SSSSSSSZ");
                    if(processDate.dayOfYear() == date.dayOfYear()){
                        tradeNb++;
                        tickerVolume += parseFloat(trade.quoteAmount);
                        switch (baseAsset) {
                            case "eth":
                                ethVol += parseFloat(trade.quoteAmount);
                                break;
                            case "btc":
                                btcVol += parseFloat(trade.quoteAmount);
                                break;
                            case "usdt":
                                usdtVol += parseFloat(trade.quoteAmount);
                                break;
                            default:
                                break;
                        }
                    }
                    page++;
                }
            } else{
                stop = true;
                volumes.set(ticker.symbol, tickerVolume);
            }
        }
        

    }

    volumes.set("total_btc",btcVol);
    volumes.set("total_eth",ethVol);
    volumes.set("total_usdt", usdtVol);
    volumes.set("total",usdtVol + valEth*ethVol + valBTC*btcVol);

    for (var entry of volumes.entries()) {
        var key = entry[0],
            value = entry[1];
        log.red(key.toUpperCase()+" volume = ", value);
    }

    log.green("\tTotal BTC :", btcVol);
    log.green("\tTotal ETH :", ethVol);
    log.green("\tTotal USDT :", usdtVol);
    log.green("\tTotal daily trades :", tradeNb);
    log.green("\tTotal daily arbitrages :", tradeNb/3);
    log.green("\tTotal daily :", usdtVol + valEth*ethVol + valBTC*btcVol);

});

