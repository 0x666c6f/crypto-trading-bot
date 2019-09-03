var log = require("../logger/logger").logger;
var http = require('../lib/http-manager');

require('../config/config.js');

var tickers = function (symbol) {
    log("TradeIO Tickers Request")
    return new Promise((resolve, reject) => {
        http.get(process.env.APIEndpoint + "/api/v1/tickers", false, null).then(function (resp) {
            log("Tickers successfull")
            resolve(resp);
        }, function (error) {
            log.red("Error while doing Tickers request = "+ JSON.stringify(error, null, 2))
            reject(error);
        }).catch(function (err) {
            log.red("Error while doing Tickers request = "+ JSON.stringify(err, null, 2))
            reject(err);
        });
    });
};

var start = new Date().getTime();
tickers().then( () => {
    log("Duration = ", new Date().getTime() - start);
});

