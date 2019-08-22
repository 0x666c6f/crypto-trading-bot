require('../config.js');

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const should = chai.should();
const http = require('../http-manager');

//process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

describe('HTTP Tests', () => {
    describe('HTTP GET Tests', () => {

        it('It should make a successfull GET request', (done) => {
            http.get(process.env.APIEndpoint + "/api/v1/time", false, null).then(async function (res) {
                res.should.be.a('object');
                res.code.should.be.eql(0);
                done();
            });
        });
    
        it('It should make a failed GET request with error from server', (done) => {
            http.get(process.env.APIEndpoint + "/api/v1/ticker/btc_tfc", false, null).then(async function (res) {
                res.should.be.a('object');
                res.error.should.be.eql("Invalid value symbol: 'btc_tfc'");
                done();
            });
        });
    
        it('It should make a failed GET request with HTTP error', (done) => {
            http.get(process.env.APIEndpoint + "/api/v1/fdfdfd/btc_tfc", false, null).then(function (resp) {
            }, function (error) {
                error.should.be.a('object');
                error.code.should.be.eql(404);
                done();
            });
        });
    });
    
    describe('HTTP POST Tests', () => {
    
        it('It should make a successfull POST request', (done) => {
            let order = {
                "Symbol": "eth_btc",
                "Side": "sell",
                "Type": "limit",
                "Quantity": 0.01,
                "ts": "" + new Date().getTime(),
                "Price":99999999999999
            };
    
            http.post(process.env.APIEndpoint + "/api/v1/order", order).then(async function (res) {
                res.should.be.a('object');
                res.code.should.be.eql(0);
                res.order.instrument.should.be.eql('eth_btc');
                done();
            });
        });
    
        it('It should make a failed POST request with a server response', (done) => {
            let order = {
                "Symbol": "eth_btc",
                "Side": "sell",
                "Type": "limit",
                "Quantity": 1000,
                "ts": "" + new Date().getTime(),
                "Price":99999999999999
            };
    
            http.post(process.env.APIEndpoint + "/api/v1/order", order).then(function (res) {
                res.should.be.a('object');
                res.errors[0].code.should.be.eql('');
                res.errors[0].message.should.be.eql("Not enough 'eth'");
                done();
            });
                
        });
    
        it('It should make a failed POST request without a HTTP error', (done) => {
            let order = {
                "Symbol": "eth_btc",
                "Side": "sell",
                "Type": "limit",
                "Quantity": 1000,
                "ts": "" + new Date().getTime(),
                "Price":99999999999999
            };
    
            http.post(process.env.APIEndpoint + "/api/v1/orderssss", order).then(function (resp) {
            }, function (error) {
                error.should.be.a('object');
                error.code.should.be.eql(404);
                done();
            });
                
        });
    });
    
    describe('HTTP DELETE Tests', () => {
    
        it('It should make a successfull DELETE request', (done) => {
    
            var ts = new Date().getTime();
    
            http.del(process.env.APIEndpoint + "/api/v1/orders", "?ts=" + ts).then(async function (res) {
                res.should.be.a('object');
                res.code.should.be.eql(0);
                done();
            });
        });
    
    
        it('It should make a failed DELETE request with a HTTP error', (done) => {
            var ts = new Date().getTime();
    
            http.del(process.env.APIEndpoint + "/api/v1/orderssss", "?ts=" + ts).then(function (resp) {
            }, function (error) {
                error.should.be.a('object');
                error.code.should.be.eql(404);
                done();
            });
                
        });
    });
});

