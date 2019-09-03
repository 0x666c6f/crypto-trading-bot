var log = require("../logger/logger").logger;
var http = require('../lib/http-manager');

require('../config/config.js');

const requestNb = process.argv[2];

var tickers = async function (symbol) {
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

var processAverageDuration = async function (){
    let total = 0;
    for (let index = 0; index < requestNb; index ++)
    {
        var start = new Date().getTime();
        await tickers();
        total += new Date().getTime() - start;
        log("Duration = ", new Date().getTime() - start);
        
    }
    log.green("Average request time = ", total/requestNb, "ms");

}

processAverageDuration();



