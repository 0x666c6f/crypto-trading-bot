var crypto = require("crypto");

var formatTickers = function (tickers) {
    let formattedTickers = new Map();
    let symbols = [];
    const tickersLength = tickers.length;
    for (let index = 0; index < tickersLength; index ++)
    {
        ticker = tickers[index];
        let symbol = ticker.symbol.split("_")[0];
        if (process.env.Exclusions.indexOf(symbol) == -1) {
            formattedTickers.set(ticker.symbol, ticker);
            if (symbols.indexOf(symbol) == -1) {
                symbols.push(symbol);
            }
        }
    }

    formattedTickers.set("symbols", symbols);

    return formattedTickers;
};

var formatInfos = function (infos) {
    let formattedInfos = new Map();
    const infosLength = infos.length;
    for (let index = 0; index < infosLength; index ++)
    {
        info = infos[index];
        formattedInfos.set(info.symbol, info);
    }

    return formattedInfos;
};

var generateSignature = function (args) {
    return crypto.createHmac('sha512', process.env.APISecret).update(args).digest('hex');
};

var getMin = function (arr) {
    let min = parseFloat(arr[0].y);
  
    const len = arr.length;
    for (let i = 1; i < len; i++) {
      let v = parseFloat(arr[i].y);
      min = (v < min) ? v : min;
    }
  
    return min;
  };

exports.formatTickers = formatTickers;
exports.formatInfos = formatInfos;
exports.generateSignature = generateSignature;
exports.getMin = getMin;