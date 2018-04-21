const _ = require('underscore');
const express = require('express');
const webRoutes = express.Router();
// Used to create, sign, and verify tokens
const jwt = require('jsonwebtoken');
const path = require('path');
// Enrollment api
const enroll = require('../app/enroll');

// Get our mongoose model
const User = require('../app/models/user');

// Get our config file
const config = require('../config');

webRoutes.use(function (req, res, next) {
    var length = config.authentication.webLevels.length;

    function arrayContains(array, item) {
        if (Array.isArray(array) && typeof item === 'string') {
            // For URL contains
            var length = array.length;
            for (var i = 0; i < length; i++) {
                if (array[i] && item.indexOf(array[i]) >= 0) return true;
            }
        } else if (Array.isArray(array) && Array.isArray(item)) {
            // For two array scope
            var length1 = array.length;
            var length2 = item.length;
            for (var i1 = 0; i1 < length1; i1++) {
                for (var i2 = 0; i2 < length2; i2++) {
                    if (array[i1] && item[i2] && item[i2] === array[i1]) return true;
                }
            }
        }
        return false;
    }

    if (req.session && req.session.user) {
        if (_.some(config.authentication.webLevels, function (level, index) {
                var configAuthenticationLevel = config.authentication[level];
                if (arrayContains(configAuthenticationLevel.urls, req.originalUrl)) {
                    if (configAuthenticationLevel.through === 'web'
                        && (!configAuthenticationLevel.scope || arrayContains(configAuthenticationLevel.scope.split(','),
                            req.session.user.scope ? req.session.user.scope.split(',') : []))) {
                        next();
                        return true;
                    } else {
                        if (index + 1 === length || configAuthenticationLevel.through === '') {
                            next();
                            return true;
                        }
                    }
                }
            }) === false) {
            return res.status(401).send({
                success: false,
                error: 'Unauthorized'
            });
        }
    } else {
        // Unauthenticated. Level 0
        if (_.some(config.authentication.webLevels, function (level, index) {
                var configAuthenticationLevel = config.authentication[level];
                if (arrayContains(configAuthenticationLevel.urls, req.originalUrl)) {
                    if (configAuthenticationLevel.through === 'web' && !configAuthenticationLevel.scope) {
                        return false;
                    } else {
                        if (index + 1 === length || configAuthenticationLevel.through === '') {
                            next();
                            return true;
                        }
                    }
                }
            }) === false) {
            return res.status(401).send({
                success: false,
                error: 'Unauthorized'
            });
        }
    }
});

webRoutes.post('/login', function (req, res) {
    if (req.session && req.session.user) {
        return res.status(200).json({
            success: true,
            message: 'Already authenticated'
        });
    } else {
        var userName = req.body.userName;
        if (userName) {
            // Find the user
            User.findOne({
                userName: userName
            }, function (err, user) {
                if (err) {
                    console.log("Authentication failed: ", err);
                    return res.status(400).json({success: false, error: 'Authentication failed'});
                }

                if (!user) {
                    return res.status(403).json({success: false, message: 'Authentication failed'});
                } else if (user) {
                    // Check if password matches
                    var password = req.body.password;
                    if (!user.validPassword(password) && user.disabled === false) {
                        return res.status(403).json({success: false, error: 'Authentication failed'});
                    } else {
                        req.session.user = user;
                        // If user is found and password is right, create a token with only our given payload
                        const payload = {
                            sub: user.userName,
                            scope: user.scope
                        };
                        if (req.body['remember-me'] === 'true') {
                            var ssoToken = jwt.sign(payload, config.jwt.privateKey, {
                                expiresIn: config.jwt.ssoExpiresIn,
                                issuer: config.jwt.issuer,
                                algorithm: "RS256"
                            });
                            // maxAge: number of seconds until the cookie expires
                            res.cookie('sso.token', ssoToken, {maxAge: config.jwt.ssoExpiresInSeconds});
                        }

                        // Return the information including token as JSON
                        res.status(201).json({
                            success: true,
                            message: 'Authentication successful'
                        });
                    }
                }
            });
        } else {
            return res.status(403).json({success: false, error: 'Authentication failed'});
        }
    }
});

// logged-in user homepage
webRoutes.get('/home', function (req, res) {
    if (req.session && req.session.user) {
        res.render('home', {
            title: 'Control Panel',
            udata: req.session.user
        });
    } else {
        // Check if the user's sso token is saved in a cookie
        if (!req.cookies || !req.cookies['sso.token']) {
            // If user is not logged-in
            res.render('index', {title: 'Secure API - Please Login To Your Account'});
        } else {
            // Attempt automatic login using SSO token
            var token = req.cookies['sso.token'];
            var tokenParts = token.split('.');
            if (Array.isArray(tokenParts) && tokenParts.length === 3) {
                // Verifies secret and checks exp: config.secret
                jwt.verify(token, config.jwt.publicKey, {issuer: config.jwt.issuer}, function (err, decoded) {
                    if (err) {
                        // If user is not logged-in
                        return res.render('index', {title: 'Secure API - Please Login To Your Account'});
                    } else {
                        User.findOne({
                            userName: decoded.sub
                        }, function (err, user) {
                            if (err || !user) {
                                console.log("Single sign on authentication failed: ", err);
                                // If user is not logged-in
                                return res.render('index', {title: 'Secure API - Please Login To Your Account'});
                            }

                            // If user is found and password is right, create a token with only our given payload
                            const payload = {
                                sub: user.userName,
                                scope: user.scope
                            };
                            var ssoToken = jwt.sign(payload, config.jwt.privateKey, {
                                expiresIn: config.jwt.ssoExpiresIn,
                                issuer: config.jwt.issuer,
                                algorithm: "RS256"
                            });
                            // maxAge: number of seconds until the cookie expires
                            res.cookie('sso.token', ssoToken, {maxAge: config.jwt.ssoExpiresInSeconds});

                            req.session.user = user;

                            res.render('home', {
                                title: 'Control Panel',
                                udata: req.session.user
                            });
                        });
                    }
                });
            }
        }
    }
});

webRoutes.put('/user', function (req, res) {
    if (!req.session || !req.session.user) {
        res.redirect('/');
    } else {
        var user = req.session.user;
        var password = req.body["password"];
        var email = req.body["email"];
        var updateUser = {};
        if (password && password !== '') updateUser["password"] = config.hash(password);
        if (email) updateUser["email"] = email;

        User.findOneAndUpdate({
            userName: user.userName
        }, updateUser, {}, function (err, user) {
            if (err) return res.status(400).json({success: false, error: "error-updating-account"});
            if (user) {
                req.session.user = user;
                console.log('User updated successfully');
                res.json({success: true, message: 'User updated successfully'});
            } else {
                res.status(404).json({success: false, error: 'error-updating-account'});
            }
        });
    }
});

webRoutes.post('/logout', function (req, res) {
    if (req.cookies && req.cookies['sso.token']) {
        console.log('Clean sso cookie');
        res.clearCookie('sso.token');
    }
    if (req.session) {
        console.log('Logout web session');
        req.session.destroy(function () {
            res.status(200).send('ok');
        });
    }
});

// Creating new accounts
webRoutes.get('/signup', function (req, res) {
    res.render('signup', {title: 'Signup'});
});

webRoutes.post('/signup', function (req, res) {
    var userName = req.body.userName;
    var email = req.body.email;
    var password = req.body.password;
    if (userName && email && password) {
        User.findOne({
            userName: userName
        }, function (err, user) {
            if (err) {
                return res.status(400).json({
                    success: false,
                    error: 'error-creating-account'
                });
            }
            if (!user) {
                User.findOne({
                    email: email
                }, function (err, user) {
                    if (err) {
                        return res.status(400).json({
                            success: false,
                            error: 'error-creating-account'
                        });
                    }
                    if (!user) {
                        var newTempUser = new User({
                            userName: userName,
                            email: email,
                            password: password,
                            // Enable for self-serv
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
                                    error: 'username-taken'
                                });
                            }

                            // New user created
                            if (newTempUser) {
                                var URL = newTempUser[enroll.options.URLFieldName];
                                // Patch URL
                                URL = config.enroll.verificationURL.replace(/\$\{URL\}/g, URL).replace('/api/v1', '/api/v2');

                                enroll.sendVerificationEmail(email, URL, function (err, info) {
                                    if (err) {
                                        console.log('Sending verification email FAILED: ', email);
                                        return res.status(404).json({success: false, error: "error-creating-account"});
                                    }
                                    console.log('User enrolled successfully');
                                    res.status(201).json({
                                        success: true,
                                        message: 'Enroll successful: an email has been sent to you. Please check it to verify your account.',
                                        info: info
                                    });
                                });
                            } else {
                                // User already exists in temporary collection!
                                res.status(400).json({
                                    success: false,
                                    error: 'email-taken'
                                });
                            }
                        });
                    } else {
                        return res.status(400).json({
                            success: false,
                            error: 'email-taken'
                        });
                    }
                });
            } else {
                return res.status(400).json({
                    success: false,
                    error: 'username-taken'
                });
            }
        });
    } else {
        res.status(403).json({success: false, error: 'Enroll failed. No user name/email/password'});
    }
});

// User accesses the link that is sent
webRoutes.get('/email-verification/:URL', function (req, res) {
    var url = req.params.URL;

    enroll.confirmTempUser(url, function (err, user) {
        if (user) {
            enroll.sendConfirmationEmail(user.email, function (err, info) {
                if (err) {
                    return res.render('info', {
                        title: 'Error',
                        message: 'Sending confirmation email FAILED. Click <a href="/">here</a> to go home page'
                    });
                }
                console.log(info);
                return res.render('info', {
                    title: 'Congratulations',
                    message: 'Confirmation successful! Click <a href="/">here</a> to go home page'
                });
            });
        } else {
            return res.render('info', {
                title: 'Error',
                message: 'Could not confirm your email. Please re-enroll. Click <a href="/">here</a> to go home page'
            });
        }
    });
});

// Password reset
webRoutes.post('/lost-password', function (req, res) {
    // Look up the user's account via their email
    var email = req.body.email;
    User.findOne({
        email: email
    }, function (err, user) {
        if (err || !user) {
            console.log("Sending lost password email FAILED");
            return res.status(404).json({success: false, error: 'email-not-found'});
        }
        const hbs = require('nodemailer-express-handlebars'),
            nodemailer = require('nodemailer');
        const smtpTransport = nodemailer.createTransport(config.enroll.transportOptions);

        var handlebarsOptions = {
            viewEngine: 'handlebars',
            viewPath: path.join(__dirname, '../views/templates'),
            extName: '.html'
        };

        smtpTransport.use('compile', hbs(handlebarsOptions));

        var payload = {email: email};
        var token = jwt.sign(payload, config.jwt.privateKey, {
            // Default 10 minutes
            expiresIn: config.enroll.expirationTime,
            issuer: config.jwt.issuer,
            algorithm: "RS256"
        });
        var url = config.enroll.resetPwdURL.replace(/\$\{URL\}/g, token);
        var data = {
            to: user.email,
            from: config.enroll.resetPwdMailOptions.from,
            template: 'forgot-password-email',
            subject: config.enroll.resetPwdMailOptions.subject,
            context: {
                URL: url,
                name: user.userName
            }
        };

        smtpTransport.sendMail(data, function (err) {
            if (!err) {
                return res.status(200)
                    .json({
                        success: true,
                        message: 'An email has been sent to you, yet again. Please check it to reset your password.'
                    });
            } else {
                return res.status(400)
                    .json({
                        success: false,
                        error: err
                    });
            }
        });
    });
});

webRoutes.get('/reset-password/:token', function (req, res) {
    var token = req.params.token;
    jwt.verify(token, config.jwt.publicKey, {issuer: config.jwt.issuer}, function (err, decoded) {
        if (err) {
            console.log('Invalid token for reset password: ', token);
            return res.redirect('/');
        } else {
            // Save the user's email in a session instead of sending to the client
            req.session.reset = {email: decoded.email};
            return res.render('reset', {title: 'Reset Password'});
        }
    });
});

webRoutes.post('/reset-password', function (req, res) {
    // Retrieve the user's email from the session to lookup their account and reset password
    var email = req.session.reset.email;
    // Destroy the session immediately after retrieving the stored email
    req.session.destroy();
    if (email) {
        var password = req.body["password"];
        var updateUser = {};
        if (password) updateUser["password"] = config.hash(password);
        console.log('Update password for ', email);

        User.findOneAndUpdate({
            email: email
        }, updateUser, {}, function (err, user) {
            if (err) {
                console.log(email + ' failed to update password: ', e.stack);
                return res.status(400).json({success: false, error: 'Failed to reset password'});
            }
            if (user) {
                console.log('User updated successfully');
                res.status(200).json({success: true, message: 'Successfully reset password'});
            } else {
                res.status(404).json({success: false, error: 'No user found'});
            }
        });
    } else {
        res.status(404).json({success: false, error: 'No user found'});
    }
});

// View & delete accounts
webRoutes.get('/list', function (req, res) {
    User.find({}, function (err, users) {
        res.render('list', {title: 'User List', users: users});
    }).select('-_id -password -__v');
});

webRoutes.delete('/user', function (req, res) {
    if (!req.session || !req.session.user) {
        res.redirect('/');
    } else {
        var user = req.session.user;
        User.findOneAndRemove({
            userName: user.userName
        }, {}, function (err, user) {
            if (err) return res.status(400).json({success: false, error: 'No user found'});
            if (user) {
                console.log('User deleted successfully');
                if (req.cookies && req.cookies['sso.token']) {
                    console.log('Clean sso cookie');
                    res.clearCookie('sso.token');
                }
                if (req.session) {
                    console.log('Logout web session');
                    req.session.destroy(function () {
                        res.status(200).send('ok');
                    });
                }
            } else {
                res.status(404).json({success: false, error: 'No user found'});
            }
        });
    }
});

// Catch 401
webRoutes.get('*', function (req, res) {
    console.error("401: " + req.originalUrl);
    res.redirect('/');
});

// Catch 404
webRoutes.get('*', function (req, res) {
    console.error("404: " + req.originalUrl);
    res.render('404', {title: 'Page Not Found'});
});

// Application encounters an error
webRoutes.get('*', function (err, req, res, next) {
    res.status(err.status || 500);
    console.error(err.status + ": " + req.originalUrl + '\n' + e.stack);
    res.render('500', {title: 'System Error'});
});

module.exports = webRoutes;