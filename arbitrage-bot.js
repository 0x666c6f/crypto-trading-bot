var tradeIO = require('./tradeio')
var tradingUtils = require('./trading-utils')
const log = require('ololog').configure({
    time: true
})
const ansi = require('ansicolor').nice
var sleep = require('sleep');
const moment = require("moment")

var totalDailyWeight = 0;
var totalDailyOrderWeight = 0;

var totalMinuteWeight = 0;
var totalMinuteOrderWeight = 0;

var totalHourlyWeight = 0;
var totalHourlyOrderWeight = 0;

var valBTC = null;
var valBtcEth = null;
var valETH = null;

var start = async function (infos) {
    var startDayDate = new Date();
    log("Starting Arbitrage at ", startDayDate)
    log(totalDailyOrderWeight, process.env.OrderDailyLimit)
    while (totalDailyWeight < (process.env.APIDailyLimit - 23) && (totalDailyOrderWeight < process.env.OrderDailyLimit - 3)) {
        var startHourDate = new Date();
        log("Daily Weights :")
        log("Daily Weight :", totalDailyWeight)
        log("Daily Order Weight :", totalDailyOrderWeight)
        while (totalHourlyWeight < (process.env.APIHourlyLimit - 23) && (totalHourlyOrderWeight < process.env.OrderHourlyLimit - 3)) {
            var startMinuteDate = new Date();
            log("Hourly Weights :")
            log("Hourly Weight :", totalHourlyWeight)
            log("Hourly Order Weight :", totalHourlyOrderWeight)
            while (totalMinuteWeight < (process.env.APIMinuteLimit - 23) && (totalMinuteOrderWeight < process.env.OrderMinuteLimit - 3)) {
                await launchArbitrage(infos)
                sleep.msleep(800);
                log("Arbitrages finished")
                log("Minute Weights :")
                log("Minute Weight :", totalMinuteWeight)
                log("Minute Order Weight :", totalMinuteOrderWeight)
            }
            totalMinuteWeight = 0;
            totalMinuteOrderWeight = 0;
            if (new Date().getMinutes() == startMinuteDate.getMinutes()) {
                let now = moment();
                let val = moment().endOf('minute');

                let ms = val.diff(now, 'milliseconds');

                log("Will sleep", ms, "to reset minute weight")
                sleep.msleep(ms + 1000)
                log("Waking up, sleep is over !")
            }
            log("Minute has changed, resetting minute weights")
        }
        totalHourlyWeight = 0;
        totalHourlyOrderWeight = 0;
        if (new Date().getHours() == startHourDate.getHours()) {
            let now = moment();
            let val = moment().endOf('hour');

            let ms = val.diff(now, 'milliseconds');

            log("Will sleep", ms, "to reset hour weight")
            sleep.msleep(ms + 1000)
            log("Waking up, sleep is over !")

        }
        log("Hour has changed, resetting hour weights")
    }
    totalDailyWeight = 0;
    totalDailyOrderWeight = 0;
    if (new Date().getDay() == startDayDate.getDay()) {
        let now = moment();
        let val = moment().endOf('day');

        let ms = val.diff(now, 'milliseconds');

        log("Will sleep", ms, "to reset day weight")
        sleep.msleep(ms + 1000)
        log("Waking up, sleep is over !")

    }
    log("Day has changed, resetting day weights")
    start();
}



var launchArbitrage = async function (infos) {
    log("Launching arbitrages")
    let tickers = await tradeIO.tickers();
    if (tickers.code != 0) {
        log.error("Error while retrieving tickers: ", tickers)
        return;
    }
    totalDailyWeight += 20;
    totalMinuteWeight += 20;
    totalHourlyWeight += 20;

    let formattedTickers = tradingUtils.formatTickers(tickers.tickers)
    valBTC = formattedTickers.get('btc_usdt').askPrice;
    valBtcEth = formattedTickers.get('eth_btc').askPrice;
    valETH = formattedTickers.get('eth_usdt').askPrice;

    let symbols = formattedTickers.get("symbols")
    symbols.forEach(ticker => {
        //manageArbitrageBTCtoXtoETHtoBTC(formattedTickers, infos, ticker)
        //manageArbitrageUSDT_X_Intermediate_USDT(formattedTickers, infos, ticker,"btc")
        manageArbitrageSource_X_Intermediate_Source(formattedTickers, infos, ticker, "eth", "btc");

        manageArbitrageSource_X_Intermediate_Source(formattedTickers, infos, ticker, "eth", "usdt");


    });



}

/////////////////////////////////////////////
///////// BTC TO XXX TO ETH TO BTC //////////
////////////////////////////////////////////
var manageArbitrageBTCtoXtoETHtoBTC = async function (tickers, infos, symbol) {
    //log("Checking arbitrage : <BTC TO " + symbol + " TO ETH TO BTC>")
    let tickerBTC = tickers.get(symbol + "_btc")
    let tickerETH = tickers.get(symbol + "_eth")
    let tickerEthBtc = tickers.get("eth_btc")

    if (tickerETH &&
        tickerBTC &&
        process.env.Exclusions.indexOf(symbol) == -1 &&
        tickerBTC.askPrice > 0 &&
        tickerETH.bidPrice > 0) {
        //log("Tickers exists for " + symbol)
        let bonus = tickerETH.bidPrice * tickerEthBtc.bidPrice / tickerBTC.askPrice
        log(symbol + " bonus -> " + bonus)

        if (bonus > process.env.MinProfit) {
            log.green("Found positive trade")
            if (tickerBTC.askPrice * tickerBTC.askQty > process.env.MinBTC && tickerETH.bidQty * tickerETH.bidPrice > process.env.MinETH && tickerETH.bidPrice * tickerETH.bidQty * valBtcEth > process.env.MinBTC) {
                log.green("Quantity is enough for trade for symbol " + symbol)

                let price = tickerBTC.askPrice
                let qty = Math.min(process.env.MaxBTC / price, tickerBTC.askQty, tickerETH.bidQty)
                qty = Math.round(qty, infos.get(tickerBTC.baseAssetPrecision))
                var qtyIni = Math.round(Math.min(process.env.MaxBTC / price, tickerBTC.askQty, tickerETH.bidQty), infos.get(symbol + "_eth").baseAssetPrecision);
                log.green("Initiating order for symbol " + symbol)

                let orderA = await tradeIO.newOrder(symbol + "_btc", "buy", "limit", qty, price);

                totalDailyWeight++;
                totalDailyOrderWeight++;

                totalMinuteWeight++;
                totalMinuteOrderWeight++;

                totalHourlyWeight++;
                totalHourlyOrderWeight++;

                if (orderA.order.status == "Completed") {
                    log.green("First trade successful for arbitrage <BTC TO " + symbol + " TO ETH TO BTC>")
                    let price = tickerETH.bidPrice
                    let qty = qtyIni
                    qty = Math.round(qtyIni / 1.001, infos.get(symbol + "_eth").baseAssetPrecision)
                    let orderB = await tradeIO.newOrder(symbol + "_eth", "sell", "limit", qty, price);

                    if (orderB.order.status == "Completed") {
                        log.green("Second trade successful for arbitrage <BTC TO " + symbol + " TO ETH TO BTC>")

                        totalDailyWeight++;
                        totalDailyOrderWeight++;

                        totalMinuteWeight++;
                        totalMinuteOrderWeight++;

                        totalHourlyWeight++;
                        totalHourlyOrderWeight++;

                        price = tickerEthBtc.bidPrice;
                        qty = Math.round(qtyIni * tickerETH.bidPrice, infos.get("eth_btc").baseAssetPrecision)

                        let orderC = await tradeIO.newOrder("eth_btc", "sell", "limit", qty, price);

                        totalDailyWeight++;
                        totalDailyOrderWeight++;

                        totalMinuteWeight++;
                        totalMinuteOrderWeight++;

                        totalHourlyWeight++;
                        totalHourlyOrderWeight++;

                        if (orderC.order.status == "Completed") {
                            log.green("Third trade successful for arbitrage <BTC TO " + symbol + " TO ETH TO BTC>")
                        } else {
                            log.warn("Third trade has failed for arbitrage <BTC TO " + symbol + " TO ETH TO BTC>, canceling order")
                            // tradeIO.cancelOrder(resp.order.orderId).then(function (resp) {
                            //     if (resp.order.status == "Canceled") {
                            //         log.warn("Third trade successful canceled for arbitrage <BTC TO " + symbol + " TO ETH TO BTC>")
                            //     }
                            // })
                        }
                    } else {
                        log.warn("First trade has failed for arbitrage <BTC TO " + symbol + " TO ETH TO BTC>, canceling order")
                        // tradeIO.cancelOrder(resp.order.orderId).then(function (resp) {
                        //     if (resp.order.status == "Canceled") {
                        //         log.warn("Second trade successful canceled for arbitrage <BTC TO " + symbol + " TO ETH TO BTC>")
                        //     }
                        // })
                    }

                    //sleep
                    //manageArbitrageETH_BTC(tickers, infos, symbol)
                } else {
                    log.warn("First trade has failed for arbitrage <BTC TO " + symbol + " TO ETH TO BTC>, canceling order")
                    totalDailyWeight++;
                    // tradeIO.cancelOrder(resp.order.orderId).then(function (resp) {

                    //     //manageArbitrageETH_BTC(tickers, infos, symbol)
                    // })
                }
            } else {
                log.warn("Not enough quantity for trade for symbol " + symbol)

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
var manageArbitrageUSDT_X_Intermediate_USDT = async function (tickers, infos, symbol, intermediate) {
    //log("Checking arbitrage : <USDT TO " + symbol + " TO " + intermediate + " TO USDT>")

    let tickerUSDT = tickers.get(symbol + "_usdt")
    let tickerIntermediate = tickers.get(symbol + "_" + intermediate)
    let tickerIntermediateUSDT = tickers.get(intermediate + "_usdt")

    if (tickerUSDT &&
        tickerIntermediate &&
        process.env.Exclusions.indexOf(symbol) == -1 &&
        tickerUSDT.askPrice > 0 &&
        tickerIntermediate.bidPrice > 0) {
        //log("Tickers exists for " + symbol)

        let bonus = tickerIntermediateUSDT.bidPrice * tickerIntermediate.bidPrice / tickerUSDT.askPrice
        log(symbol + " bonus -> " + bonus)

        if (bonus > process.env.MinProfit) {
            log.green("Found positive trade")

            var minIntermediate;
            if (intermediate == "eth")
                minIntermediate = process.env.MinETH
            else
                minIntermediate = process.env.MinBTC

            var valIntermediate;
            if (intermediate == "eth")
                valIntermediate = valETH
            else
                valIntermediate = valBTC

            if (tickerUSDT.askPrice * tickerUSDT.askQty > process.env.MinUSDT && tickerIntermediate.bidQty * tickerIntermediate.bidPrice > minIntermediate && tickerIntermediate.bidPrice * tickerIntermediate.bidQty * valIntermediate > process.env.MinUSDT) {
                log.green("Quantity is enough for trade for symbol " + symbol)

                let price = tickerUSDT.askPrice
                let qty = Math.min(process.env.MaxUSDT / price, tickerUSDT.askQty, tickerIntermediate.bidQty)
                qty = Math.round(qty, infos.get(tickerUSDT.baseAssetPrecision))
                var qtyIni = Math.round(Math.min(process.env.MaxUSDT / price, tickerUSDT.askQty, tickerIntermediate.bidQty), infos.get(symbol + "_" + intermediate).baseAssetPrecision);
                totalDailyWeight++

                log("Initiating order for symbol " + symbol)

                let orderA = await tradeIO.newOrder(symbol + "_btc", "buy", "limit", qty, price);

                if (orderA.order.status == "Completed") {
                    log.green("First trade successful for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT>")
                    let price = tickerIntermediate.bidPrice
                    let qty = qtyIni
                    qty = Math.round(qtyIni / 1.001, infos.get(symbol + "_" + intermediate).baseAssetPrecision)
                    let orderB = await tradeIO.newOrder(symbol + "_" + intermediate, "sell", "limit", qty, price);

                    if (orderB.order.status == "Completed") {
                        log.green("Second trade successful for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT>")

                        totalDailyWeight++;

                        price = tickerIntermediateUSDT.bidPrice;
                        qty = Math.round(qtyIni * tickerIntermediate.bidPrice, infos.get(symbol + "_" + intermediate).baseAssetPrecision)

                        let orderC = await tradeIO.newOrder(symbol + "_" + intermediate, "sell", "limit", qty, price);

                        if (orderC.order.status == "Completed") {
                            log.green("Third trade successful for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT>")
                        } else {
                            log.warn("Third trade has failed for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT>, canceling order")
                            tradeIO.cancelOrder(resp.order.orderId).then(function (resp) {
                                if (resp.order.status == "Canceled") {
                                    log.warn("Third trade successful canceled for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT>")
                                }
                            })
                        }
                        totalDailyWeight++;
                    } else {
                        log.warn("First trade has failed for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT>, canceling order")
                        tradeIO.cancelOrder(resp.order.orderId).then(function (resp) {
                            if (resp.order.status == "Canceled") {
                                log.warn("Second trade successful canceled for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT>")
                            }
                        })
                    }
                } else {
                    log.warn("First trade has failed for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT>, canceling order")
                    totalDailyWeight++;
                    tradeIO.cancelOrder(resp.order.orderId).then(function (resp) {
                        if (resp.order.status == "Canceled") {
                            log.warn("First trade successful canceled for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT>")
                        }
                    })
                }
            } else {
                log.warn("Not enough quantity for trade for symbol " + symbol)

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
var manageArbitrageSource_X_Intermediate_Source = async function (tickers, infos, symbol, source, intermediate) {
    //log("Checking arbitrage : <" + source + " TO " + symbol + " TO " + intermediate + " TO " + source + ">")

        let tickerSource = tickers.get(symbol + "_" + source)
        let tickerIntermediate = tickers.get(symbol + "_" + intermediate)
        let tickerSourceIntermediate = tickers.get(source + "_" + intermediate)


        if (tickerSource &&
            tickerIntermediate &&
            process.env.Exclusions.indexOf(symbol) == -1 &&
            tickerSource.askPrice > 0 &&
            tickerIntermediate.bidPrice > 0) {
            //log("Tickers exists for " + symbol)

            let bonus = tickerIntermediate.bidPrice / tickerSource.askPrice / tickerSourceIntermediate.askPrice
            log("<" + source + "->" + symbol + "->" + intermediate + "->" + source + ">","| "+ symbol+ " bonus = " + bonus)

            if (bonus > process.env.MinProfit) {
                log.green("Found positive trade")

                var minIntermediate;
                var maxIntermediate;
                if (intermediate == "eth") {
                    minIntermediate = process.env.MinETH
                    maxIntermediate = process.env.MaxETH
                } else if (intermediate == "btc") {
                    minIntermediate = process.env.MinBTC
                    maxIntermediate = process.env.MaxBTC
                } else {
                    minIntermediate = process.env.MinUSDT
                    maxIntermediate = process.env.MaxUSDT
                }

                var minSource;
                var maxSource;
                if (source == "seth") {
                    minSource = process.env.MinETH
                    maxSource = process.env.MaxETH
                } else if (source == "btc") {
                    minSource = process.env.MinBTC
                    maxSource = process.env.MaxBTC
                } else {
                    minSource = process.env.MinUSDT
                    maxSource = process.env.MaxUSDT
                }

                var valIntermediate;
                if (intermediate == "eth")
                    valIntermediate = valETH
                else if (intermediate == "btc")
                    valIntermediate = valBTC
                else
                    valIntermediate = valBtcEth

                var valSource;
                if (source == "eth")
                    valSource = valETH
                else if (source == "btc")
                    valSource = valBTC
                else
                    valSource = valBtcEth


                if (tickerIntermediate.bidPrice * tickerIntermediate.bidQty > minIntermediate && tickerSource.askQty * tickerSource.askPrice > minSource && tickerSource.askPrice * tickerSource.askQty * valSource > minIntermediate) {
                    log.green("Quantity is enough for trade for symbol " + symbol)

                    let price = tickerSource.askPrice
                    let qty = Math.min(maxSource / price, tickerIntermediate.bidQty, tickerSource.askQty)
                    qty = Math.round(qty, infos.get(symbol + "_" + source))
                    var qtyIni = Math.round(Math.min(maxSource / price, tickerSource.askQty, tickerIntermediate.bidQty), infos.get(symbol + "_" + source).baseAssetPrecision);

                    log.green("Initiating order for symbol " + symbol)

                    let orderA = await tradeIO.newOrder(symbol + "_"+source, "buy", "limit", qty, price);
                    log.green("<",symbol,"> Order A:", orderA)
                    totalDailyWeight++;
                    totalDailyOrderWeight++;

                    totalMinuteWeight++;
                    totalMinuteOrderWeight++;

                    totalHourlyWeight++;
                    totalHourlyOrderWeight++;

                    if (orderA.order.status == "Completed") {
                        log.green("First trade successful for arbitrage <" + source + " TO " + symbol + " TO " + intermediate + " TO " + source + ">")
                        let price = tickerIntermediate.bidPrice
                        let qty = qtyIni
                        qty = Math.round(qtyIni / 1.001, infos.get(symbol + "_" + intermediate).baseAssetPrecision)

                        let orderB = await tradeIO.newOrder(symbol + "_" + intermediate, "sell", "limit", qty, price);
                        log.green("<",symbol,"> Order B:", orderB)

                        totalDailyWeight++;
                        totalDailyOrderWeight++;

                        totalMinuteWeight++;
                        totalMinuteOrderWeight++;

                        totalHourlyWeight++;
                        totalHourlyOrderWeight++;

                        if (orderB.order.status == "Completed") {
                            log.green("Second trade successful for arbitrage <" + source + " TO " + symbol + " TO " + intermediate + " TO " + source + ">")

       

                            price = tickerSourceIntermediate.askPrice;
                            qty = Math.round(qtyIni * tickerSource.askPrice, infos.get(symbol + "_" + intermediate).baseAssetPrecision)

                            let orderC = await tradeIO.newOrder(source + "_" + intermediate, "sell", "limit", qty, price);
                            log.green("<",symbol,"> Order C:", orderC)

                            totalDailyWeight++;
                            totalDailyOrderWeight++;

                            totalMinuteWeight++;
                            totalMinuteOrderWeight++;

                            totalHourlyWeight++;
                            totalHourlyOrderWeight++;

                            if (orderC.order.status == "Completed") {
                                log.green("Third trade successful for arbitrage <" + source + " TO " + symbol + " TO " + intermediate + " TO " + source + ">")
                            } else {
                                log.warn("Third trade has failed for arbitrage <" + source + " TO " + symbol + " TO " + intermediate + " TO " + source + ">, canceling order")
                                // tradeIO.cancelOrder(resp.order.orderId).then(function (resp) {
                                //     if (resp.order.status == "Canceled") {
                                //         log.warn("Third trade successful canceled for arbitrage <" + source + " TO " + symbol + " TO " + intermediate + " TO " + source + ">")
                                //     }
                                // })
                            }

                        } else {
                            log.warn("First trade has failed for arbitrage <" + source + " TO " + symbol + " TO " + intermediate + " TO " + source + ">, canceling order")
                            // tradeIO.cancelOrder(resp.order.orderId).then(function (resp) {
                            //     if (resp.order.status == "Canceled") {
                            //         log.warn("Second trade successful canceled for arbitrage <" + source + " TO " + symbol + " TO " + intermediate + " TO " + source + ">")
                            //     }
                            // })
                        }
                    } else {
                        log.warn("First trade has failed for arbitrage <" + source + " TO " + symbol + " TO " + intermediate + " TO " + source + ">, canceling order")
                        // tradeIO.cancelOrder(resp.order.orderId).then(function (resp) {
                        //     resolve()
                        //     //manageArbitrageETH_BTC(tickers, infos, symbol)
                        // })
                    }
                } else {
                    log.warn("Not enough quantity for trade for symbol " + symbol)
                }

            }
        } else {
            //log.warn("Ticker doesn't exist for symbol", symbol)
        }
}
exports.start = start;