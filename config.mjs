// Crypto library
import crypto from 'crypto';
// Provides access to your Cloud Foundry environment for more info, see: https://www.npmjs.com/package/cfenv
import cfenv from 'cfenv';
// Get the app environment from Cloud Foundry
const appEnv = cfenv.getAppEnv();
// Get port from environment and store in Express.
const port = normalizePort(appEnv.port || process.env.PORT || 3000);
var secret = "thisisatesthybridapp";

var hashData = function(password) {
    if (!password) return '';
    return crypto.createHmac('sha256', secret).update(password).digest('base64');
};

// Sync version of hashing function
var nevHash = function(password, tempUserData, insertTempUser, callback) {
    var hash = hashData(password);
    return insertTempUser(hash, tempUserData, callback);
};

// Async version of hashing function
/*var nevHash = function(password, tempUserData, insertTempUser, callback) {
    // Hash instance
    const hmac = crypto.createHmac('sha256', secret);
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

export default {
    // Secret for hash
    secret: secret,
    // Database URL
    database: "mongodb://localhost:27017/secureapi",
    // Log level & format
    logFormat: "dev",
    jwt: {
        // Issuer for token
        issuer: "secure.api",
        // Expires in 24 hours: https://github.com/auth0/node-jsonwebtoken
        expiresIn: "24h",
        // RSA Private Key for token
        privateKey: "-----BEGIN RSA PRIVATE KEY-----\nMIICWwIBAAKBgQDNpj7kFV8vgGrMJoFdczwjIbkXyTbtyZXics4u6KFBvN6HpXUr\nuTdkALWzO2RHnwycJH1zDmJkdJC5XjkuKdnhhFQ0FGXtyvsx2M7DEkUN7VhyeNoF\nMBzq6H5nXkuw7125Djosu4mSh9a1zPdPLXYC+0ivJ2tBBayE+9xrOjofrQIDAQAB\nAoGAaUe1pLCoRTo58n+39K582AN4rYuuWje8Suy5T1x6yZu2VL1I6fRtPf37B2Hd\naaksHHe13YQ8rO7b9HofTdnRF25GK58Edgrs1nKY1QJpwlBtB5LW2MkB7HUZNeLN\nNxY6TCAFdINuHAbJKYNVJLKcfBhKBZk+NvazvsgxmYWduwUCQQD269Dkm6CF5Xq0\nraIZ5FFcaJWkgfkgNZJfSjNy79qlL9ZtMquyd3srQaw16ngbwY1sLO/XQ+pmndYL\ntqS+WEWXAkEA1TXz6haE6e2T7K+5eQBig2/Cdejg2oKMNRN+C+KpwbXrxH1soCao\noiMtfm4h2rhxxL9kfTYV/o8QoqMoEnwVWwJAMeM5JEcRKpxPq1t9ac/IZGw497DO\n3aQVO61pMaqmOUOuBgf7yqX7O6UcHxSNScZURWva1VpCbJMtINa4+EArZwJAIpya\nlyLGuu79d4vjURhV5b5r1BZVAkP1HNyoNqe6JR8yQfiWfL0p3QBW71JTnp0Yovbr\nCkSQd32kFrLj23RXRwJAP7U/yQmJ4OfjYYYAmi8RNy2rN9b2qoTKcRfZYWPhFI9E\nDPQ9sDCYlH3ncsZulijpoaRDBfp69kpTNggfQTYXGQ==\n-----END RSA PRIVATE KEY-----\n",
        // RSA Public Key for token
        publicKey: "-----BEGIN RSA PUBLIC KEY-----\nMIGJAoGBAM2mPuQVXy+AaswmgV1zPCMhuRfJNu3JleJyzi7ooUG83oeldSu5N2QA\ntbM7ZEefDJwkfXMOYmR0kLleOS4p2eGEVDQUZe3K+zHYzsMSRQ3tWHJ42gUwHOro\nfmdeS7DvXbkOOiy7iZKH1rXM908tdgL7SK8na0EFrIT73Gs6Oh+tAgMBAAE=\n-----END RSA PUBLIC KEY-----\n"
    },
    enroll: {
        tempUserCollection: "tempUsers",
        expirationTime: 600, // 10 minutes
        verificationURL: "http://localhost:" + port + "/api/v1/email-verification/${URL}",
        transportOptions: {
            service: "Gmail",
            auth: {
                user: "awesomeapp.api@gmail.com",
                pass: "******"
            }
        },

        verifyMailOptions: {
            from: "Do Not Reply <myawesomeemail_do_not_reply@gmail.com>",
            subject: "Please confirm account",
            html: "Click the following link to confirm your account:</p><p>${URL}</p>",
            text: "Please confirm your account by clicking the following link: ${URL}"
        },

        hashingFunction: nevHash,
        passwordFieldName: "password"
    },
    authentication: {
        levels: ['level2', 'level1', 'level0'],
        level0: {
            urls: ['/'],
            through: ''
        },
        level1: {
            urls: ['/api/v1/keyPair', '/api/v1/api-docs'],
            through: 'basic',
            scope: "admin"
        },
        level2: {
            urls: ['/api/v1'],
            through: 'jwt'
        }
    },
    port: port,
    hash: hashData
};

//export default config;