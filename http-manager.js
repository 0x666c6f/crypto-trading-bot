const request = require('request');
const log = require('./logger').logger;
var crypto = require("crypto");
var utils = require("./trading-utils");

var get = function (url, auth, args) {
    // log("New GET request")
    // log("- URL = " + url)
    // log("- Auth = " + auth)
    // log("- Args = " + args)

    let options = {
        headers: null,
        url: url
    };

    if (args) {
        options.url = url + args;
    }

    if (auth) {
        options.headers = {
            Key: process.env.APIKey,
            Sign: utils.generateSignature(args)
        };
    }
    return new Promise((resolve, reject) => {
        request.get(options, function (err, res) {
            if (res && res.body) {
                //log("GET request successfull")
   
                resolve(res.body);
            } else if (err) {
                log.error.red("Error for GET response :", error);
                reject(response);
            } else {
                //log.red("Unkown Error while doing DELETE request")
                let error = {
                    code: res.statusCode,
                    message: res.statusMessage
                };
                reject(error);
            }
        });
    });
};

var post = function (url, data) {
    // log("New POST request")
    // log("- URL = " + url)
    // log("- Data = " + JSON.stringify(data))

    let options = {
        headers: {
            Key: process.env.APIKey,
            Sign: utils.generateSignature(args)
        },
        url: url,
        json: data
    };

    return new Promise((resolve, reject) => {
        request.post(options, function (err, res) {
            if (res.body) {
                //log("POST request successfull")
                let response;                
                try {
                    response = res.body;
                } catch (error) {
                    log.error("Error while parsing POST response :", error);
                    response = {
                        error: error
                    };
                }

                resolve(response);
            } else if (err) {
                //log.red("Error while doing POST request")
                let response;
                try {
                    response =JSON.parse(err);
                } catch (error) {
                    log.error("Error while parsing POST response :", error);
                    response = {
                        error: error
                    };
                }
                reject(response);
            } else {
                //log.red("Unkown Error while doing DELETE request")
                let error = {
                    code: res.statusCode,
                    message: res.statusMessage
                };
                reject(error);
            }
        });
    });
};

var del = function (url, args) {
    // log("New DELETE request")
    // log("- URL = " + url)
    // log("- Args = " + args)

    let options = {
        headers: {
            Key: process.env.APIKey,
            Sign: utils.generateSignature(args)
        },
        url: url,
    };

    if (args) {
        options.url = url + args;
    }

    return new Promise((resolve, reject) => {
        request.delete(options, function (err, res) {
            if (res.body) {
                //log("DELETE request successfull")
                let response;
                try {
                    response =JSON.parse(res.body);
                } catch (error) {
                    log.error("Error while parsing DELETE response :", error);
                    response = {
                        error: error
                    };
                }
                resolve(response);
            } else if (err) {
                //log.red("Error while doing DELETE request")
                let response;
                try {
                    response =JSON.parse(err);
                } catch (error) {
                    log.error("Error while parsing DELETE response :", error);
                    response = {
                        error: error
                    };
                }
                reject(response);
            } else {
                //log.red("Unkown Error while doing DELETE request")
                let error = {
                    code: res.statusCode,
                    message: res.statusMessage
                };
                reject(error);
            }
        });
    });
};

exports.get = get;
exports.post = post;
exports.del = del;