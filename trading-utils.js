var formatTickers = function(tickers) {
    let formattedTickers = new Map();
    let ethPairs = new Array();
    let btcPairs = new Array();
    let usdtPairs = new Array()
    let symbols = new Array()
    tickers.forEach(ticker => {
        formattedTickers.set(ticker.symbol, ticker);
        if(ticker.symbol.indexOf("_eth") != -1){
            ethPairs.push(ticker)
        }
        if(ticker.symbol.indexOf("_btc") != -1){
            btcPairs.push(ticker)
        }
        if(ticker.symbol.indexOf("_usdt") != -1){
            usdtPairs.push(ticker)
        }

        let symbol = ticker.symbol.split("_")[0]
        if(symbols.indexOf(symbol) == -1){
            symbols.push(symbol)
        }
    });

    formattedTickers.set("eth_pairs", ethPairs);
    formattedTickers.set("btc_pairs",btcPairs);
    formattedTickers.set("usdt_parirs", usdtPairs)
    formattedTickers.set("symbols", symbols)

    return formattedTickers;
}

var formatInfos = function (infos) {
    let formattedInfos = new Map();
    infos.forEach(info => {
        formattedInfos.set(info.symbol, info);
    });
    return formattedInfos;
}

var generateSignature = function(args){
    return crypto.createHmac('sha512', process.env.APISecret).update(args).digest('hex');
}


exports.formatTickers = formatTickers;
exports.formatInfos = formatInfos;
exports.generateSignature = generateSignature;
