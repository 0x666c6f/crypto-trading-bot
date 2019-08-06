const request = require('request');
var logger = require('./logger');
var crypto = require("crypto");

var get = function (url, auth, args) {
    logger.info("New GET request")
    logger.info("- URL = " + url)
    logger.info("- Auth = " + auth)
    logger.info("- Args = " + args)

    let options = {
        headers: null,
        url: url
    };

    if (args) {
        options.url = url + args
    }

    if (auth) {
        options.headers = {
            Key: process.env.APIKey,
            Sign: crypto.createHmac('sha512', process.env.APISecret).update(args).digest('hex')
        }
    }
    return new Promise((resolve, reject) => {
        request.get(options, function (err, res) {
            if (res && res.body) {
                logger.info("GET request successfull")
                resolve(JSON.parse(res.body))
            } else if (err) {
                logger.error("Error while doing GET request")
                resolve(JSON.parse(err))
            } else {
                logger.error("Unkown Error while doing DELETE request")
                let error = {
                    code: res.statusCode,
                    message: res.statusMessage
                }
                reject(error)    
            }
        })
    });
}

var post = function (url, data) {
    logger.info("New POST request")
    logger.info("- URL = " + url)
    logger.info("- Data = " + JSON.stringify(data))

    let options = {
        headers: {
            Key: process.env.APIKey,
            Sign: crypto.createHmac('sha512', process.env.APISecret).update(JSON.stringify(data)).digest('hex')
        },
        url: url,
        json: data
    };

    return new Promise((resolve, reject) => {
        request.post(options, function (err, res) {
            if (res.body) {
                logger.info("POST request successfull")
                resolve(res.body)
            } else if (err) {
                logger.error("Error while doing POST request")
                resolve(err)
            } else {
                logger.error("Unkown Error while doing DELETE request")
                let error = {
                    code: res.statusCode,
                    message: res.statusMessage
                }
                reject(error)    
            }
        })
    });
}

var del = function (url, args) {
    logger.info("New DELETE request")
    logger.info("- URL = " + url)
    logger.info("- Args = " + args)

    let options = {
        headers: {
            Key: process.env.APIKey,
            Sign: crypto.createHmac('sha512', process.env.APISecret).update(args).digest('hex')
        },
        url: url,
    };

    if (args) {
        options.url = url + args
    }

    return new Promise((resolve, reject) => {
        request.delete(options, function (err, res) {
            if (res.body) {
                logger.info("DELETE request successfull")
                resolve(JSON.parse(res.body))
            } else if (err) {
                logger.error("Error while doing DELETE request")
                reject(JSON.parse(err))
            } else {
                logger.error("Unkown Error while doing DELETE request")
                let error = {
                    code: res.statusCode,
                    message: res.statusMessage
                }
                reject(error)    
            }
        })
    });
}

exports.get = get;
exports.post = post;
exports.del = del;