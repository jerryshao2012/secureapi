// Logger framework
const winston = require('winston');
// Get our config file
const config = require('../config');

// Log requests to the console
//const logger = require('morgan');
var logger = winston.createLogger({
    transports: [
        new winston.transports.File({
            level: process.env.LOG_LEVEL || config.loggerLevel || "info",
            filename: './logs/all-logs.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false
        }),
        new winston.transports.Console({
            level: process.env.LOG_LEVEL || config.loggerLevel || "debug",
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});
logger.stream = {
    write: function (message) {
        logger.info(message);
    }
};

// This tells express to log via morgan
// Use morgan to log requests to the console
//app.use(logger('dev'));
// and morgan to log in the "combined" pre-defined format
//app.use(logger('combined'));
// Use morgan and winston together
//app.use(require("morgan")(config.logFormat, {stream: logger.stream}));
//app.use(require("morgan")("combined", { stream: logger.stream }));

module.exports = logger;