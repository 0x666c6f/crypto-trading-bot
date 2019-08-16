# Trade IO Crypto Arbitrage Trading Bot

# Set up
To set up the AWS instance, you need to install several libraries. For that you can use the included setup script ```setup.sh```

```sh
$ cd <bot folder>
$ chmod +x setup.sh
$ ./setup.sh
```

# Configuration
The bot can be configured in many ways. You have access to a large range of settings.
First you need to set your API Key and Secret.
To change the configuration, you can modifiy the ```config.yaml``` file.

Example of config :
```yaml
config:
  APIKey: 8bbcf739-e5f9-46df-8a07-884aeaa9e7d1
  APISecret: 100ad32f-5e7b-4a37-8c7f-e1199d1943db
  APIEndpoint: https://api.exchange.trade.io
  MinBTC: 0.001
  MaxBTC: 0.00103678
  MinETH: 0.01
  MaxETH: 0.10320818
  MinUSDT: 10
  MaxUSDT: 13.48573316
  MinProfit: 1.003
  OrderMinuteLimit: 600
  OrderHourlyLimit : 3600
  OrderDailyLimit : 86000
  APIMinuteLimit: 1200
  APIHourlyLimit : 60000
  APIDailyLimit : 1400000
  Timeout: 1000
  Simulation: true
  Fees: 1.001
  LogLevel: INFO
  Exclusions:
    - ktos
    - btnt
    - ttv
    - dog
    - kick
    - xfrc
    - usdt
    - xrr
    - ttv
    - lamb
    - lto
    - edr
    - pco
    - hot
    - mco
    - ode
    - nexo
    - mana
    - xsg
    - tusd
    - sidt
    - aoa
    - solve
    - wpp
    - loom
```

# How to use
```sh
$ npm install
$ npm start
```


