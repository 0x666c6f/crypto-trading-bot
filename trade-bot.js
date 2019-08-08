var tradeio = require('./tradeio')
var trading_utils = require('./trading-utils')
var logger = require('./logger');
var weight = 0;

var launchArbitrage = function (symbol) {
    tradeio.info().then(function (infos) {
        infos = trading_utils.formatInfos(infos.symbols);
        tradeio.tickers().then(function (tickers) {
            let formattedTickers = trading_utils.formatTickers(tickers.tickers)
            let val_btc = formattedTickers.get('btc_usdt').askPrice;
            let val_btc_eth = formattedTickers.get('eth_btc').askPrice;
            let val_eth = formattedTickers.get('eth_usdt').askPrice;

            let symbols = formattedTickers.get("symbols")
            symbols.forEach(ticker => {
                manageArbitrageBTCtoXtoETHtoBTC(formattedTickers, infos, ticker)
            });


        })
    })
}

/////////////////////////////////////////////
///////// BTC TO XXX TO ETH TO BTC //////////
////////////////////////////////////////////
var manageArbitrageBTCtoXtoETHtoBTC = function (tickers, infos, symbol) {
    logger.info("Launching arbitrage : <BTC TO " + symbol + " TO ETH TO BTC>")
    let ticker_btc = tickers.get(symbol + "_btc")
    let ticker_eth = tickers.get(symbol + "_eth")
    let ticker_eth_btc = tickers.get("eth_btc")

    if (ticker_eth &&
        ticker_btc &&
        process.env.Exclusions.indexOf(symbol) == -1 &&
        ticker_btc.askPrice > 0 &&
        ticker_eth.bidPrice > 0) {
        logger.info("Tickers exists for " + symbol)
        let bonus = ticker_eth.bidPrice * ticker_eth_btc.bidPrice / ticker_btc.askPrice
        logger.info(symbol + " bonus -> " + bonus)

        if (bonus > 1.004) {
            logger.info("Found positive trade")
            if (ticker_btc.askPrice * ticker_btc.askQty > process.env.MinBTC && ticker_eth.bidQty * ticker_eth.bidPrice > process.env.MinETH && ticker_eth.bidPrice * ticker_eth.bidQty * val_btc_eth > process.env.MinBTC) {
                logger.info("Quantity is enough for trade for symbol " + symbol)

                let price = ticker_btc.askPrice
                let qty = Math.min(process.env.MaxBTC / price, ticker_btc.askQty, ticker_eth.bidQty)
                qty = Math.round(qty, infos.get(ticker_btc.baseAssetPrecision))
                var qty_ini = Math.round(Math.min(process.env.MaxBTC / price, ticker_btc.askQty, ticker_eth.bidQty), infos.get(symbol + "_eth").baseAssetPrecision);
                weight++

                console.log(price)
                console.log(qty)
                console.log(qty_ini)
                logger.info("Initiating order for symbol " + symbol)

                tradeio.newOrder(symbol + "_btc", "buy", "limit", qty, price).then(function (resp) {
                    if (resp.order.status == "Completed") {
                        logger.info("First trade successful for arbitrage <BTC TO " + symbol + " TO ETH TO BTC>")
                        let price = ticker_eth.bidPrice
                        let qty = qty_ini
                        qty = Math.round(qty_ini / 1.001, infos.get(symbol + "_eth").baseAssetPrecision)
                        tradeio.newOrder(symbol + "_eth", "sell", "limit", qty, price).then(function (resp) {
                            if (resp.order.status == "Completed") {
                                logger.info("Second trade successful for arbitrage <BTC TO " + symbol + " TO ETH TO BTC>")
                            } else {
                                logger.warn("First trade has failed for arbitrage <BTC TO " + symbol + " TO ETH TO BTC>, canceling order")
                                tradeio.cancelOrder(resp.order.orderId).then(function (resp) {
                                    if (resp.order.status == "Canceled") {
                                        logger.warn("Second trade successful canceled for arbitrage <BTC TO " + symbol + " TO ETH TO BTC>")
                                    }
                                })
                            }
                        })
                        weight++;

                        price = ticker_eth_btc.bidPrice;
                        qty = Math.round(qty_ini * ticker_eth.bidPrice, infos.get("eth_btc").baseAssetPrecision)

                        tradeio.newOrder("eth_btc", "sell", "limit", qty, price).then(function (resp) {
                            if (resp.order.status == "Completed") {
                                logger.info("Third trade successful for arbitrage <BTC TO " + symbol + " TO ETH TO BTC>")
                            } else {
                                logger.warn("Third trade has failed for arbitrage <BTC TO " + symbol + " TO ETH TO BTC>, canceling order")
                                tradeio.cancelOrder(resp.order.orderId).then(function (resp) {
                                    if (resp.order.status == "Canceled") {
                                        logger.warn("Third trade successful canceled for arbitrage <BTC TO " + symbol + " TO ETH TO BTC>")
                                    }
                                })
                            }
                        })
                        weight++;

                        //sleep
                        //manageArbitrageETH_BTC(tickers, infos, symbol)
                    } else {
                        logger.warn("First trade has failed for arbitrage <BTC TO " + symbol + " TO ETH TO BTC>, canceling order")
                        weight++;
                        tradeio.cancelOrder(resp.order.orderId).then(function (resp) {

                            //manageArbitrageETH_BTC(tickers, infos, symbol)
                        })
                    }
                })
            } else {
                logger.warn("Not enough quantity for trade for symbol " + symbol)

            }

        }
    }

}

var manageArbitrageETH_USDT = function (tickers, symbol, pair1, pair2) {
    logger.info("Managing arbitrage for symbol " + symbol + " , to pairs _" + pair1 + " & " + pair2)
    if ((!tickers.get(symbol + "_" + pair1) || !tickers.get(symbol + "_" + pair2)) && process.env.Exclusions.indexOf(symbol) == -1) {
        logger.info("Tickers exists for " + symbol)

    }

}

var manageArbitrageBTC_USDT = function (tickers, symbol, pair1, pair2) {
    logger.info("Managing arbitrage for symbol " + symbol + " , to pairs _" + pair1 + " & " + pair2)
    if ((!tickers.get(symbol + "_" + pair1) || !tickers.get(symbol + "_" + pair2)) && process.env.Exclusions.indexOf(symbol) == -1) {
        logger.info("Tickers exists for " + symbol)

    }

}
exports.launchArbitrage = launchArbitrage;