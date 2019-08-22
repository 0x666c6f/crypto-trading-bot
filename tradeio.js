const log = require('./logger').logger;

var http = require('./http-manager');

var about = function () {
    //log("TradeIO About Request")
    return new Promise((resolve, reject) => {
        http.get(process.env.APIEndpoint + "/api/v1/about", false, null).then(function (resp) {
            //log("About successful")
            resolve(resp);
        }, function (error) {
            //log.red("Error while doing About request = "+ JSON.stringify(error, null, 2))
            reject(error);
        }).catch(function (err) {
            //log.red("Error while doing About request = "+ JSON.stringify(err, null, 2))
            reject(err);
        });
    });
};

var time = function () {
    //log("TradeIO Time Request")
    return new Promise((resolve, reject) => {
        http.get(process.env.APIEndpoint + "/api/v1/time", false, null).then(function (resp) {
            //log("Time successfull")
            resolve(resp);
        }, function (error) {
            //log.red("Error while doing Time request = "+ JSON.stringify(error, null, 2))
            reject(error);
        }).catch(function (err) {
            //log.red("Error while doing Time request = "+ JSON.stringify(err, null, 2))
            reject(err);
        });
    });
};

var info = function () {
    //log("TradeIO Info Request")
    return new Promise((resolve, reject) => {
        http.get(process.env.APIEndpoint + "/api/v1/info", false, null).then(function (resp) {
            //log("Info successfull")
            resolve(resp);
        }, function (error) {
            //log.red("Error while doing Info request = "+ JSON.stringify(error, null, 2))
            reject(error);
        }).catch(function (err) {
            //log.red("Unkown Error while doing Info request = "+ JSON.stringify(err, null, 2))
            reject(err);
        });
    });
};

var orderBook = function (symbol, limit) {
    //log("TradeIO Order Book Request for symbol " + symbol)
    return new Promise((resolve, reject) => {
        http.get(process.env.APIEndpoint + "/api/v1/depth/" + symbol, false, "?limit=" + limit).then(function (resp) {
            //log("Order Book for symbol "+symbol+" successfull")
            resolve(resp);
        }, function (error) {
            //log.red("Error while doing Order book request = "+ JSON.stringify(error, null, 2))
            reject(error);
        }).catch(function (err) {
            //log.red("Error while doing Order book request = "+ JSON.stringify(err, null, 2))
            reject(err);
        });
    });
};

var recentTrades = function (symbol, limit) {
    //log("TradeIO Recent Trades Request for symbol " + symbol)
    return new Promise((resolve, reject) => {
        http.get(process.env.APIEndpoint + "/api/v1/trades/" + symbol, false, "?limit=" + limit).then(function (resp) {
            //log("Recent Trades for symbol "+symbol+" successfull")
            resolve(resp);
        }, function (error) {
            //log.red("Error while doing Recent trades request = "+ JSON.stringify(error, null, 2))
            reject(error);
        }).catch(function (err) {
            //log.red("Error while doing Recent trades request = "+ JSON.stringify(err, null, 2))
            reject(err);
        });
    });
};

var ticker = function (symbol) {
    //log("TradeIO Ticker Request for symbol " + symbol)
    return new Promise((resolve, reject) => {
        http.get(process.env.APIEndpoint + "/api/v1/ticker/" + symbol, false, null).then(function (resp) {
            //log("Ticker for symbol "+symbol+" successfull")
            resolve(resp);
        }, function (error) {
            //log.red("Error while doing Ticker request = "+ JSON.stringify(error, null, 2))
            reject(error);
        }).catch(function (err) {
            //log.red("Error while doing Ticker request = "+ JSON.stringify(err, null, 2))
            reject(err);
        });
    });
};

var tickers = function (symbol) {
    //log("TradeIO Tickers Request")
    return new Promise((resolve, reject) => {
        http.get(process.env.APIEndpoint + "/api/v1/tickers", false, null).then(function (resp) {
            // log("Tickers successfull")
            resolve(resp);
        }, function (error) {
            //log.red("Error while doing Tickers request = "+ JSON.stringify(error, null, 2))
            reject(error);
        }).catch(function (err) {
            //log.red("Error while doing Tickers request = "+ JSON.stringify(err, null, 2))
            reject(err);
        });
    });
};

var newOrder = function (symbol, side, type, quantity, price, stopPrice) {
    log("TradeIO New Order Request");
    return new Promise((resolve, reject) => {
        var ts = new Date().getTime();

        let order = {
            "Symbol": symbol,
            "Side": side,
            "Type": type,
            "Quantity": quantity,
            "ts": "" + ts,
        };

        if (price)
            order.Price = price;
        if (stopPrice)
            order.StopPrice = stopPrice;

        log("\t Order :", JSON.stringify(order, null, 2));

        http.post(process.env.APIEndpoint + "/api/v1/order", order).then(function (resp) {
            log("New Order request successfull");
            resolve(resp);
        }, function (error) {
            log.red("Error while doing New order request = " + JSON.stringify(error, null, 2));
            reject(error);
        }).catch(function (err) {
            log.red("Error while doing New order request = " + JSON.stringify(err, null, 2));
            reject(err);
        });
    });
};

var cancelOrder = function (orderId) {
    //log("TradeIO Cancel Order Request")
    return new Promise((resolve, reject) => {
        var ts = new Date().getTime();

        http.del(process.env.APIEndpoint + "/api/v1/order/" + orderId, "?ts=" + ts).then(function (resp) {
            //log("Cancel successful")
            resolve(resp);
        }, function (error) {
            //log.red("Error while doing Cancel order request = "+ JSON.stringify(error, null, 2))
            reject(error);
        }).catch(function (err) {
            //log.red("Error while doing Cancel order request = "+ JSON.stringify(err, null, 2))
            reject(err);
        });
    });
};

var cancelAllOrders = function () {
    //log("TradeIO Cancel All Orders Request")
    return new Promise((resolve, reject) => {
        var ts = new Date().getTime();

        http.del(process.env.APIEndpoint + "/api/v1/orders", "?ts=" + ts).then(function (resp) {
            //log("Cancel orders successfull")
            resolve(resp);
        }, function (error) {
            //log.red("Error while doing Cancel all orders request = "+ JSON.stringify(error, null, 2))
            reject(error);
        }).catch(function (err) {
            //log.red("Error while doing Cancel all orders request = "+ JSON.stringify(err, null, 2))
            reject(err);
        });
    });
};

exports.about = about;
exports.time = time;
exports.info = info;
exports.orderBook = orderBook;
exports.recentTrades = recentTrades;
exports.ticker = ticker;
exports.tickers = tickers;
exports.newOrder = newOrder;
exports.cancelOrder = cancelOrder;
exports.cancelAllOrders = cancelAllOrders;