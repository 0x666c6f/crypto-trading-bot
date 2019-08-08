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

/////////////////////////////////////////////
/////// USDT TO xxx TO ETH TO USDT //////////
////////////////////////////////////////////
/////////////////////////////////////////////
/////// USDT TO XXX TO BTC TO USDT //////////
////////////////////////////////////////////
var manageArbitrageUSDT_X_Intermediate_USDT = function (tickers, symbol, intermediate) {
    logger.info("Launching arbitrage : <USDT TO " + symbol + " TO " + intermediate + " TO USDT>")

    let ticker_usdt = tickers.get(symbol + "_usdt")
    let ticker_intermediate = tickers.get(symbol + "_" + intermediate)
    let ticker_intermediate_usdt = tickers.get(intermediate + "_" + usdt)

    if (ticker_usdt &&
        ticker_intermediate &&
        process.env.Exclusions.indexOf(symbol) == -1 &&
        ticker_usdt.askPrice > 0 &&
        ticker_intermediate.bidPrice > 0) {
        logger.info("Tickers exists for " + symbol)

        let bonus = ticker_intermediate_usdt.bidPrice * ticker_intermediate.bidPrice / ticker_usdt.askPrice
        logger.info(symbol + " bonus -> " + bonus)

        if (bonus > 1.004) {
            logger.info("Found positive trade")
           
            var minIntermediate;
            if (intermediate =="eth")
                minIntermediate = process.env.MinETH
            else 
                minIntermediate = process.env.MinBTC

            var valIntermediate;
            if (intermediate =="eth")
                valIntermediate = val_eth
            else 
                valIntermediate = val_btc

            if (ticker_usdt.askPrice * ticker_usdt.askQty > process.env.MinUSDT && ticker_intermediate.bidQty * ticker_intermediate.bidPrice > minIntermediate && ticker_intermediate.bidPrice * ticker_intermediate.bidQty * valIntermediate > process.env.MinUSDT) {
                logger.info("Quantity is enough for trade for symbol " + symbol)

                let price = ticker_usdt.askPrice
                let qty = Math.min(process.env.MaxUSDT / price, ticker_usdt.askQty, ticker_intermediate.bidQty)
                qty = Math.round(qty, infos.get(ticker_usdt.baseAssetPrecision))
                var qty_ini = Math.round(Math.min(process.env.MaxUSDT / price, ticker_usdt.askQty, ticker_intermediate.bidQty), infos.get(symbol + "_"+intermediate).baseAssetPrecision);
                weight++

                console.log(price)
                console.log(qty)
                console.log(qty_ini)
                logger.info("Initiating order for symbol " + symbol)

                tradeio.newOrder(symbol + "_btc", "buy", "limit", qty, price).then(function (resp) {
                    if (resp.order.status == "Completed") {
                        logger.info("First trade successful for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT>")
                        let price = ticker_intermediate.bidPrice
                        let qty = qty_ini
                        qty = Math.round(qty_ini / 1.001, infos.get(symbol + "_" +intermediate).baseAssetPrecision)
                        tradeio.newOrder(symbol + "_"+intermediate, "sell", "limit", qty, price).then(function (resp) {
                            if (resp.order.status == "Completed") {
                                logger.info("Second trade successful for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT>")
                            } else {
                                logger.warn("First trade has failed for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT>, canceling order")
                                tradeio.cancelOrder(resp.order.orderId).then(function (resp) {
                                    if (resp.order.status == "Canceled") {
                                        logger.warn("Second trade successful canceled for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT>")
                                    }
                                })
                            }
                        })
                        weight++;

                        price = ticker_intermediate_usdt.bidPrice;
                        qty = Math.round(qty_ini * ticker_intermediate.bidPrice, infos.get(symbol+"_"+intermediate).baseAssetPrecision)

                        tradeio.newOrder(symbol+"_"+intermediate, "sell", "limit", qty, price).then(function (resp) {
                            if (resp.order.status == "Completed") {
                                logger.info("Third trade successful for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT>")
                            } else {
                                logger.warn("Third trade has failed for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT>, canceling order")
                                tradeio.cancelOrder(resp.order.orderId).then(function (resp) {
                                    if (resp.order.status == "Canceled") {
                                        logger.warn("Third trade successful canceled for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT>")
                                    }
                                })
                            }
                        })
                        weight++;

                        //sleep
                        //manageArbitrageETH_BTC(tickers, infos, symbol)
                    } else {
                        logger.warn("First trade has failed for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT>, canceling order")
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


/////////////////////////////////////////////
///////// ETH TO XXX TO USDT TO ETH /////////
////////////////////////////////////////////
/////////////////////////////////////////////
///////// ETH TO XXX TO BTC TO ETH //////////
////////////////////////////////////////////
/////////////////////////////////////////////
///////  BTC TO XXX TO USDT TO BTC //////////
////////////////////////////////////////////
var manageArbitrageSource_X_Intermediate_Source = function (tickers, symbol, source, intermediate) {
    logger.info("Launching arbitrage : <"+source+" TO " + symbol + " TO " + intermediate + " TO "+source+">")

    //BTC
    let ticker_source = tickers.get(symbol + "_"+source)
    //USDT
    let ticker_intermediate = tickers.get(symbol + "_" + intermediate)
    let ticker_source_intermediate = tickers.get(intermediate + "_" + usdt)


    if (ticker_source &&
        ticker_intermediate &&
        process.env.Exclusions.indexOf(symbol) == -1 &&
        ticker_source.askPrice > 0 &&
        ticker_intermediate.bidPrice > 0) {
        logger.info("Tickers exists for " + symbol)

        let bonus = ticker_intermediate.bidPrice * ticker_source.askPrice / ticker_source_intermediate.askPrice
        logger.info(symbol + " bonus -> " + bonus)

        if (bonus > 1.004) {
            logger.info("Found positive trade")
           
            var minIntermediate;
            var maxIntermediate;
            if (intermediate =="eth"){
                minIntermediate = process.env.MinETH
                maxIntermediate = process.env.MaxETH
            } else if(intermediate == "btc"){
                minIntermediate = process.env.MinBTC
                maxIntermediate = process.env.MaxBTC
            }
            else {
                minIntermediate = process.env.MinUSDT
                maxIntermediate = process.env.MaxUSDT
            }

            var minSource;
            var maxSource;
            if (source =="seth"){
                minSource = process.env.MinETH
                maxSource = process.env.MaxETH
            }
            else if(source == "btc"){
                minSource = process.env.MinBTC
                maxSource = process.env.MaxBTC
            }
            else {
                minSource = process.env.MinUSDT
                maxSource = process.env.MaxUSDT
            }

            var valIntermediate;
            if (intermediate =="eth")
                valIntermediate = val_eth
            else if(intermediate == "btc")
                valIntermediate = val_btc
            else 
                valIntermediate = val_btc_eth

            var valSource;
            if (source =="eth")
                valSource = val_eth
            else if(source == "btc")
                valSource = val_btc
            else 
                valSource = val_btc_eth


            if (ticker_intermediate.bidPrice * ticker_intermediate.bidQty > minIntermediate && ticker_source.askQty * ticker_source.askPrice > minSource && ticker_source.askPrice * ticker_source.askQty * valSource > minIntermediate) {
                logger.info("Quantity is enough for trade for symbol " + symbol)

                let price = ticker_source.askPrice
                let qty = Math.min(maxSource / price, ticker_intermediate.bidQty, ticker_source.askQty)
                qty = Math.round(qty, infos.get(symbol+"_"+source))
                var qty_ini = Math.round(Math.min(maxSource / price, ticker_source.askQty, ticker_intermediate.bidQty), infos.get(symbol + "_"+source).baseAssetPrecision);
                weight++

                console.log(price)
                console.log(qty)
                console.log(qty_ini)
                logger.info("Initiating order for symbol " + symbol)

                tradeio.newOrder(symbol + "_btc", "buy", "limit", qty, price).then(function (resp) {
                    if (resp.order.status == "Completed") {
                        logger.info("First trade successful for arbitrage <"+source+" TO " + symbol + " TO " + intermediate + " TO "+source+">")
                        let price = ticker_intermediate.bidPrice
                        let qty = qty_ini
                        qty = Math.round(qty_ini / 1.001, infos.get(symbol + "_" +intermediate).baseAssetPrecision)

                        tradeio.newOrder(symbol + "_"+intermediate, "sell", "limit", qty, price).then(function (resp) {
                            if (resp.order.status == "Completed") {
                                logger.info("Second trade successful for arbitrage <"+source+" TO " + symbol + " TO " + intermediate + " TO "+source+">")
                            } else {
                                logger.warn("First trade has failed for arbitrage <"+source+" TO " + symbol + " TO " + intermediate + " TO "+source+">, canceling order")
                                tradeio.cancelOrder(resp.order.orderId).then(function (resp) {
                                    if (resp.order.status == "Canceled") {
                                        logger.warn("Second trade successful canceled for arbitrage <"+source+" TO " + symbol + " TO " + intermediate + " TO "+source+">")
                                    }
                                })
                            }
                        })
                        weight++;

                        price = ticker_source_intermediate.askPrice;
                        qty = Math.round(qty_ini * ticker_source.askPrice, infos.get(symbol+"_"+intermediate).baseAssetPrecision)

                        tradeio.newOrder(symbol+"_"+intermediate, "sell", "limit", qty, price).then(function (resp) {
                            if (resp.order.status == "Completed") {
                                logger.info("Third trade successful for arbitrage <"+source+" TO " + symbol + " TO " + intermediate + " TO "+source+">")
                            } else {
                                logger.warn("Third trade has failed for arbitrage <"+source+" TO " + symbol + " TO " + intermediate + " TO "+source+">, canceling order")
                                tradeio.cancelOrder(resp.order.orderId).then(function (resp) {
                                    if (resp.order.status == "Canceled") {
                                        logger.warn("Third trade successful canceled for arbitrage <"+source+" TO " + symbol + " TO " + intermediate + " TO "+source+">")
                                    }
                                })
                            }
                        })
                        weight++;

                        //sleep
                        //manageArbitrageETH_BTC(tickers, infos, symbol)
                    } else {
                        logger.warn("First trade has failed for arbitrage <"+source+" TO " + symbol + " TO " + intermediate + " TO "+source+">, canceling order")
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
exports.launchArbitrage = launchArbitrage;