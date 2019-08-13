const yaml = require('js-yaml');
const fs   = require('fs');
const log = require('ololog').configure({
  time: true
})
const ansi = require('ansicolor').nice
log("Loading config from file")

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

try {
  var doc = yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'));
  if(doc){
    process.env.APIKey = doc.config.APIKey;
    process.env.APISecret = doc.config.APISecret;
    process.env.APIEndpoint = doc.config.APIEndpoint;
    process.env.MinBTC = doc.config.MinBTC;
    process.env.MaxBTC = doc.config.MaxBTC;
    process.env.MinETH = doc.config.MinETH;
    process.env.MaxETH = doc.config.MaxETH;
    process.env.MinUSDT = doc.config.MinUSDT;
    process.env.MaxUSDT = doc.config.MaxUSDT;
    process.env.MinProfit = doc.config.MinProfit;
    process.env.Timezone = doc.config.Timezone;
    process.env.Simulation = doc.config.Simulation;
    process.env.Fees = doc.config.Fees;
    process.env.LogLevel = doc.config.LogLevel;
    process.env.Exclusions = doc.config.Exclusions.toString().split(',')
    process.env.OrderMinuteLimit = doc.config.OrderMinuteLimit
    process.env.OrderHourlyLimit = doc.config.OrderHourlyLimit
    process.env.OrderDailyLimit = doc.config.OrderDailyLimit
    process.env.APIMinuteLimit = doc.config.APIMinuteLimit
    process.env.APIHourlyLimit = doc.config.APIHourlyLimit
    process.env.APIDailyLimit = doc.config.APIDailyLimit
    log("Loaded config :")
    log(process.env);
  } else {
      log.red("Config file not found, exiting")
      process.exit(-1);
  }
} catch (e) {
  log(e);
}