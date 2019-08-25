var tradeIO = require('./tradeio');
var tradingUtils = require('./trading-utils');
const log = require('./logger').logger;
var sleep = require('sleep');
const moment = require("moment");
const BigNumber = require('bignumber.js');
BigNumber.config({
    ROUNDING_MODE: 1
});

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
    var endDayDate = moment().add(1, "day");
    log("Starting Arbitrage");
    while (totalDailyWeight < (process.env.APIDailyLimit - 23) && (totalDailyOrderWeight < process.env.OrderDailyLimit - 3) && moment().isBefore(endDayDate)) {
        var endHourDate = moment().add(1, "hour");

        // log("Daily Weights :")
        // log("Daily Weight :", totalDailyWeight)
        // log("Daily Order Weight :", totalDailyOrderWeight)
        while (totalHourlyWeight < (process.env.APIHourlyLimit - 23) && (totalHourlyOrderWeight < process.env.OrderHourlyLimit - 3) && moment().isBefore(endHourDate)) {
            var endMinuteDate = moment().add(1, "minute");
            var endSecond = moment().set("second", process.env.EndSecond);
            // log("Hourly Weights :")
            // log("Hourly Weight :", totalHourlyWeight)
            // log("Hourly Order Weight :", totalHourlyOrderWeight)
            while (totalMinuteWeight < (process.env.APIMinuteLimit - 23) && (totalMinuteOrderWeight < process.env.OrderMinuteLimit - 3) && moment().isBefore(endMinuteDate) && moment().isBefore(endSecond)) {
                await initArbitrage(infos);
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
                log("Will sleep", ms, "to reset minute weight");
                sleep.msleep(ms);
                log("Waking up, sleep is over !");
            }
        }
        totalHourlyWeight = 0;
        totalHourlyOrderWeight = 0;
        let now = moment();
        if (now.isBefore(endHourDate)) {
            let ms = endHourDate.diff(now, 'milliseconds');

            log("Will sleep", ms, "to reset hour weight");
            sleep.msleep(ms);
            log("Waking up, sleep is over !");

        }
    }
    totalDailyWeight = 0;
    totalDailyOrderWeight = 0;
    let now = moment();
    if (now.isBefore(endDayDate)) {
        let ms = endDayDate.diff(now, 'milliseconds');
        log("Will sleep", ms, "to reset day weight");
        sleep.msleep(ms);
        log("Waking up, sleep is over !");

    }
    start();
};



var initArbitrage = async function (infos) {

    // log("====================")
    // log("Launching arbitrages")
    // log("====================")

    let tickers = await tradeIO.tickers();
    if (tickers.code != 0) {
        log.error("Error while retrieving tickers: ", tickers);
        let sleepTime = moment().diff(moment().add(1,"minute").set("second",process.env.StartSecond));
        log.error("Going to sleep for a while to reset limit :", sleepTime);
        sleep.msleep(sleepTime);
        log.error("Nap is over, getting back to work !");
        return;
    }
    totalDailyWeight += 20;
    totalMinuteWeight += 20;
    totalHourlyWeight += 20;

    let formattedTickers = tradingUtils.formatTickers(tickers.tickers);
    valBTC = formattedTickers.get('btc_usdt').askPrice;
    valBtcEth = formattedTickers.get('eth_btc').askPrice;
    valETH = formattedTickers.get('eth_usdt').askPrice;

    let symbols = formattedTickers.get("symbols");
    for (const ticker of symbols) {
        //log(">>> Checking arbitrages for symbol", "<" + ticker + ">")
        await manageArbitrageBTCtoXtoETHtoBTC(formattedTickers, infos, ticker);
        await manageArbitrageUSDT_X_Intermediate_USDT(formattedTickers, infos, ticker, "btc");
        await manageArbitrageUSDT_X_Intermediate_USDT(formattedTickers, infos, ticker, "eth");
        await manageArbitrageSource_X_Intermediate_Source(formattedTickers, infos, ticker, "eth", "usdt");
        await manageArbitrageSource_X_Intermediate_Source(formattedTickers, infos, ticker, "eth", "btc");
    }
};


/////////////////////////////////////////////
///////// btc->XXX->eth->btc //////////
////////////////////////////////////////////
var manageArbitrageBTCtoXtoETHtoBTC = async function (tickers, infos, symbol) {
    let tickerBTC = tickers.get(symbol + "_btc");
    let tickerETH = tickers.get(symbol + "_eth");
    let tickerEthBtc = tickers.get("eth_btc");

    if (tickerETH &&
        tickerBTC &&
        tickerBTC.askPrice > 0 &&
        tickerETH.bidPrice > 0) {
        //log("Tickers exists for " + symbol)
        let bonus = tickerETH.bidPrice * tickerEthBtc.bidPrice / tickerBTC.askPrice;
        if (bonus > process.env.MinProfit) {
            if (tickerBTC.askPrice * tickerBTC.askQty > process.env.MinBTC && tickerETH.bidQty * tickerETH.bidPrice > process.env.MinETH && tickerETH.bidPrice * tickerETH.bidQty * valBtcEth > process.env.MinBTC) {
                log("\t<btc->" + symbol + "->eth->btc>", "| " + symbol + " bonus = " + bonus);
                log.green("Found positive trade for symbol ", symbol);
                log.green("Quantity is enough for trade for symbol " + symbol);

                let price = tickerBTC.askPrice;

                var qty = Math.min(process.env.MaxBTC / price, tickerBTC.askQty, tickerETH.bidQty);
                qty = new BigNumber(qty).decimalPlaces(infos.get(symbol + "_btc").baseAssetPrecision).toNumber();
                qty = new BigNumber(qty).decimalPlaces(infos.get(symbol + "_eth").baseAssetPrecision).toNumber();

                log.green("Initiating order for symbol " + symbol);

                totalDailyWeight++;
                totalDailyOrderWeight++;

                totalMinuteWeight++;
                totalMinuteOrderWeight++;

                totalHourlyWeight++;
                totalHourlyOrderWeight++;

                let orderA = await tradeIO.newOrder(symbol + "_btc", "buy", "limit", qty, price);

                if (orderA.code === 0 && orderA.order.status == "Completed") {
                    log.green("First trade successful for arbitrage <btc->" + symbol + "->eth->btc> :", orderA);

                    let price = tickerETH.bidPrice;

                    qty = new BigNumber(orderA.order.baseAmount - orderA.order.commission).decimalPlaces(infos.get(symbol + "_eth").baseAssetPrecision).toNumber();

                    totalDailyWeight++;
                    totalDailyOrderWeight++;

                    totalMinuteWeight++;
                    totalMinuteOrderWeight++;

                    totalHourlyWeight++;
                    totalHourlyOrderWeight++;

                    let orderB = await tradeIO.newOrder(symbol + "_eth", "sell", "limit", qty, price);

                    if (orderB.code === 0 && orderB.order.status == "Completed") {
                        log.green("Second trade successful for arbitrage <btc->" + symbol + "->eth->btc> :", orderB);

                        price = tickerEthBtc.bidPrice;

                        qty = new BigNumber(orderB.order.total - orderB.order.commission).decimalPlaces(infos.get("eth_btc").baseAssetPrecision).toNumber();

                        totalDailyWeight++;
                        totalDailyOrderWeight++;

                        totalMinuteWeight++;
                        totalMinuteOrderWeight++;

                        totalHourlyWeight++;
                        totalHourlyOrderWeight++;

                        let orderC = await tradeIO.newOrder("eth_btc", "sell", "limit", qty, price);

                        if (orderC.code === 0 && orderC.order.status == "Completed") {
                            log.green("Third trade successful for arbitrage <btc->" + symbol + "->eth->btc> :", orderC);
                        } else {
                            log.error("Third trade has failed for arbitrage <btc->" + symbol + "->eth->btc> :", orderC);
                        }
                    } else {
                        log.error("Second trade has failed for arbitrage <btc->" + symbol + "->eth->btc> :", orderB);

                    }


                } else {
                    log.error("First trade has failed for arbitrage <btc->" + symbol + "->eth->btc> :", orderA);
                    if(orderA.order && orderA.order.status == "Working"){
                        totalDailyWeight++;
                        totalDailyOrderWeight++;

                        totalMinuteWeight++;
                        totalMinuteOrderWeight++;

                        totalHourlyWeight++;
                        totalHourlyOrderWeight++;
                        await tradeIO.cancelOrder(orderA.order.orderId).then(function (resp) {
                            if(resp.code === 0){ 
                                log.warn("First trade has been canceled for arbitrage <btc->" + symbol + "->eth->btc> :", resp);
                            } else {
                                log.warn("Error while cancelling first trade for arbitrage <btc->" + symbol + "->eth->btc> :", resp);
                            }
                        });
                    }
                }
            } else {
                //log("Not enough quantity for trade for symbol " + symbol)

            }

        }
    }

};

/////////////////////////////////////////////
/////// usdt->xxx->eth->usdt //////////
////////////////////////////////////////////
/////////////////////////////////////////////
/////// usdt->XXX->btc->usdt //////////
////////////////////////////////////////////
var manageArbitrageUSDT_X_Intermediate_USDT = async function (tickers, infos, symbol, intermediate) {
    //log("Checking arbitrage : <usdt->" + symbol + "->" + intermediate + "->usdt>")

    let tickerUSDT = tickers.get(symbol + "_usdt");
    let tickerIntermediate = tickers.get(symbol + "_" + intermediate);
    let tickerIntermediateUSDT = tickers.get(intermediate + "_usdt");


    if (tickerUSDT &&
        tickerIntermediate &&
        tickerUSDT.askPrice > 0 &&
        tickerIntermediate.bidPrice > 0) {
        //log("Tickers exists for " + symbol)

        let bonus = tickerIntermediateUSDT.bidPrice * tickerIntermediate.bidPrice / tickerUSDT.askPrice;

        if (bonus > process.env.MinProfit) {
            var minIntermediate;
            if (intermediate == "eth")
                minIntermediate = process.env.MinETH;
            else
                minIntermediate = process.env.MinBTC;

            var valIntermediate;
            if (intermediate == "eth")
                valIntermediate = valETH;
            else
                valIntermediate = valBTC;

            if (tickerUSDT.askPrice * tickerUSDT.askQty > process.env.MinUSDT && tickerIntermediate.bidQty * tickerIntermediate.bidPrice > minIntermediate && tickerIntermediate.bidPrice * tickerIntermediate.bidQty * valIntermediate > process.env.MinUSDT) {
                log("\t<usdt->" + symbol + "->" + intermediate + "->usdt>", "| " + symbol + " bonus = " + bonus);
                log.green("Found positive trade for symbol ", symbol);
                log.green("Quantity is enough for trade for symbol " + symbol);

                let price = tickerUSDT.askPrice;
                var qty = Math.min(process.env.MaxUSDT / price, tickerUSDT.askQty, tickerIntermediate.bidQty);
                qty = new BigNumber(qty).decimalPlaces(infos.get(symbol + "_usdt").baseAssetPrecision).toNumber();
                qty = new BigNumber(qty).decimalPlaces(infos.get(symbol + "_" + intermediate).baseAssetPrecision).toNumber();

                log("Initiating order for symbol " + symbol);

                totalDailyWeight++;
                totalDailyOrderWeight++;

                totalMinuteWeight++;
                totalMinuteOrderWeight++;

                totalHourlyWeight++;
                totalHourlyOrderWeight++;

                let orderA = await tradeIO.newOrder(symbol + "_usdt", "buy", "limit", qty, price);

                if (orderA.code === 0 && orderA.order.status == "Completed") {
                    log.green("First trade successful for arbitrage <usdt->" + symbol + "->" + intermediate + "->usdt> :", orderA);

                    let price = tickerIntermediate.bidPrice;
                    qty = new BigNumber(orderA.order.baseAmount - orderA.order.commission).decimalPlaces(infos.get(symbol + "_" + intermediate).baseAssetPrecision).toNumber();

                    totalDailyWeight++;
                    totalDailyOrderWeight++;

                    totalMinuteWeight++;
                    totalMinuteOrderWeight++;

                    totalHourlyWeight++;
                    totalHourlyOrderWeight++;

                    let orderB = await tradeIO.newOrder(symbol + "_" + intermediate, "sell", "limit", qty, price);

                    if (orderB.code === 0 && orderB.order.status == "Completed") {
                        log.green("Second trade successful for arbitrage <usdt->" + symbol + "->" + intermediate + "->usdt> :", orderB);
                        price = tickerIntermediateUSDT.bidPrice;
                        qty = new BigNumber(orderB.order.total - orderB.order.commission).decimalPlaces(infos.get(intermediate + "_usdt").baseAssetPrecision).toNumber();

                        totalDailyWeight++;
                        totalDailyOrderWeight++;

                        totalMinuteWeight++;
                        totalMinuteOrderWeight++;

                        totalHourlyWeight++;
                        totalHourlyOrderWeight++;

                        let orderC = await tradeIO.newOrder(intermediate + "_usdt", "sell", "limit", qty, price);

                        if (orderC.code === 0 && orderC.order.status == "Completed") {
                            log.green("Third trade successful for arbitrage <usdt->" + symbol + "->" + intermediate + "->usdt> :", orderC);
                        } else {
                            log.error("Third trade has failed for arbitrage <usdt->" + symbol + "->" + intermediate + "->usdt> :", orderC);
                        }
                    } else {
                        log.error("Second trade has failed for arbitrage <usdt->" + symbol + "->" + intermediate + "->usdt> :", orderB);
                    }
                } else {
                    log.error("First trade has failed for arbitrage <usdt->" + symbol + "->" + intermediate + "->usdt> :", orderA);
                    if(orderA.order && orderA.order.status == "Working"){
                        totalDailyWeight++;
                        totalDailyOrderWeight++;

                        totalMinuteWeight++;
                        totalMinuteOrderWeight++;

                        totalHourlyWeight++;
                        totalHourlyOrderWeight++;
                        await tradeIO.cancelOrder(orderA.order.orderId).then(function (resp) {
                            if(resp.code === 0){ 
                                log.warn("First trade has been canceled for arbitrage <usdt->" + symbol + "->" + intermediate + "-> usdt> :", resp);
                            } else {
                                log.warn("Error while cancelling first trade for arbitrage <usdt->" + symbol + "->" + intermediate + "->usdt> :", resp);
                            }
                        });
                    }
                }
            } else {
                //log("Not enough quantity for trade for symbol " + symbol)

            }

        }
    }

};


/////////////////////////////////////////////
///////// eth->XXX->usdt->eth /////////
////////////////////////////////////////////
/////////////////////////////////////////////
///////// eth->XXX->btc->eth //////////
////////////////////////////////////////////
/////////////////////////////////////////////
///////  btc->XXX->usdt->btc //////////
////////////////////////////////////////////
var manageArbitrageSource_X_Intermediate_Source = async function (tickers, infos, symbol, source, intermediate) {
    //log("Checking arbitrage : <" + source + "->" + symbol + "->" + intermediate + "->" + source + ">")

    let tickerSource = tickers.get(symbol + "_" + source);
    let tickerIntermediate = tickers.get(symbol + "_" + intermediate);
    let tickerSourceIntermediate = tickers.get(source + "_" + intermediate);

    if (tickerSource &&
        tickerIntermediate &&
        tickerSource.askPrice > 0 &&
        tickerIntermediate.bidPrice > 0) {
        //log("Tickers exists for " + symbol)

        let bonus = tickerIntermediate.bidPrice / tickerSource.askPrice / tickerSourceIntermediate.askPrice;

        if (bonus > process.env.MinProfit) {
            var minIntermediate;
            var maxIntermediate;
            if (intermediate == "eth") {
                minIntermediate = process.env.MinETH;
                maxIntermediate = process.env.MaxETH;
            } else if (intermediate == "btc") {
                minIntermediate = process.env.MinBTC;
                maxIntermediate = process.env.MaxBTC;
            } else {
                minIntermediate = process.env.MinUSDT;
                maxIntermediate = process.env.MaxUSDT;
            }

            var minSource;
            var maxSource;
            if (source == "eth") {
                minSource = process.env.MinETH;
                maxSource = process.env.MaxETH;
            } else if (source == "btc") {
                minSource = process.env.MinBTC;
                maxSource = process.env.MaxBTC;
            } else {
                minSource = process.env.MinUSDT;
                maxSource = process.env.MaxUSDT;
            }

            var valSourceIntermediate;
            if (source == "eth" && intermediate == "usdt")
                valSourceIntermediate = valETH;
            else if (source == "btc" && intermediate == "usdt")
                valSourceIntermediate = valBTC;
            else
                valSourceIntermediate = valBtcEth;


            if (tickerIntermediate.bidPrice * tickerIntermediate.bidQty > minIntermediate && tickerSource.askQty * tickerSource.askPrice > minSource && tickerSource.askPrice * tickerSource.askQty * valSourceIntermediate > minIntermediate) {
                log("\t<" + source + "->" + symbol + "->" + intermediate + "->" + source + ">", "| " + symbol + " bonus = " + bonus);
                log.green("Found positive trade for symbol ", symbol);
                log.green("Quantity is enough for trade for symbol " + symbol);
                let price = tickerSource.askPrice;

                var qty = Math.min(new BigNumber(maxSource / price).decimalPlaces(infos.get(symbol + "_" + source).baseAssetPrecision).toNumber(), tickerSource.askQty, tickerIntermediate.bidQty);
                qty = new BigNumber(qty).decimalPlaces(infos.get(symbol + "_" + intermediate).baseAssetPrecision).toNumber();

                log.green("Initiating order for symbol " + symbol);

                totalDailyWeight++;
                totalDailyOrderWeight++;

                totalMinuteWeight++;
                totalMinuteOrderWeight++;

                totalHourlyWeight++;
                totalHourlyOrderWeight++;

                let orderA = await tradeIO.newOrder(symbol + "_" + source, "buy", "limit", qty, price);

                if (orderA.code === 0 && orderA.order.status == "Completed") {
                    log.green("First trade successful for arbitrage <" + source + "->" + symbol + "->" + intermediate + "->" + source + "> :", orderA);

                    let price = tickerIntermediate.bidPrice;
                    qty = new BigNumber(orderA.order.baseAmount - orderA.order.commission).decimalPlaces(infos.get(symbol + "_" + intermediate).baseAssetPrecision).toNumber();

                    totalDailyWeight++;
                    totalDailyOrderWeight++;

                    totalMinuteWeight++;
                    totalMinuteOrderWeight++;

                    totalHourlyWeight++;
                    totalHourlyOrderWeight++;

                    let orderB = await tradeIO.newOrder(symbol + "_" + intermediate, "sell", "limit", qty, price);

                    if (orderB.code === 0 && orderB.order.status == "Completed") {
                        log.green("Second trade successful for arbitrage <" + source + "->" + symbol + "->" + intermediate + "->" + source + "> :", orderB);

                        price = tickerSourceIntermediate.askPrice;
                        qty = new BigNumber((orderB.order.total - orderB.order.commission) / price).decimalPlaces(infos.get(source + "_" + intermediate).baseAssetPrecision).toNumber();

                        totalDailyWeight++;
                        totalDailyOrderWeight++;

                        totalMinuteWeight++;
                        totalMinuteOrderWeight++;

                        totalHourlyWeight++;
                        totalHourlyOrderWeight++;

                        let orderC = await tradeIO.newOrder(source + "_" + intermediate, "buy", "limit", qty, price);

                        if (orderC.code === 0 && orderC.order.status == "Completed") {
                            log.green("Third trade successful for arbitrage <" + source + "->" + symbol + "->" + intermediate + "->" + source + "> :", orderC);
                        } else {
                            log.error("Third trade has failed for arbitrage <" + source + "->" + symbol + "->" + intermediate + "->" + source + "> :", orderC);
                        }

                    } else {
                        log.error("Second trade has failed for arbitrage <" + source + "->" + symbol + "->" + intermediate + "->" + source + "> :", orderB);
                    }
                } else {
                    log.error("First trade has failed for arbitrage <" + source + "->" + symbol + "->" + intermediate + "->" + source + "> :", orderA);
                    if(orderA.order && orderA.order.status == "Working"){
                        totalDailyWeight++;
                        totalDailyOrderWeight++;

                        totalMinuteWeight++;
                        totalMinuteOrderWeight++;

                        totalHourlyWeight++;
                        totalHourlyOrderWeight++;
                        await tradeIO.cancelOrder(orderA.order.orderId).then(function (resp) {
                            if(resp.code === 0){ 
                                log.warn("First trade has been canceled for arbitrage <" + source + "->" + symbol + "->" + intermediate + "->" + source + "> :", resp);
                            } else {
                                log.warn("Error while cancelling first trade for arbitrage <" + source + "->" + symbol + "->" + intermediate + "->" + source + "> :", resp);
                            }
                        });
                    }
                }
            } else {
                //log("Not enough quantity for trade for symbol " + symbol)
            }

        }
    } else {
        //log.warn("Ticker doesn't exist for symbol", symbol)
    }
};
exports.start = start;