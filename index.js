var logger = require('./logger');
var http = require('./http-manager');
var tradeio = require('./tradeio');

require('./config.js')


//http.get("https://api.exchange.trade.io/api/v1/about", false, null)
// var ts = new Date().getTime();
// http.get("https://api.exchange.trade.io/api/v1/account", true, "?ts="+ts)

// ts = new Date().getTime();
// let order = {
//     "Symbol": "eth_btc",
//     "Side": "sell",
//     "Type": "limit",
//     "Price": 11,
//     "Quantity": 0.01,
//     "ts": ""+ts
//   }

// http.post("https://api.exchange.trade.io/api/v1/order", order )
// ts = new Date().getTime();

// http.del("https://api.exchange.trade.io/api/v1/orders", "?ts="+ts )


// tradeio.about()
// tradeio.time()
// tradeio.info()
tradeio.newOrder("eth_btc","sell","limit",0.01,11,null).then(function(resp){
    let tradeId = resp.order.orderId;
    console.log(tradeId)
    tradeio.cancelOrder(tradeId).then(function(resp){
        console.log(resp)
    }, function(error){
        console.log(error)
    })
})
