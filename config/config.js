const yaml = require('js-yaml');
const fs = require('fs');
var log = require("../logger/logger").logger;

const ansi = require('ansicolor').nice;
log("Loading config from file");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

try {
  var doc = yaml.safeLoad(fs.readFileSync(__dirname + '/config.yaml', 'utf8'));
  if (doc) {
    if (process.env.APIKey == undefined)
      process.env.APIKey = doc.config.APIKey;
    if (process.env.APISecret == undefined)
      process.env.APISecret = doc.config.APISecret;
    if (process.env.APIEndpoint == undefined)
      process.env.APIEndpoint = doc.config.APIEndpoint;
    if (process.env.MinBTC == undefined)
      process.env.MinBTC = doc.config.MinBTC;
    if (process.env.MaxBTC == undefined)
      process.env.MaxBTC = doc.config.MaxBTC;
    if (process.env.MinETH == undefined)
      process.env.MinETH = doc.config.MinETH;
    if (process.env.MaxETH == undefined)
      process.env.MaxETH = doc.config.MaxETH;
    if (process.env.MinUSDT == undefined)
      process.env.MinUSDT = doc.config.MinUSDT;
    if (process.env.MaxUSDT == undefined)
      process.env.MaxUSDT = doc.config.MaxUSDT;
    if (process.env.MinProfit == undefined)
      process.env.MinProfit = doc.config.MinProfit;
    if (process.env.Timeout == undefined)
      process.env.Timeout = doc.config.Timeout;
    if (process.env.Fees == undefined)
      process.env.Fees = doc.config.Fees;
    if (process.env.Exclusions == undefined)
      process.env.Exclusions = doc.config.Exclusions.toString().split(',');
    if (process.env.OrderMinuteLimit == undefined)
      process.env.OrderMinuteLimit = doc.config.OrderMinuteLimit;
    if (process.env.OrderHourlyLimit == undefined)
      process.env.OrderHourlyLimit = doc.config.OrderHourlyLimit;
    if (process.env.OrderDailyLimit == undefined)
      process.env.OrderDailyLimit = doc.config.OrderDailyLimit;
    if (process.env.APIMinuteLimit == undefined)
      process.env.APIMinuteLimit = doc.config.APIMinuteLimit;
    if (process.env.APIHourlyLimit == undefined)
      process.env.APIHourlyLimit = doc.config.APIHourlyLimit;
    if (process.env.APIDailyLimit == undefined)
      process.env.APIDailyLimit = doc.config.APIDailyLimit;
    if (process.env.Debug == undefined)
      process.env.Debug = doc.config.Debug;
    if (process.env.StartSecond == undefined)
      process.env.StartSecond = doc.config.StartSecond;
    if (process.env.EndSecond == undefined)
      process.env.EndSecond = doc.config.EndSecond;

    log("Loaded config :");
    log(process.env);
  } else {
    log.red("Config file not found, exiting");
    process.exit(-1);
  }
} catch (e) {
  log(e);
}