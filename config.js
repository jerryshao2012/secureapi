// Crypto library
const crypto = require('crypto');
// Provides access to your Cloud Foundry environment for more info, see: https://www.npmjs.com/package/cfenv
const cfenv = require('cfenv');
// Get the app environment from Cloud Foundry
const appEnv = cfenv.getAppEnv();

// Get port from environment and store in Express.
const port = normalizePort(appEnv.port || process.env.PORT || 3000);
var host = "http://localhost:" + port;

var hashData = function (password) {
    if (!password) return '';

    return crypto.createHmac('sha256', this.secret).update(password).digest('base64');
};

// Sync version of hashing function
var nevHash = function (password, tempUserData, insertTempUser, callback) {
    var hash = hashData(password);
    return insertTempUser(hash, tempUserData, callback);
};

// Async version of hashing function
/*var nevHash = function(password, tempUserData, insertTempUser, callback) {
    // Hash instance
    const hmac = crypto.createHmac('sha256', this.secret);
    // Readout format:
    hmac.setEncoding('base64');
    //or also commonly: hmac.setEncoding('hex');
    // callback is attached as listener to stream's finish event:
    hmac.end(password ? password : '', function () {
        return insertTempUser(hmac.read(), tempUserData, callback);
    });
};*/

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // Named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

var request = require('request');

module.exports = {
    // Database URL
    database: "mongodb://localhost:27017/secureapi",
    // Log level & format
    // combined: Standard Apache combined log output.
    // :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"
    // common: Standard Apache common log output.
    // :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]
    // dev: Concise output colored by response status for development use. The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
    // :method :url :status :response-time ms - :res[content-length]
    // short: Shorter than default, also including response time.
    // :remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms
    // tiny: The minimal output.
    // :method :url :status :res[content-length] - :response-time ms
    logFormat: "dev",
    loggerLevel: "debug",
    jwt: {
        // Issuer for token
        issuer: "secure.api",
        // Expires in 24 hours: https://github.com/auth0/node-jsonwebtoken
        expiresIn: "24h",
        // Used in web session
        expiresInMilliseconds: 1000 * 60 * 60 * 24,
        // Used in web session: https://github.com/zeit/ms
        ssoExpiresIn: "7d",
        ssoExpiresInSeconds: 60 * 60 * 24 * 7
    },
    enroll: {
        tempUserCollection: "tempUsers",
        expirationTime: 600, // 10 minutes
        verificationURL: host + "/api/v1/email-verification/${URL}",
        transportOptions: {
            service: "Gmail",
            auth: {
                user: "awesomeapp.api@gmail.com",
                pass: "**********"
            }
        },

        verifyMailOptions: {
            from: "Do Not Reply <myawesomeemail_do_not_reply@gmail.com>",
            subject: "Please confirm account",
            html: "Click the following link to confirm your account:</p><p>${URL}</p>",
            text: "Please confirm your account by clicking the following link: ${URL}"
        },

        resetPwdURL: host + "/api/v2/reset-password/${URL}",
        resetPwdMailOptions: {
            from: "Do Not Reply <myawesomeemail_do_not_reply@gmail.com>",
            subject: "Please reset your password"
        },

        hashingFunction: nevHash,
        passwordFieldName: "password"
    },
    authentication: {
        apiLevels: ['level2', 'level1', 'level0'],
        webLevels: ['level3', 'level0'],
        level0: {
            urls: '/',
            through: ''
        },
        level1: {
            urls: ['/api/v1/keyPair', '/api/v1/api-docs'],
            through: 'basic',
            scope: "admin"
        },
        level2: {
            urls: '/api/v1',
            through: 'jwt'
        },
        level3: {
            urls: '/api/v2',
            through: 'web'
        }
    },
    host: host,
    port: port,
    hash: hashData,
    junctions: [
        // Check https://github.com/chimurai/http-proxy-middleware for how to config reverse proxy
        {
            context: ['/api/v2/sales', '/logos', '/images', '/xjs', '/logos', '/gen_204'],
            options: {
                target: 'https://www.google.com',
                changeOrigin: true,
                pathRewrite: {
                    '^/api/v2/sales': ''           // Remove path
                }
            }
        },
        {
            context: '/api/v2/dashboard',
            options: {
                target: 'http://www.example1.org',  // target host
                changeOrigin: true,                 // needed for virtual hosted sites
                ws: true,                           // proxy websockets
                pathRewrite: {
                    '^/api/v2/dashboard/old-path': '/api/new-path',     // rewrite path
                    '^/api/v2/dashboard/remove/path': '/path'           // remove base path
                },
                router: {
                    // when request.headers.host == 'dev.localhost:3000',
                    // override target 'http://www.example.org' to 'http://localhost:8000'
                    'dev.localhost:3000': 'http://localhost:8000'
                }
            }
        }
    ]
};