require('../config.js');

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const should = chai.should();
const tradeio = require('../tradeio');

//process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
let goodEndpoint = process.env.APIEndpoint;
let orderId;

describe('Trade IO Tests', () => {
    describe('Infos request', () => {

        it('It should make a successfull Infos request', (done) => {
            process.env.APIEndpoint = goodEndpoint
            tradeio.info().then(async function (res) {
                res.should.be.a('object');
                res.code.should.be.eql(0);
                done();
            });
        });
    
        it('It should make a failed GET request without error from server', (done) => {
            process.env.APIEndpoint = "https://api.api.exchange.trade.io"
            tradeio.info().then(async function (res) {
            },function (error) {
                error.should.be.a('object');
                done();
            });
        });
    });

    describe('Tickers request', () => {

        it('It should make a successfull tickers request', (done) => {
            process.env.APIEndpoint = goodEndpoint;
            tradeio.tickers().then(function (res) {
                res.should.be.a('object');
                res.code.should.be.eql(0);
                done();
            });
        });
    
        it('It should make a failed GET request without error from server', (done) => {
            process.env.APIEndpoint = "https://api.api.exchange.trade.io"
            tradeio.tickers().then(async function (res) {
            },function (error) {
                error.should.be.a('object');
                done();
            });
        });
    });

    describe('Order request', () => {

        it('It should make a successfull new order request', (done) => {
            process.env.APIEndpoint = goodEndpoint
            let order = {
                "Symbol": "eth_btc",
                "Side": "sell",
                "Type": "limit",
                "Quantity": 0.01,
                "ts": "" + new Date().getTime(),
                "Price":99999999999999
            };

            tradeio.newOrder(order.Symbol, order.Side, order.Type, order.Quantity,order.Price).then(async function (res) {
                res.should.be.a('object');
                res.code.should.be.eql(0);
                orderId = res.order.orderId;
                done();
            });
        });
    
        it('It should make a failed new order request with error from server', (done) => {
            process.env.APIEndpoint = goodEndpoint
            let order = {
                "Symbol": "eth_btc",
                "Side": "sell",
                "Type": "limit",
                "Quantity": 9999999,
                "ts": "" + new Date().getTime(),
                "Price":99999999999999
            };
            tradeio.newOrder(order.Symbol, order.Side, order.Type, order.Quantity,order.Price).then(async function (res) {
                res.should.be.a('object');
                res.errors[0].code.should.be.eql('');
                res.errors[0].message.should.be.eql("Not enough 'eth'");
                done();
            },function (error) {
                error.should.be.a('object');
                done();
            });
        });

        it('It should make a failed new order request without error from server', (done) => {
            process.env.APIEndpoint = "https://api.api.exchange.trade.io"
            let order = {
                "Symbol": "eth_btc",
                "Side": "sell",
                "Type": "limit",
                "Quantity": 0.01,
                "ts": "" + new Date().getTime(),
                "Price":99999999999999
            };
            tradeio.newOrder(order.Symbol, order.Side, order.Type, order.Quantity,order.Price).then(async function (res) {
            },function (error) {
                error.should.be.a('object');
                done();
            });
        });
    });

    describe('Cancel order request', () => {

        it('It should make a successfull new order cancel', (done) => {
            process.env.APIEndpoint = goodEndpoint
            tradeio.cancelOrder(orderId).then(async function (res) {
                res.should.be.a('object');
                res.code.should.be.eql(0);
                done();
            });
        });


        it('It should make a failed new order cancel without error from server', (done) => {
            process.env.APIEndpoint = "https://api.api.exchange.trade.io"

            tradeio.cancelOrder("222").then(async function (res) {
            },function (error) {
                error.should.be.a('object');
                done();
            });
        });
    });
});

