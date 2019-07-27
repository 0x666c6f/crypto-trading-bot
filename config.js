const yaml = require('js-yaml');
const fs   = require('fs');
const logger = require('./logger');
logger.info("Loading config from file")
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
    logger.info("Loaded config :")
    logger.info(JSON.stringify(process.env, null, 2));
  } else {
      logger.error("Config file not found, exiting")
      pprocess.exit(-1);
  }
} catch (e) {
  console.log(e);
}