require('./config.js');
const trading_utils = require('./trading-utils');
var log = require("./logger").logger;
var tradeIO = require('./tradeio');
const moment = require("moment");

const volumes = new Map();
log.green("Processing volumes ...");
tradeIO.tickers().then(async function (tickers){
    const formattedTickers = trading_utils.formatTickers(tickers.tickers);
    let btcVol = 0;
    let ethVol = 0;
    let usdtVol = 0;
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
                    if(moment().dayOfYear() == date.dayOfYear() && trade.status ==="Completed"){
                        tickerVolume += parseFloat(trade.total);
                        switch (baseAsset) {
                            case "eth":
                                ethVol += parseFloat(trade.total);
                                break;
                            case "btc":
                                btcVol += parseFloat(trade.total);
                                break;
                            case "usdt":
                                usdtVol += parseFloat(trade.total);
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
    log.green("\tTotal btc :", volumes.get("total_btc"));
    log.green("\tTotal eth :", volumes.get("total_eth"));
    log.green("\tTotal usdt :", volumes.get("total_usdt"));
    log.green("\tTotal daily :", volumes.get("total"));

});

