// Logger framework
import winston from 'winston';

// Log requests to the console
//const logger = require('morgan');
var logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : "info",
            filename: './logs/all-logs.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false
        }),
        new winston.transports.Console({
            level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : "debug",
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

//module.exports = logger;
export default logger;