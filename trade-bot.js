
var tradeio = require('./tradeio')
var trading_utils = require('./trading-utils')
var logger = require('./logger');


var launchArbitrage = function (symbol) {
    tradeio.info().then(function (infos) {
        tradeio.tickers().then(function (tickers) {
            let formattedTickers = trading_utils.formatTickers(tickers.tickers)
            let val_btc = formattedTickers.get('btc_usdt').askPrice;
            let val_btc_eth = formattedTickers.get('eth_btc').askPrice;
            let val_eth = formattedTickers.get('eth_usdt').askPrice;

            let symbols = formattedTickers.get("symbols")
            symbols.forEach(ticker => {
                 manageArbitrage(formattedTickers , ticker, "btc", "usdt")

            });
        })
    })
}

var manageArbitrage = function(tickers, symbol, pair1, pair2){
    logger.info("Managing arbitrage for symbol "+symbol+" , to pairs _"+pair1+" & "+pair2)
    if((!tickers.get(symbol+"_"+pair1) || !tickers.get(symbol+"_"+pair2)) && process.env.Exclusions.indexOf(symbol) == -1)
    {
        console.log("will manage "+symbol)
    }
//     if (strpos($key, 'usdt') !== false) { //only check usdt pairs
//         $output = ""; //reset output string
//         $tick = substr($key, 0, -5);
//         $tickusdt = $tick . "_usdt"; //get trading pair name xxxusdt
//         $tickbtc = $tick . "_btc"; // get trading pair name xxxbtc
//         //trade usdt to XXX to btc to usdt
//         if (array_key_exists($tickusdt, $ticker_list) && array_key_exists($tickbtc, $ticker_list) && $tick != "btnt" && $tick != "ktos" && $tick != "btc" && $tick != "coy" && $ticker_list[$tickusdt]['askPrice'] > 0 && $ticker_list[$tickbtc]['bidPrice'] > 0) { //check if trading pair exist (both in btc and usdt and that it s not btc, before donig some math on it
//                 $perc = round($ticker_list['btc_usdt']['bidPrice'] * $ticker_list[$tickbtc]['bidPrice'] / $ticker_list[$tickusdt]['askPrice'], 5);
//                 //if ($perc > 0 && $perc < 0.4)
//                 //      print("Missed the trade $tickbtc, because perc : $perc \n");
//                 if ($perc > $min_profit) {
//                         //////////////////////////////on a un trade positif, on y va !
//                         if ($ticker_list[$tickusdt]['askPrice'] * $ticker_list[$tickusdt]['askQty'] > $min_usdt && $ticker_list[$tickbtc]['bidQty'] * $ticker_list[$tickbtc]['bidPrice'] > $min_btc && $ticker_list[$tickbtc]['bidPrice'] * $ticker_list[$tickbtc]['bidQty'] * $val_btc > $min_usdt) {
//                                 //print("------------------------------------\n");
//                                 //print("$date : Initiate trade : $tickusdt ($perc) \n");
//                                 $price = $ticker_list[$tickusdt]['askPrice'];
//                                 $quantity = min($max_usdt / $price, $ticker_list[$tickusdt]['askQty'], $ticker_list[$tickbtc]['bidQty']);
//                                 $quantity = round($quantity, $pairs_infos[$tickusdt]['baseAssetPrecision'], PHP_ROUND_HALF_DOWN);
//                                 $quantity_ini = round(min($max_usdt / $price, $ticker_list[$tickusdt]['askQty'], $ticker_list[$tickbtc]['bidQty']), $pairs_infos[$tickbtc]['baseAssetPrecision'], PHP_ROUND_HALF_UP);
//                                 //$check_btc = json_decode(ticker($tickbtc));
//                                 // if ($check_btc->ticker->bidPrice == $ticker_list[$tickbtc]['bidPrice']){
//                                 $res1 = build_order($tickusdt, "buy", $price, $quantity);
//                                 $order1 = json_decode($res1);
//                                 if ($order1->order->status == "Completed") {
//                                         //print("Order 1 : $tickusdt - $quantity @ $price \n");
//                                         $price = $ticker_list[$tickbtc]['bidPrice'];
//                                         $quantity = $quantity_ini;
//                                         $quantity = round($quantity_ini / 1.001, $pairs_infos[$tickbtc]['baseAssetPrecision'], PHP_ROUND_HALF_DOWN);
//                                         $res2 = build_order($tickbtc, "sell", $price, $quantity);
//                                         $weight += 1;
//                                         $order2 = json_decode($res2);
//                                         //print("Order 2 : $tickbtc - $quantity @ $price \n");
//                                         $price = $ticker_list['btc_usdt']['bidPrice'];
//                                         //$price = $ticker_list['btc_usdt']['bidPrice'];
//                                         $quantity = round(($quantity_ini) * $ticker_list[$tickbtc]['bidPrice'], $pairs_infos["btc_usdt"]['baseAssetPrecision'], PHP_ROUND_HALF_UP);
//                                         $res3 = build_order("btc_usdt", "sell", $price, $quantity);
//                                         $order3 = json_decode($res3);
//                                         $weight += 1;
//                                         //print("Order 3 : btc_usdt - $quantity @ $price \n");
//                                         print($date);
//                                         print(" : ");
//                                         print("2");
//                                         print(" - ");
//                                         print("\033[32m Success trade $tickbtc (usdt) ( $perc ) !\033[0m \n");
//                                         //print_r($order1);
//                                         //print_r($order2);
//                                         //print_r($order3);
//                                         usleep(400);
//                                         goto restart;
//                                 } else {
//                                         $weight += 1;
//                                         $delete = deleteOrder($order1->order->orderId);
//                                         print("Missed the trade $ticketh, deleted it...\n");
//                                         goto restart;
//                                 }


//                                 /*                                                                        }
//                                          else {
//                                                 print("Counter trade out, missed the trade...\n");
//                                                 goto restart;
//                                         } */
//                         }
//                 }
//         }
// }
}

exports.launchArbitrage = launchArbitrage;