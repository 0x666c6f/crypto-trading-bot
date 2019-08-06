var logger = require('./logger');
var http = require('./http-manager');

var about = function() {
    logger.info("TradeIO About Request")
    return new Promise((resolve, reject) => {
        http.get(process.env.APIEndpoint+"/api/v1/about", false, null).then(function(resp) {
            logger.info("About successful")
            resolve(resp)
        }, function(error){
            logger.error("Error while doing About request = "+ JSON.stringify(error, null, 2))
            reject(error)
        }).catch(function(err){
            logger.error("Error while doing About request = "+ JSON.stringify(err, null, 2))
            reject(err)
        })
    });
}

var time = function() {
    logger.info("TradeIO Time Request")
    return new Promise((resolve, reject) => {
        http.get(process.env.APIEndpoint+"/api/v1/time", false, null).then(function(resp) {
            logger.info("Time successfull")
            resolve(resp)
        }, function(error){
            logger.error("Error while doing Time request = "+ JSON.stringify(error, null, 2))
            reject(error)
        }).catch(function(err){
            logger.error("Error while doing Time request = "+ JSON.stringify(err, null, 2))
            reject(err)
        })
    });
}

var info = function() {
    logger.info("TradeIO Info Request")
    return new Promise((resolve, reject) => {
        http.get(process.env.APIEndpoint+"/api/v1/info", false, null).then(function(resp) {
            logger.info("Info successfull")
            resolve(resp)
        }, function(error){
            logger.error("Error while doing Info request = "+ JSON.stringify(error, null, 2))
            reject(error)
        }).catch(function(err){
            logger.error("Error while doing Info request = "+ JSON.stringify(err, null, 2))
            reject(err)
        })
    });
}

var orderBook = function(symbol, limit) {
    logger.info("TradeIO Order Book Request for symbol " + symbol)
    return new Promise((resolve, reject) => {
        http.get(process.env.APIEndpoint+"/api/v1/depth/"+symbol, false, "?limit="+limit).then(function(resp) {
            logger.info("Order Book for symbol "+symbol+" successfull")
            resolve(resp)
        }, function(error){
            logger.error("Error while doing Order book request = "+ JSON.stringify(error, null, 2))
            reject(error)
        }).catch(function(err){
            logger.error("Error while doing Order book request = "+ JSON.stringify(err, null, 2))
            reject(err)
        })
    });
}

var recentTrades = function(symbol, limit) {
    logger.info("TradeIO Recent Trades Request for symbol " + symbol)
    return new Promise((resolve, reject) => {
        http.get(process.env.APIEndpoint+"/api/v1/trades/"+symbol, false, "?limit="+limit).then(function(resp) {
            logger.info("Recent Trades for symbol "+symbol+" successfull")
            resolve(resp)
        }, function(error){
            logger.error("Error while doing Recent trades request = "+ JSON.stringify(error, null, 2))
            reject(error)
        }).catch(function(err){
            logger.error("Error while doing Recent trades request = "+ JSON.stringify(err, null, 2))
            reject(err)
        })
    });
}

var ticker = function(symbol) {
    logger.info("TradeIO Ticker Request for symbol " + symbol)
    return new Promise((resolve, reject) => {
        http.get(process.env.APIEndpoint+"/api/v1/ticker/"+symbol, false, null).then(function(resp) {
            logger.info("Ticker for symbol "+symbol+" successfull")
            resolve(resp)
        }, function(error){
            logger.error("Error while doing Ticker request = "+ JSON.stringify(error, null, 2))
            reject(error)
        }).catch(function(err){
            logger.error("Error while doing Ticker request = "+ JSON.stringify(err, null, 2))
            reject(err)
        })
    });
}

var tickers = function(symbol) {
    logger.info("TradeIO Tickers Request")
    return new Promise((resolve, reject) => {
        http.get(process.env.APIEndpoint+"/api/v1/tickers", false, null).then(function(resp) {
            logger.info("Tickers successfull")
            resolve(resp)
        }, function(error){
            logger.error("Error while doing Tickers request = "+ JSON.stringify(error, null, 2))
            reject(error)
        }).catch(function(err){
            logger.error("Error while doing Tickers request = "+ JSON.stringify(err, null, 2))
            reject(err)
        })
    });
}

var newOrder = function(symbol, side, type, quantity, price, stopPrice) {
    logger.info("TradeIO New Order Request")
    return new Promise((resolve, reject) => {
        var ts = new Date().getTime();

        let order = {
            "Symbol": symbol,
            "Side": side,
            "Type": type,
            "Quantity": quantity,
            "ts": ""+ts
        }

        if(price)
            order.Price = price
        if (stopPrice)
            order.StopPrice = stopPrice

        http.post(process.env.APIEndpoint+"/api/v1/order", order).then(function(resp) {
            logger.info("New Order successfull")
            resolve(resp)
        }, function(error){
            logger.error("Error while doing New order request = "+ JSON.stringify(error, null, 2))
            reject(error)
        }).catch(function(err){
            logger.error("Error while doing New order request = "+ JSON.stringify(err, null, 2))
            reject(err)
        })
    });
}

var cancelOrder = function(orderId) {
    logger.info("TradeIO Cancel Order Request")
    return new Promise((resolve, reject) => {
        var ts = new Date().getTime();

        http.del(process.env.APIEndpoint+"/api/v1/order/"+orderId, "?ts="+ts).then(function(resp) {
            logger.info("Cancel successful")
            resolve(resp)
        }, function(error){
            logger.error("Error while doing Cancel order request = "+ JSON.stringify(error, null, 2))
            reject(error)
        }).catch(function(err){
            logger.error("Error while doing Cancel order request = "+ JSON.stringify(err, null, 2))
            reject(err)
        })
    });
}

var cancelAllOrders = function() {
    logger.info("TradeIO Cancel All Orders Request")
    return new Promise((resolve, reject) => {
        var ts = new Date().getTime();

        http.del(process.env.APIEndpoint+"/api/v1/orders", "?ts="+ts).then(function(resp) {
            logger.info("Cancel orders successfull")
            resolve(resp)
        }, function(error){
            logger.error("Error while doing Cancel all orders request = "+ JSON.stringify(error, null, 2))
            reject(error)
        }).catch(function(err){
            logger.error("Error while doing Cancel all orders request = "+ JSON.stringify(err, null, 2))
            reject(err)
        })
    });
}

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
