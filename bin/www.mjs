#!/usr/bin/env node

/**
 * Module dependencies.
 */
// Provides access to your Cloud Foundry environment for more info, see: https://www.npmjs.com/package/cfenv
import cfenv from 'cfenv';
import app from '../app';
import _debug from 'debug';
//import secureapis from 'secureapis:server';
//const debug = _debug (secureapis);
import http from 'http';

// Get the app environment from Cloud Foundry
const appEnv = cfenv.getAppEnv();
// Get our config file
import config from '../config';
// Get port from environment and store in Express.
const port = config.port;
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
// Start server on the specified port and binding host
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    //debug('Listening on ' + bind);
    // print a message when the server starts listening
    console.log("Server starting on " + appEnv.url);
}