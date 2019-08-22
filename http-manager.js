const request = require('request');
const log = require('./logger').logger;
var utils = require("./trading-utils");

var get = function (url, auth, args) {
    let options = {
        headers: {
            'content-type': 'application/json'
        },
        url: url
    };

    if (args) {
        options.url = url + args;
    }

    if (auth) {
        options.headers = {
            Key: process.env.APIKey,
            Sign: utils.generateSignature(args),
            'content-type': 'application/json'
        };
    }
    return new Promise((resolve, reject) => {
        request.get(options, function (err, res) {
            if (res && res.body) {
                let response;
                try {
                    response = JSON.parse(res.body);
                } catch (error) {
                    response = {
                        error: error
                    };
                }
                resolve(response);
            } else if (err) {
                let response;
                try {
                    response = JSON.parse(err);
                } catch (error) {
                    response = {
                        error: error
                    };
                }
                reject(response);
            } else {
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
    let options = {
        headers: {
            Key: process.env.APIKey,
            Sign: utils.generateSignature(JSON.stringify(data)),
            'Content-Type': 'application/json'
        },
        url: url,
        json: data
    };

    return new Promise((resolve, reject) => {
        request.post(options, function (err, res) {
            if (res && res.body) {
                resolve(res.body);
            } else if (err) {
                let error = {
                    error : err
                };
                reject(error);
            } else {
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
    let options = {
        headers: {
            Key: process.env.APIKey,
            Sign: utils.generateSignature(args),
            'Content-Type': 'application/json'
        },
        url: url,
    };

    if (args) {
        options.url = url + args;
    }

    return new Promise((resolve, reject) => {
        request.delete(options, function (err, res) {
            if (res && res.body) {
                let response;
                try {
                    response = JSON.parse(res.body);
                } catch (error) {
                    response = {
                        error: error
                    };
                }
                resolve(response);            
            } else if (err) {
                let response;
                try {
                    response = JSON.parse(err);
                } catch (error) {
                    response = {
                        error: error
                    };
                }
                reject(response);
            } else {
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