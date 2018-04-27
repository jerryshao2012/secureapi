const HPM = require('./reverse-proxy-libs');

module.exports = function (context, opts) {
    return new HPM(context, opts);
};