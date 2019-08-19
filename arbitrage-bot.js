var tradeIO = require('./tradeio')
var tradingUtils = require('./trading-utils')
const log = require('./logger').logger
var sleep = require('sleep');
const moment = require("moment")
const BigNumber = require('bignumber.js');
BigNumber.config({
    ROUNDING_MODE: 1
})

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
    var endDayDate = moment().add(1, "day")
    log("Starting Arbitrage")
    while (totalDailyWeight < (process.env.APIDailyLimit - 23) && (totalDailyOrderWeight < process.env.OrderDailyLimit - 3) && moment().isBefore(endDayDate)) {
        var endHourDate = moment().add(1, "hour");

        // log("Daily Weights :")
        // log("Daily Weight :", totalDailyWeight)
        // log("Daily Order Weight :", totalDailyOrderWeight)
        while (totalHourlyWeight < (process.env.APIHourlyLimit - 23) && (totalHourlyOrderWeight < process.env.OrderHourlyLimit - 3) && moment().isBefore(endHourDate)) {
            var endMinuteDate = moment().add(1, "minute")

            // log("Hourly Weights :")
            // log("Hourly Weight :", totalHourlyWeight)
            // log("Hourly Order Weight :", totalHourlyOrderWeight)
            while (totalMinuteWeight < (process.env.APIMinuteLimit - 23) && (totalMinuteOrderWeight < process.env.OrderMinuteLimit - 3) && moment().isBefore(endMinuteDate)) {
                await initArbitrage(infos)
                if (process.env.Timeout != 0)
                    sleep.msleep(process.env.Timeout);
                //log("Arbitrages finished")
                // log("Minute Weights :")
                // log("Minute Weight :", totalMinuteWeight)
                // log("Minute Order Weight :", totalMinuteOrderWeight)
            }
            totalMinuteWeight = 0;
            totalMinuteOrderWeight = 0;
            let now = moment();
            if (now.isBefore(endMinuteDate)) {
                let ms = endMinuteDate.diff(now, 'milliseconds');
                log("Will sleep", ms, "to reset minute weight")
                sleep.msleep(ms + 1000)
                log("Waking up, sleep is over !")
            }
            log("Minute has changed, resetting minute weights")
        }
        totalHourlyWeight = 0;
        totalHourlyOrderWeight = 0;
        let now = moment();
        if (now.isBefore(endHourDate)) {
            let ms = endHourDate.diff(now, 'milliseconds');

            log("Will sleep", ms, "to reset hour weight")
            sleep.msleep(ms + 1000)
            log("Waking up, sleep is over !")

        }
        log("Hour has changed, resetting hour weights")
    }
    totalDailyWeight = 0;
    totalDailyOrderWeight = 0;
    let now = moment();
    if (now.isBefore(endDayDate)) {
        let ms = endDayDate.diff(now, 'milliseconds');
        log("Will sleep", ms, "to reset day weight")
        sleep.msleep(ms + 1000)
        log("Waking up, sleep is over !")

    }
    log("Day has changed, resetting day weights")
    start();
}



var initArbitrage = async function (infos) {

    // log("====================")
    // log("Launching arbitrages")
    // log("====================")

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
    for (const ticker of symbols) {
        //log(">>> Checking arbitrages for symbol", "<" + ticker.toUpperCase() + ">")
        await manageArbitrageBTCtoXtoETHtoBTC(formattedTickers, infos, ticker)
        await manageArbitrageUSDT_X_Intermediate_USDT(formattedTickers, infos, ticker, "btc")
        await manageArbitrageUSDT_X_Intermediate_USDT(formattedTickers, infos, ticker, "eth")
        await manageArbitrageSource_X_Intermediate_Source(formattedTickers, infos, ticker, "eth", "usdt");
        await manageArbitrageSource_X_Intermediate_Source(formattedTickers, infos, ticker, "eth", "btc");
    }
}


/////////////////////////////////////////////
///////// BTC TO XXX TO ETH TO BTC //////////
////////////////////////////////////////////
var manageArbitrageBTCtoXtoETHtoBTC = async function (tickers, infos, symbol) {
    let tickerBTC = tickers.get(symbol + "_btc")
    let tickerETH = tickers.get(symbol + "_eth")
    let tickerEthBtc = tickers.get("eth_btc")

    if (tickerETH &&
        tickerBTC &&
        tickerBTC.askPrice > 0 &&
        tickerETH.bidPrice > 0) {
        //log("Tickers exists for " + symbol)
        let bonus = tickerETH.bidPrice * tickerEthBtc.bidPrice / tickerBTC.askPrice

        if (bonus > process.env.MinProfit) {
            log.green("Found positive trade for symbol ", symbol.toUpperCase())
            if (tickerBTC.askPrice * tickerBTC.askQty > process.env.MinBTC && tickerETH.bidQty * tickerETH.bidPrice > process.env.MinETH && tickerETH.bidPrice * tickerETH.bidQty * valBtcEth > process.env.MinBTC) {
                log("\t<BTC->" + symbol.toUpperCase() + "->ETH->BTC>", "| " + symbol.toUpperCase() + " bonus = " + bonus)
                log.green("Quantity is enough for trade for symbol " + symbol)

                let price = tickerBTC.askPrice

                let qty = Math.min(process.env.MaxBTC / price, tickerBTC.askQty, tickerETH.bidQty)
                qty = new BigNumber(qty).decimalPlaces(infos.get(symbol + "_btc").baseAssetPrecision).toNumber()
                var qtyIni = new BigNumber(qty).decimalPlaces(infos.get(symbol + "_eth").baseAssetPrecision).toNumber();

                log.green("Initiating order for symbol " + symbol)

                let orderA = await tradeIO.newOrder(symbol + "_btc", "buy", "limit", qty, price);
                totalDailyWeight++;
                totalDailyOrderWeight++;

                totalMinuteWeight++;
                totalMinuteOrderWeight++;

                totalHourlyWeight++;
                totalHourlyOrderWeight++;

                if (orderA.code === 0 && orderA.order.status == "Completed") {
                    log.green("First trade successful for arbitrage <BTC TO " + symbol + " TO ETH TO BTC> :", orderA)

                    let price = tickerETH.bidPrice

                    qty = new BigNumber(qtyIni - orderA.order.quoteAmount).decimalPlaces(infos.get(symbol + "_eth").baseAssetPrecision).toNumber();

                    let orderB = await tradeIO.newOrder(symbol + "_eth", "sell", "limit", qty, price);

                    if (orderB.code === 0 && orderB.order.status == "Completed") {
                        log.green("Second trade successful for arbitrage <BTC TO " + symbol + " TO ETH TO BTC> :", orderB)

                        totalDailyWeight++;
                        totalDailyOrderWeight++;

                        totalMinuteWeight++;
                        totalMinuteOrderWeight++;

                        totalHourlyWeight++;
                        totalHourlyOrderWeight++;

                        price = tickerEthBtc.bidPrice;

                        qty = new BigNumber((qtyIni - orderB.order.quoteAmount) * tickerETH.bidPrice).decimalPlaces(infos.get("eth_btc").baseAssetPrecision).toNumber();

                        let orderC = await tradeIO.newOrder("eth_btc", "sell", "limit", qty, price);

                        totalDailyWeight++;
                        totalDailyOrderWeight++;

                        totalMinuteWeight++;
                        totalMinuteOrderWeight++;

                        totalHourlyWeight++;
                        totalHourlyOrderWeight++;

                        if (orderC.code === 0 && orderC.order.status == "Completed") {
                            log.green("Third trade successful for arbitrage <BTC TO " + symbol + " TO ETH TO BTC> :", orderC)
                        } else {
                            log.error("Third trade has failed for arbitrage <BTC TO " + symbol + " TO ETH TO BTC> :", orderC)

                            // tradeIO.cancelOrder(resp.order.orderId).then(function (resp) {
                            //     if (resp.order.status == "Canceled") {
                            //         log.warn("Third trade successful canceled for arbitrage <BTC TO " + symbol + " TO ETH TO BTC>")
                            //     }
                            // })
                        }
                    } else {
                        log.error("Second trade has failed for arbitrage <BTC TO " + symbol + " TO ETH TO BTC> :", orderB)
                        // tradeIO.cancelOrder(resp.order.orderId).then(function (resp) {
                        //     if (resp.order.status == "Canceled") {
                        //         log.warn("Second trade successful canceled for arbitrage <BTC TO " + symbol + " TO ETH TO BTC>")
                        //     }
                        // })
                    }

                    //sleep
                    //manageArbitrageETH_BTC(tickers, infos, symbol)
                } else {
                    log.error("First trade has failed for arbitrage <BTC TO " + symbol + " TO ETH TO BTC> :", orderA)
                    totalDailyWeight++;
                    // tradeIO.cancelOrder(resp.order.orderId).then(function (resp) {

                    //     //manageArbitrageETH_BTC(tickers, infos, symbol)
                    // })
                }
            } else {
                log("Not enough quantity for trade for symbol " + symbol)

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
        tickerUSDT.askPrice > 0 &&
        tickerIntermediate.bidPrice > 0) {
        //log("Tickers exists for " + symbol)

        let bonus = tickerIntermediateUSDT.bidPrice * tickerIntermediate.bidPrice / tickerUSDT.askPrice

        if (bonus > process.env.MinProfit) {
            log.green("Found positive trade for symbol ", symbol.toUpperCase())

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
                log("\t<USDT->" + symbol.toUpperCase() + "->" + intermediate.toUpperCase() + "->USDT>", "| " + symbol.toUpperCase() + " bonus = " + bonus)
                log.green("Quantity is enough for trade for symbol " + symbol)

                let price = tickerUSDT.askPrice
                let qty = Math.min(process.env.MaxUSDT / price, tickerUSDT.askQty, tickerIntermediate.bidQty)
                qty = new BigNumber(qty).decimalPlaces(infos.get(symbol + "_usdt").baseAssetPrecision).toNumber();
                var qtyIni = new BigNumber(qty).decimalPlaces(infos.get(symbol + "_" + intermediate).baseAssetPrecision).toNumber();

                log("Initiating order for symbol " + symbol)

                let orderA = await tradeIO.newOrder(symbol + "_usdt", "buy", "limit", qty, price);
                log("Order A response :", orderA)

                totalDailyWeight++;
                totalDailyOrderWeight++;

                totalMinuteWeight++;
                totalMinuteOrderWeight++;

                totalHourlyWeight++;
                totalHourlyOrderWeight++;

                if (orderA.code === 0 && orderA.order.status == "Completed") {
                    log.green("First trade successful for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT> :", orderA)

                    let price = tickerIntermediate.bidPrice
                    let qty = new BigNumber(qtyIni - orderA.order.quoteAmount).decimalPlaces(infos.get(symbol + "_" + intermediate).baseAssetPrecision).toNumber()

                    let orderB = await tradeIO.newOrder(symbol + "_" + intermediate, "sell", "limit", qty, price);
                    log("Order B response :", orderB)

                    totalDailyWeight++;
                    totalDailyOrderWeight++;

                    totalMinuteWeight++;
                    totalMinuteOrderWeight++;

                    totalHourlyWeight++;
                    totalHourlyOrderWeight++;

                    if (orderB.code === 0 && orderB.order.status == "Completed") {
                        log.green("Second trade successful for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT> :", orderB)
                        price = tickerIntermediateUSDT.bidPrice;
                        qty = new BigNumber((qtyIni - orderB.order.quoteAmount) * tickerIntermediate.bidPrice).decimalPlaces(infos.get(intermediate + "_usdt").baseAssetPrecision).toNumber()

                        let orderC = await tradeIO.newOrder(symbol + "_" + intermediate, "sell", "limit", qty, price);
                        log("Order C response :", orderC)

                        totalDailyWeight++;
                        totalDailyOrderWeight++;

                        totalMinuteWeight++;
                        totalMinuteOrderWeight++;

                        totalHourlyWeight++;
                        totalHourlyOrderWeight++;

                        if (orderC.code === 0 && orderC.order.status == "Completed") {
                            log.green("Third trade successful for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT> :", orderC)
                        } else {
                            log.error("Third trade has failed for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT> :", orderC)
                            // tradeIO.cancelOrder(resp.order.orderId).then(function (resp) {
                            //     if (resp.order.status == "Canceled") {
                            //         log.warn("Third trade successful canceled for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT>")
                            //     }
                            // })
                        }
                    } else {
                        log.error("Second trade has failed for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT> :", orderB)
                        // tradeIO.cancelOrder(resp.order.orderId).then(function (resp) {
                        //     if (resp.order.status == "Canceled") {
                        //         log.warn("Second trade successful canceled for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT>")
                        //     }
                        // })
                    }
                } else {
                    log.error("First trade has failed for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT> :", orderA)
                    // totalDailyWeight++;
                    // tradeIO.cancelOrder(resp.order.orderId).then(function (resp) {
                    //     if (resp.order.status == "Canceled") {
                    //         log.warn("First trade successful canceled for arbitrage <USDT TO " + symbol + " TO " + intermediate + " TO USDT>")
                    //     }
                    // })
                }
            } else {
                log("Not enough quantity for trade for symbol " + symbol)

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
        tickerSource.askPrice > 0 &&
        tickerIntermediate.bidPrice > 0) {
        //log("Tickers exists for " + symbol)

        let bonus = tickerIntermediate.bidPrice / tickerSource.askPrice / tickerSourceIntermediate.askPrice

        if (bonus > process.env.MinProfit) {
            log.green("Found positive trade for symbol ", symbol.toUpperCase())

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
            if (source == "eth") {
                minSource = process.env.MinETH
                maxSource = process.env.MaxETH
            } else if (source == "btc") {
                minSource = process.env.MinBTC
                maxSource = process.env.MaxBTC
            } else {
                minSource = process.env.MinUSDT
                maxSource = process.env.MaxUSDT
            }

            var valSourceIntermediate;
            if (source == "eth" && intermediate == "usdt")
                valSourceIntermediate = valETH
            else if (source == "btc" && intermediate == "usdt")
                valSourceIntermediate = valBTC
            else
                valSourceIntermediate = valBtcEth


            if (tickerIntermediate.bidPrice * tickerIntermediate.bidQty > minIntermediate && tickerSource.askQty * tickerSource.askPrice > minSource && tickerSource.askPrice * tickerSource.askQty * valSourceIntermediate > minIntermediate) {
                log("\t<" + source.toUpperCase() + "->" + symbol.toUpperCase() + "->" + intermediate.toUpperCase() + "->" + source.toUpperCase() + ">", "| " + symbol.toUpperCase() + " bonus = " + bonus)
                log.green("Quantity is enough for trade for symbol " + symbol)
                let price = tickerSource.askPrice

                let qty = Math.min(new BigNumber(maxSource / price).decimalPlaces(infos.get(symbol + "_" + source).baseAssetPrecision).toNumber(), tickerSource.askQty, tickerIntermediate.bidQty)
                var qtyIni = new BigNumber(qty).decimalPlaces(infos.get(symbol + "_" + intermediate).baseAssetPrecision).toNumber();

                log.green("Initiating order for symbol " + symbol)

                let orderA = await tradeIO.newOrder(symbol + "_" + source, "buy", "limit", qty, price);

                totalDailyWeight++;
                totalDailyOrderWeight++;

                totalMinuteWeight++;
                totalMinuteOrderWeight++;

                totalHourlyWeight++;
                totalHourlyOrderWeight++;

                if (orderA.code === 0 && orderA.order.status == "Completed") {
                    log.green("First trade successful for arbitrage <" + source + " TO " + symbol + " TO " + intermediate + " TO " + source + "> :", orderA)

                    let price = tickerIntermediate.bidPrice
                    let qtyB = new BigNumber(qtyIni - orderA.order.quoteAmount).decimalPlaces(infos.get(symbol + "_" + intermediate).baseAssetPrecision).toNumber()

                    let orderB = await tradeIO.newOrder(symbol + "_" + intermediate, "sell", "limit", qtyB, price);

                    totalDailyWeight++;
                    totalDailyOrderWeight++;

                    totalMinuteWeight++;
                    totalMinuteOrderWeight++;

                    totalHourlyWeight++;
                    totalHourlyOrderWeight++;

                    if (orderB.code === 0 && orderB.order.status == "Completed") {
                        log.green("Second trade successful for arbitrage <" + source + " TO " + symbol + " TO " + intermediate + " TO " + source + "> :", orderB)

                        price = tickerSourceIntermediate.askPrice;
                        let qtyC = new BigNumber((qtyIni - orderB.order.quoteAmount) * tickerSource.askPrice).decimalPlaces(infos.get(source + "_" + intermediate).baseAssetPrecision).toNumber()

                        let orderC = await tradeIO.newOrder(source + "_" + intermediate, "sell", "limit", qtyC, price);

                        totalDailyWeight++;
                        totalDailyOrderWeight++;

                        totalMinuteWeight++;
                        totalMinuteOrderWeight++;

                        totalHourlyWeight++;
                        totalHourlyOrderWeight++;

                        if (orderC.code === 0 && orderC.order.status == "Completed") {
                            log.green("Third trade successful for arbitrage <" + source + " TO " + symbol + " TO " + intermediate + " TO " + source + "> :", orderC)
                        } else {
                            log.error("Third trade has failed for arbitrage <" + source + " TO " + symbol + " TO " + intermediate + " TO " + source + "> :", orderC)
                            // tradeIO.cancelOrder(resp.order.orderId).then(function (resp) {
                            //     if (resp.order.status == "Canceled") {
                            //         log.warn("Third trade successful canceled for arbitrage <" + source + " TO " + symbol + " TO " + intermediate + " TO " + source + ">")
                            //     }
                            // })
                        }

                    } else {
                        log.error("Second trade has failed for arbitrage <" + source + " TO " + symbol + " TO " + intermediate + " TO " + source + "> :", orderB)
                        // tradeIO.cancelOrder(resp.order.orderId).then(function (resp) {
                        //     if (resp.order.status == "Canceled") {
                        //         log.warn("Second trade successful canceled for arbitrage <" + source + " TO " + symbol + " TO " + intermediate + " TO " + source + ">")
                        //     }
                        // })
                    }
                } else {
                    log.error("First trade has failed for arbitrage <" + source + " TO " + symbol + " TO " + intermediate + " TO " + source + "> :", orderA)
                    // tradeIO.cancelOrder(resp.order.orderId).then(function (resp) {
                    //     resolve()
                    //     //manageArbitrageETH_BTC(tickers, infos, symbol)
                    // })
                }
            } else {
                log("Not enough quantity for trade for symbol " + symbol)
            }

        }
    } else {
        //log.warn("Ticker doesn't exist for symbol", symbol)
    }
}
exports.start = start;