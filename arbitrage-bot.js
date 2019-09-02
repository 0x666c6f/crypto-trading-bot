var tradeIO = require('./tradeio');
var tradingUtils = require('./trading-utils');
const log = require('./logger').logger;
var sleep = require('sleep');
const async = require('async');
const BigNumber = require('bignumber.js');
const moment = require("moment");

BigNumber.config({
    ROUNDING_MODE: 1
});

var totalMinuteWeight = 0;
var totalMinuteOrderWeight = 0;

var valBTC = null;
var valBtcEth = null;
var valETH = null;
var formattedTickers = null;

var start = async function (infos) {
    var endMinuteDate = new Date();
    endMinuteDate.setSeconds(process.env.EndSecond);
    endMinuteDate.setMilliseconds(0);

    var restartDate = new Date();
    restartDate.setMinutes(restartDate.getMinutes() + 1);
    restartDate.setSeconds(process.env.StartSecond);
    restartDate.setMilliseconds(0);

    log("Starting Arbitrage");

    while (totalMinuteWeight < (process.env.APIMinuteLimit - 23) && (totalMinuteOrderWeight < process.env.OrderMinuteLimit - 3) && Date.now() < endMinuteDate.getTime()) {
        await initArbitrage(infos);
        if (process.env.Timeout != 0)
            sleep.msleep(process.env.Timeout);

        if (process.env.Timeout != 0) {
            log("Arbitrages finished");
            log("Minute Weights :");
            log("Minute Weight :", totalMinuteWeight);
            log("Minute Order Weight :", totalMinuteOrderWeight);
        }
    }

    //update bot max balance data
    //Temp as long as we don't have enough liquidity
    log.green("Updating balances");
    let balances = await tradeIO.account();
    if (balances.size > 0) {
        process.env.MaxBTC = balances.get("btc");
        process.env.MaxUSDT = balances.get("usdt");
        process.env.MaxETH = balances.get("eth");
    }

    totalMinuteWeight = 0;
    totalMinuteOrderWeight = 0;
    if (Date.now() < restartDate.getTime()) {
        let ms = restartDate.getTime() - Date.now();
        log("Will sleep", ms, "to reset minute weight");
        sleep.msleep(ms);
        log("Waking up, sleep is over !");
    }

    start(infos);
};



var initArbitrage = async function (infos) {

    // log("====================")
    // log("Launching arbitrages")
    // log("====================")

    let tickers = await tradeIO.tickers();
    if (tickers.code != 0) {
        log.error("Error while retrieving tickers: ", tickers);
        let sleepTime = moment().add(2, "minute").seconds(process.env.StartSecond).milliseconds(0).diff(moment());
        log.error("Going to sleep for a while to reset limit :", sleepTime);
        sleep.msleep(sleepTime);
        log.error("Nap is over, getting back to work !");
        return;
    }
    totalMinuteWeight += 20;

    formattedTickers = tradingUtils.formatTickers(tickers.tickers);
    valBTC = formattedTickers.get('btc_usdt').askPrice;
    valBtcEth = formattedTickers.get('eth_btc').askPrice;
    valETH = formattedTickers.get('eth_usdt').askPrice;

    let symbols = formattedTickers.get("symbols");
    for (const ticker of symbols) {
        if (process.env.Debug == "true")
            log(">>> Checking arbitrages for symbol", "<" + ticker + ">");

        await async.parallel([
                async function (callback) {
                        await manageArbitrageUSDT_X_Intermediate_USDT(formattedTickers, infos, ticker, "btc");
                        callback(null, 1);
                    },
                    async function (callback) {
                        await manageArbitrageBTCtoXtoETHtoBTC(formattedTickers, infos, ticker);
                        callback(null, 1);
                    },
            ],
            async function (err, results) {
                await async.parallel([
                        async function (callback) {
                                await manageArbitrageSource_X_Intermediate_Source(formattedTickers, infos, ticker, "eth", "btc");
                                callback(null, 1);
                            },
                            async function (callback) {
                                await manageArbitrageSource_X_Intermediate_Source(formattedTickers, infos, ticker, "btc", "usdt");
                                callback(null, 1);
                            },
                    ],
                    async function (err, results) {
                        await async.parallel([
                                async function (callback) {
                                        await manageArbitrageSource_X_Intermediate_Source(formattedTickers, infos, ticker, "eth", "usdt");
                                        callback(null, 1);
                                    },
                                    async function (callback) {
                                        await manageArbitrageUSDT_X_Intermediate_USDT(formattedTickers, infos, ticker, "eth");
                                        callback(null, 1);
                                    }
                            ],
                            function (err, results) {

                            });
                    });
            });



    }
};


/////////////////////////////////////////////
///////// btc->XXX->eth->btc //////////
////////////////////////////////////////////
var manageArbitrageBTCtoXtoETHtoBTC = async function (tickers, infos, symbol) {
    if (process.env.Debug == "true")
        log("Checking arbitrage : <btc->" + symbol + "->eth->btc>");
    let tickerBTC = tickers.get(symbol + "_btc");
    let tickerETH = tickers.get(symbol + "_eth");
    let tickerEthBtc = tickers.get("eth_btc");

    if (tickerETH &&
        tickerBTC &&
        tickerBTC.askPrice > 0 &&
        tickerETH.bidPrice > 0) {
        if (process.env.Debug == "true")
            log("Tickers exists for " + symbol);
        let bonus = tickerETH.bidPrice * tickerEthBtc.bidPrice / tickerBTC.askPrice;

        if (bonus > process.env.MinProfit) {
            if (tickerBTC.askPrice * tickerBTC.askQty > process.env.MinBTC && tickerETH.bidQty * tickerETH.bidPrice > process.env.MinETH && tickerETH.bidPrice * tickerETH.bidQty * valBtcEth > process.env.MinBTC) {
                if (process.env.Debug == "true") {
                    log("\t<btc->" + symbol + "->eth->btc>", "| " + symbol + " bonus = " + bonus);
                    log.green("Found positive trade for symbol ", symbol);
                    log.green("Quantity is enough for trade for symbol " + symbol);
                }


                let price = tickerBTC.askPrice;

                var qty = Math.min(process.env.MaxBTC / price, tickerBTC.askQty, tickerETH.bidQty);
                qty = new BigNumber(qty).decimalPlaces(infos.get(symbol + "_btc").baseAssetPrecision).toNumber();
                qty = new BigNumber(qty).decimalPlaces(infos.get(symbol + "_eth").baseAssetPrecision).toNumber();

                if (process.env.Debug == "true")
                    log.green("Initiating order for symbol " + symbol);




                totalMinuteWeight++;
                totalMinuteOrderWeight++;




                let orderA = await tradeIO.newOrder(symbol + "_btc", "buy", "limit", qty, price);

                if (orderA.code === 0 && orderA.order.status == "Completed") {
                    if (process.env.Debug == "true")
                        log.green("First trade successful for arbitrage <btc->" + symbol + "->eth->btc> :", orderA);

                    let price = tickerETH.bidPrice;

                    qty = new BigNumber(orderA.order.baseAmount - orderA.order.commission).decimalPlaces(infos.get(symbol + "_eth").baseAssetPrecision).toNumber();

                    totalMinuteWeight++;
                    totalMinuteOrderWeight++;

                    let orderB = await tradeIO.newOrder(symbol + "_eth", "sell", "limit", qty, price);

                    if (orderB.code === 0 && orderB.order.status == "Completed") {
                        if (process.env.Debug == "true")
                            log.green("Second trade successful for arbitrage <btc->" + symbol + "->eth->btc> :", orderB);

                        price = tickerEthBtc.bidPrice;

                        qty = new BigNumber(orderB.order.total - orderB.order.commission).decimalPlaces(infos.get("eth_btc").baseAssetPrecision).toNumber();




                        totalMinuteWeight++;
                        totalMinuteOrderWeight++;




                        let orderC = await tradeIO.newOrder("eth_btc", "sell", "limit", qty, price);

                        if (orderC.code === 0 && orderC.order.status == "Completed") {
                            if (process.env.Debug == "true")
                                log.green("Third trade successful for arbitrage <btc->" + symbol + "->eth->btc> :", orderC);
                        } else {
                            if (process.env.Debug == "true")
                                log.error("Third trade has failed for arbitrage <btc->" + symbol + "->eth->btc> :", orderC);
                        }
                    } else {
                        if (process.env.Debug == "true")
                            log.error("Second trade has failed for arbitrage <btc->" + symbol + "->eth->btc> :", orderB);

                    }


                } else {
                    if (process.env.Debug == "true")
                        log.error("First trade has failed for arbitrage <btc->" + symbol + "->eth->btc> :", orderA);
                    if (orderA.order && orderA.order.status == "Working" && orderA.order.unitsFilled <= 0) {



                        totalMinuteWeight++;
                        totalMinuteOrderWeight++;



                        await tradeIO.cancelOrder(orderA.order.orderId).then(function (resp) {
                            if (resp.code === 0) {
                                if (process.env.Debug == "true")
                                    log.warn("First trade has been canceled for arbitrage <btc->" + symbol + "->eth->btc> :", resp);
                            } else {
                                if (process.env.Debug == "true")
                                    log.warn("Error while cancelling first trade for arbitrage <btc->" + symbol + "->eth->btc> :", resp);
                            }
                        });
                    }
                }
            } else {
                if (process.env.Debug == "true")
                    log("Not enough quantity for trade for symbol " + symbol)

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
    if (process.env.Debug == "true")
        log("Checking arbitrage : <usdt->" + symbol + "->" + intermediate + "->usdt>");

    let tickerUSDT = tickers.get(symbol + "_usdt");
    let tickerIntermediate = tickers.get(symbol + "_" + intermediate);
    let tickerIntermediateUSDT = tickers.get(intermediate + "_usdt");


    if (tickerUSDT &&
        tickerIntermediate &&
        tickerUSDT.askPrice > 0 &&
        tickerIntermediate.bidPrice > 0) {

        if (process.env.Debug == "true")
            log("Tickers exists for " + symbol);

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
                if (process.env.Debug == "true") {
                    log("\t<usdt->" + symbol + "->" + intermediate + "->usdt>", "| " + symbol + " bonus = " + bonus);
                    log.green("Found positive trade for symbol ", symbol);
                    log.green("Quantity is enough for trade for symbol " + symbol);
                }

                let price = tickerUSDT.askPrice;
                var qty = Math.min(process.env.MaxUSDT / price, tickerUSDT.askQty, tickerIntermediate.bidQty);
                qty = new BigNumber(qty).decimalPlaces(infos.get(symbol + "_usdt").baseAssetPrecision).toNumber();
                qty = new BigNumber(qty).decimalPlaces(infos.get(symbol + "_" + intermediate).baseAssetPrecision).toNumber();

                if (process.env.Debug == "true")
                    log("Initiating order for symbol " + symbol);




                totalMinuteWeight++;
                totalMinuteOrderWeight++;




                let orderA = await tradeIO.newOrder(symbol + "_usdt", "buy", "limit", qty, price);

                if (orderA.code === 0 && orderA.order.status == "Completed") {
                    if (process.env.Debug == "true")
                        log.green("First trade successful for arbitrage <usdt->" + symbol + "->" + intermediate + "->usdt> :", orderA);

                    let price = tickerIntermediate.bidPrice;
                    qty = new BigNumber(orderA.order.baseAmount - orderA.order.commission).decimalPlaces(infos.get(symbol + "_" + intermediate).baseAssetPrecision).toNumber();




                    totalMinuteWeight++;
                    totalMinuteOrderWeight++;




                    let orderB = await tradeIO.newOrder(symbol + "_" + intermediate, "sell", "limit", qty, price);

                    if (orderB.code === 0 && orderB.order.status == "Completed") {
                        if (process.env.Debug == "true")
                            log.green("Second trade successful for arbitrage <usdt->" + symbol + "->" + intermediate + "->usdt> :", orderB);
                        price = tickerIntermediateUSDT.bidPrice;
                        qty = new BigNumber(orderB.order.total - orderB.order.commission).decimalPlaces(infos.get(intermediate + "_usdt").baseAssetPrecision).toNumber();




                        totalMinuteWeight++;
                        totalMinuteOrderWeight++;




                        let orderC = await tradeIO.newOrder(intermediate + "_usdt", "sell", "limit", qty, price);

                        if (orderC.code === 0 && orderC.order.status == "Completed") {
                            if (process.env.Debug == "true")
                                log.green("Third trade successful for arbitrage <usdt->" + symbol + "->" + intermediate + "->usdt> :", orderC);
                        } else {
                            if (process.env.Debug == "true")
                                log.error("Third trade has failed for arbitrage <usdt->" + symbol + "->" + intermediate + "->usdt> :", orderC);
                        }
                    } else {
                        if (process.env.Debug == "true")
                            log.error("Second trade has failed for arbitrage <usdt->" + symbol + "->" + intermediate + "->usdt> :", orderB);
                    }
                } else {
                    if (process.env.Debug == "true")
                        log.error("First trade has failed for arbitrage <usdt->" + symbol + "->" + intermediate + "->usdt> :", orderA);
                    if (orderA.order && orderA.order.status == "Working" && orderA.order.unitsFilled <= 0) {



                        totalMinuteWeight++;
                        totalMinuteOrderWeight++;



                        await tradeIO.cancelOrder(orderA.order.orderId).then(function (resp) {
                            if (resp.code === 0) {
                                if (process.env.Debug == "true")
                                    log.warn("First trade has been canceled for arbitrage <usdt->" + symbol + "->" + intermediate + "-> usdt> :", resp);
                            } else {
                                if (process.env.Debug == "true")
                                    log.warn("Error while cancelling first trade for arbitrage <usdt->" + symbol + "->" + intermediate + "->usdt> :", resp);
                            }
                        });
                    }
                }
            } else {
                if (process.env.Debug == "true")
                    log("Not enough quantity for trade for symbol " + symbol);

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
    if (process.env.Debug == "true")
        log("Checking arbitrage : <" + source + "->" + symbol + "->" + intermediate + "->" + source + ">");

    let tickerSource = tickers.get(symbol + "_" + source);
    let tickerIntermediate = tickers.get(symbol + "_" + intermediate);
    let tickerSourceIntermediate = tickers.get(source + "_" + intermediate);

    if (tickerSource &&
        tickerIntermediate &&
        tickerSource.askPrice > 0 &&
        tickerIntermediate.bidPrice > 0) {

        if (process.env.Debug == "true")
            log("Tickers exists for " + symbol);

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
                if (process.env.Debug == "true") {
                    log("\t<" + source + "->" + symbol + "->" + intermediate + "->" + source + ">", "| " + symbol + " bonus = " + bonus);
                    log.green("Found positive trade for symbol ", symbol);
                    log.green("Quantity is enough for trade for symbol " + symbol);
                }
                let price = tickerSource.askPrice;

                var qty = Math.min(new BigNumber(maxSource / price).decimalPlaces(infos.get(symbol + "_" + source).baseAssetPrecision).toNumber(), tickerSource.askQty, tickerIntermediate.bidQty);
                qty = new BigNumber(qty).decimalPlaces(infos.get(symbol + "_" + intermediate).baseAssetPrecision).toNumber();

                if (process.env.Debug == "true")
                    log.green("Initiating order for symbol " + symbol);




                totalMinuteWeight++;
                totalMinuteOrderWeight++;




                let orderA = await tradeIO.newOrder(symbol + "_" + source, "buy", "limit", qty, price);

                if (orderA.code === 0 && orderA.order.status == "Completed") {

                    if (process.env.Debug == "true")
                        log.green("First trade successful for arbitrage <" + source + "->" + symbol + "->" + intermediate + "->" + source + "> :", orderA);

                    let price = tickerIntermediate.bidPrice;
                    qty = new BigNumber(orderA.order.baseAmount - orderA.order.commission).decimalPlaces(infos.get(symbol + "_" + intermediate).baseAssetPrecision).toNumber();




                    totalMinuteWeight++;
                    totalMinuteOrderWeight++;




                    let orderB = await tradeIO.newOrder(symbol + "_" + intermediate, "sell", "limit", qty, price);

                    if (orderB.code === 0 && orderB.order.status == "Completed") {
                        if (process.env.Debug == "true")
                            log.green("Second trade successful for arbitrage <" + source + "->" + symbol + "->" + intermediate + "->" + source + "> :", orderB);

                        price = tickerSourceIntermediate.askPrice;
                        qty = new BigNumber((orderB.order.total - orderB.order.commission) / price).decimalPlaces(infos.get(source + "_" + intermediate).baseAssetPrecision).toNumber();




                        totalMinuteWeight++;
                        totalMinuteOrderWeight++;




                        let orderC = await tradeIO.newOrder(source + "_" + intermediate, "buy", "limit", qty, price);

                        if (orderC.code === 0 && orderC.order.status == "Completed") {
                            if (process.env.Debug == "true")
                                log.green("Third trade successful for arbitrage <" + source + "->" + symbol + "->" + intermediate + "->" + source + "> :", orderC);
                        } else {
                            if (process.env.Debug == "true")
                                log.error("Third trade has failed for arbitrage <" + source + "->" + symbol + "->" + intermediate + "->" + source + "> :", orderC);
                        }

                    } else {
                        if (process.env.Debug == "true")
                            log.error("Second trade has failed for arbitrage <" + source + "->" + symbol + "->" + intermediate + "->" + source + "> :", orderB);
                    }
                } else {
                    if (process.env.Debug == "true")
                        log.error("First trade has failed for arbitrage <" + source + "->" + symbol + "->" + intermediate + "->" + source + "> :", orderA);
                    if (orderA.order && orderA.order.status == "Working" && orderA.order.unitsFilled <= 0) {



                        totalMinuteWeight++;
                        totalMinuteOrderWeight++;



                        await tradeIO.cancelOrder(orderA.order.orderId).then(function (resp) {
                            if (resp.code === 0) {
                                if (process.env.Debug == "true")
                                    log.warn("First trade has been canceled for arbitrage <" + source + "->" + symbol + "->" + intermediate + "->" + source + "> :", resp);
                            } else {
                                if (process.env.Debug == "true")
                                    log.warn("Error while cancelling first trade for arbitrage <" + source + "->" + symbol + "->" + intermediate + "->" + source + "> :", resp);
                            }
                        });
                    }
                }
            } else {
                if (process.env.Debug == "true")
                    log("Not enough quantity for trade for symbol " + symbol);
            }

        }
    } else {
        if (process.env.Debug == "true")
            log.warn("Ticker doesn't exist for symbol", symbol);
    }
};
exports.start = start;