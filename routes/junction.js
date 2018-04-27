const _ = require('underscore');
// Reverse proxy
const reverseProxy = require('../lib/reverse-proxy');

// Get our config file
const config = require('../config');

// Reverse proxy for junctions
var junctions = [];
var validateJunction = function (req, res, next) {
    var isJunction = false;
    var length = junctions.length;
    for (var i = 0; i < length; i++) {
        var junction = junctions[i];
        if (junction.triggerTarget(req, res)) {
            isJunction = true;
            break;
        }
    }
    if (!isJunction) return next();
    return null;
};

var containsJunction = function (req, res) {
    var length = junctions.length;
    for (var i = 0; i < length; i++) {
        var junction = junctions[i];
        if (junction.triggerTarget(req, res)) {
            isJunction = true;
            return true;
        }
    }
    return false;
};

console.log('Setup junctions');
_.each(config.junctions, function (proxy) {
    junctions.push(reverseProxy(proxy.context, proxy.options));
});

module.exports = {
    validateJunction: validateJunction,
    containsJunction: containsJunction
};