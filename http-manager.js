const request = require('request');
const log = require('ololog').configure({
    time: true
})
const ansi = require('ansicolor').nice
var crypto = require("crypto");

var get = function (url, auth, args) {
    log("New GET request")
    log("- URL = " + url)
    log("- Auth = " + auth)
    log("- Args = " + args)

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
            Sign: generateSignature(args)
        }
    }
    return new Promise((resolve, reject) => {
        request.get(options, function (err, res) {
            if (res && res.body) {
                log("GET request successfull")
                resolve(JSON.parse(res.body))
            } else if (err) {
                log.red("Error while doing GET request")
                resolve(JSON.parse(err))
            } else {
                log.red("Unkown Error while doing DELETE request")
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
    log("New POST request")
    log("- URL = " + url)
    log("- Data = " + JSON.stringify(data))

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
                log("POST request successfull")
                resolve(res.body)
            } else if (err) {
                log.red("Error while doing POST request")
                resolve(err)
            } else {
                log.red("Unkown Error while doing DELETE request")
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
    log("New DELETE request")
    log("- URL = " + url)
    log("- Args = " + args)

    let options = {
        headers: {
            Key: process.env.APIKey,
            Sign: generateSignature(args)
        },
        url: url,
    };

    if (args) {
        options.url = url + args
    }

    return new Promise((resolve, reject) => {
        request.delete(options, function (err, res) {
            if (res.body) {
                log("DELETE request successfull")
                resolve(JSON.parse(res.body))
            } else if (err) {
                log.red("Error while doing DELETE request")
                reject(JSON.parse(err))
            } else {
                log.red("Unkown Error while doing DELETE request")
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