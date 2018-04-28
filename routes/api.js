const _ = require('underscore');
const express = require('express');
const apiRoutes = express.Router();
// Used to create, sign, and verify tokens
const jwt = require('jsonwebtoken');
const contextMatcher = require('../lib/reverse-proxy-libs/context-matcher');
// Enrollment api
const enroll = require('../app/enroll');
// Protected reverse proxy
const junction = require('../routes/junction');
// App logger framework
const logger = require('../app/logger');

// Crypto library
//const crypto = require('crypto');
// Get our config file
const config = require('../config');

// Get our mongoose model
const User = require('../app/models/user');
const Session = require('../app/models/session');

// Route to show a random message (GET http://localhost:8080/api/)
apiRoutes.get('/', function (req, res) {
    res.json({message: 'Welcome to the coolest Secure API - ' + new Date()});
});

// Route to authenticate a user (POST http://localhost:8080/api/login)
apiRoutes.post('/login', function (req, res) {
    var token = req.body.token || req.query.token || req.headers['authorization'];

    // Remove token
    if (token) {
        // For Bearer token
        if (/^Bearer\s/i.test(token)) token = token.replace(/^Bearer\s/i, "");

        Session.findOneAndRemove({
            token: token
        }, {}, function () {
            logger.debug('Remove old session: ' + token);
        });
    }
    var userName = req.body.userName;
    if (userName) {
        // Find the user
        User.findOne({
            userName: userName
        }, function (err, user) {
            if (err) {
                logger.error("Authentication failed: ", err);
                return res.status(500).json({success: false, error: 'Authentication failed'});
            }

            if (!user) {
                return res.status(403).json({success: false, message: 'Authentication failed'});
            } else if (user) {
                // Check if password matches
                var password = req.body.password;
                // Hash instance
                //const hmac = crypto.createHmac('sha256', config.secret);
                // Readout format:
                //hmac.setEncoding('base64');
                //or also commonly: hmac.setEncoding('hex');
                // callback is attached as listener to stream's finish event:
                //hmac.end(password ? password : '', function () {
                //if (!user.validPassword(hmac.read())) {
                if (!user.validPassword(password) && user.disabled === false) {
                    return res.status(403).json({success: false, error: 'Authentication failed'});
                } else {
                    // If user is found and password is right, create a token with only our given payload
                    const payload = {
                        sub: user.userName,
                        scope: user.scope
                    };
                    // config.secret
                    var token = jwt.sign(payload, config.jwt.privateKey, {
                        expiresIn: config.jwt.expiresIn,
                        issuer: config.jwt.issuer,
                        algorithm: "RS256"
                    });

                    var session = new Session({
                        token: token,
                        authLevel: 2
                    });

                    // Create a session
                    session.save(function (err) {
                        if (err) return res.status(400).json({success: false, error: err["errmsg"]});
                        logger.debug('Session created successfully');

                        // Return the information including token as JSON
                        res.status(201).json({
                            success: true,
                            message: 'Authentication successful',
                            token: token
                        });
                    });
                }
                //});
            }
        });
    } else {
        return res.status(403).json({success: false, error: 'Authentication failed'});
    }
});
// Route to enroll a user (POST http://localhost:8080/api/enroll)
apiRoutes.post('/enroll', function (req, res) {
    var userName = req.body.userName;
    var email = req.body.email;
    var password = req.body.password;
    if (userName && email && password) {
        var newTempUser = new User({
            userName: userName,
            email: email,
            password: password,
            disabled: false
        });
        enroll.createTempUser(newTempUser, function (err, existingPersistentUser, newTempUser) {
            if (err) {
                return res.status(404).json({success: false, error: "Creating temp user FAILED"});
            }

            // User already exists in persistent collection
            if (existingPersistentUser) {
                return res.status(400).json({
                    success: false,
                    error: 'You have already signed up and confirmed your account. Did you forget your password?'
                });
            }

            // New user created
            if (newTempUser) {
                var URL = newTempUser[enroll.options.URLFieldName];

                enroll.sendVerificationEmail(email, URL, function (err, info) {
                    if (err) {
                        return res.status(404).json({success: false, error: "Sending verification email FAILED"});
                    }
                    logger.debug('User enrolled successfully');
                    res.status(201).json({
                        success: true,
                        message: 'Enroll successful: an email has been sent to you. Please check it to verify your account.',
                        info: info
                    });
                });

                // User already exists in temporary collection!
            } else {
                res.status(400).json({
                    success: false,
                    error: 'You have already signed up. Please check your email to verify your account.'
                });
            }
        });
    } else {
        res.status(403).json({success: false, error: 'Enroll failed. No user name/email/password'});
    }
});
apiRoutes.post('/reenroll', function (req, res) {
    var email = req.body.email;
    enroll.resendVerificationEmail(email, function (err, userFound) {
        if (err) {
            return res.status(404).json({success: false, error: "Resending verification email FAILED"});
        }
        if (userFound) {
            res.json({
                success: true,
                message: 'An email has been sent to you, yet again. Please check it to verify your account.'
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Your verification code has expired. Please sign up again.'
            });
        }
    });
});
// User accesses the link that is sent
apiRoutes.get('/email-verification/:URL', function (req, res) {
    var url = req.params.URL;

    enroll.confirmTempUser(url, function (err, user) {
        if (user) {
            enroll.sendConfirmationEmail(user.email, function (err, info) {
                if (err) {
                    return res.status(404).json({success: false, error: "Sending confirmation email FAILED"});
                }
                res.json({
                    success: true,
                    message: 'CONFIRMED!',
                    info: info
                });
            });
        } else {
            return res.status(404).json({success: false, error: "Confirming temp user FAILED"});
        }
    });
});
apiRoutes.get('/publickey', function (req, res) {
    res.status(200).send(config.jwt.publicKey);
});
// Elliptic Curve Diffie-Hellman (ECDH) public key
apiRoutes.get('/epublickey', function (req, res) {
    res.status(200).send(config['elliptic'].publicKey);
});
// Route to logoff a user (GET http://localhost:8080/api/logoff)
apiRoutes.get('/logoff', function (req, res) {
    var token = req.body.token || req.query.token || req.headers['authorization'];

    // Remove token
    if (token) {
        // For Bearer token
        if (/^Bearer\s/i.test(token)) token = token.replace(/^Bearer\s/i, "");

        Session.findOneAndRemove({
            token: token
        }, {}, function () {
            logger.debug('Logoff session: ' + token);
            res.status(200).json({success: true, message: 'Logoff successful'});
        });
    } else {
        res.status(404).json({success: false, error: 'No authorization token'});
    }
});

var restrictSession = {};

// Route middleware to verify a token
apiRoutes.use(function (req, res, next) {
    var length = config.authentication.apiLevels.length;

    function arrayContains(array1, array2) {
        if (Array.isArray(array1) && Array.isArray(array2)) {
            // For two array scope
            var length1 = array1.length;
            for (var i = 0; i < length1; i++) {
                if (array2.includes(array1[i])) return true;
            }
        }
        return false;
    }

    _.some(config.authentication.apiLevels, function (level, index) {
        var configAuthenticationLevel = config.authentication[level];
        var path = (req.originalUrl || req.url);
        if (contextMatcher.match(configAuthenticationLevel.urls, path, req)) {
            if (restrictSession[req.headers.authorization]) {
                // Access granted
                next();
                return true;
            }
            if (configAuthenticationLevel.through === 'basic') {
                // Basic authentication
                const b64Auth = (req.headers.authorization || '').split(' ')[1] || '';
                if (b64Auth !== '') {
                    // Parse login and password from headers
                    const strAuth = new Buffer(b64Auth, 'base64').toString();
                    const splitIndex = strAuth.indexOf(':');
                    const userName = strAuth.substring(0, splitIndex);
                    const password = strAuth.substring(splitIndex + 1);
                    if (userName && password) {
                        // Find the user
                        User.findOne({
                            userName: userName
                        }, function (err, user) {
                            if (!err && user && user.validPassword(password) && user.disabled === false
                                && (!config.authentication[level].scope
                                    || arrayContains(config.authentication[level].scope.split(','),
                                        user.scope ? user.scope.split(',') : []))) {
                                // Access granted. authLevel = 1
                                restrictSession[req.headers.authorization] = b64Auth;
                                return junction.validateJunction(req, res, next);
                            }
                            // Change this
                            res.set('WWW-Authenticate', 'Basic realm="401"');
                            // Custom message
                            res.status(401).send('Authentication required.');
                        });
                        return true;
                    }
                }
                // Change this
                res.set('WWW-Authenticate', 'Basic realm="401"');
                // Custom message
                res.status(401).send('Authentication required.');
                return true;
            } else if (configAuthenticationLevel.through === 'jwt') {
                // Check header or url parameters or post parameters for token
                var token = req.body.token || req.query.token || req.headers.authorization;

                // Verify token
                if (token) {
                    // For Bearer token
                    if (/^Bearer\s/i.test(token)) token = token.replace(/^Bearer\s/i, "");

                    var tokenParts = token.split('.');
                    if (Array.isArray(tokenParts) && tokenParts.length === 3) {
                        Session.findOne({token: token}, function (err, session) {
                            if (err || !session) return res.status(401).json({
                                success: false,
                                error: 'Invalid session'
                            });
                            // Verifies secret and checks exp: config.secret
                            jwt.verify(token, config.jwt.publicKey, {issuer: config.jwt.issuer}, function (err, decoded) {
                                if (err || config.authentication[level].scope
                                    && !arrayContains(config.authentication[level].scope.split(','),
                                        decoded.scope ? decoded.scope.split(',') : [])) {
                                    return res.status(401).json({success: false, error: 'Invalid token'});
                                } else {
                                    // If everything is good, save to request for use in other routes
                                    req.decoded = decoded;
                                    // Access granted. authLevel = 2
                                    return junction.validateJunction(req, res, next);
                                }
                            });
                        });
                        return true;
                    }
                }
            } else {
                if (index + 1 === length || configAuthenticationLevel.through === '') {
                    // If there is no token, return an error
                    res.status(401).send({
                        success: false,
                        error: 'Unauthorized'
                    });
                    return true;
                }
            }
        }
    });
});

module.exports = apiRoutes;