// Interact with our MongoDB database
const mongoose = require('mongoose');
// Enrollment library
const nev = require('email-verification')(mongoose);

// Get our config file
const config = require('../config');

// Get our mongoose model
const User = require('../app/models/user');

// NEV configuration =====================
config.enroll.persistentUserModel = User;
nev.configure(config.enroll, function (err, options) {
    if (err) {
        console.log(err);
        return;
    }

    console.log('configured: ' + (typeof options === 'object'));
});

// Generating the model, pass the User model defined earlier
nev.generateTempUserModel(User, function (err, tempUserModel) {
    if (err) {
        console.log(err);
        return;
    }

    console.log('generated temp user model: ' + (typeof tempUserModel === 'function'));
});

function createTempUser(newTempUser, callback) {
    nev.createTempUser(newTempUser, function (err, existingPersistentUser, newTempUser) {
        callback(err, existingPersistentUser, newTempUser);
    });
}

function sendVerificationEmail(email, url, callback) {
    if (url && (url.indexOf('http://') >= 0 || url.indexOf('https://') >= 0)) {
        const nodemailer = require('nodemailer');
        const smtpTransport = nodemailer.createTransport(config.enroll.transportOptions);

        var r = /\$\{URL\}/g;

        // inject newly-created URL into the email's body and FIRE
        // stringify --> parse is used to deep copy
        var URL = url,
            mailOptions = JSON.parse(JSON.stringify(config.enroll.verifyMailOptions));

        mailOptions.to = email;
        mailOptions.html = mailOptions.html.replace(r, URL);
        mailOptions.text = mailOptions.text.replace(r, URL);

        smtpTransport.sendMail(mailOptions, callback);
    } else {
        nev.sendVerificationEmail(email, url, function (err, info) {
            callback(err, info);
        });
    }
}

function resendVerificationEmail(email, callback) {
    nev.resendVerificationEmail(email, function (err, userFound) {
       callback(err, userFound);
    });
}

function confirmTempUser(url, callback) {
    nev.confirmTempUser(url, function (err, user) {
        callback(err, user);
    });
}

function sendConfirmationEmail(email, callback) {
    nev.sendConfirmationEmail(email, function (err, info) {
        callback(err, info);
    });
}

module.exports = {
    createTempUser: createTempUser,
    sendVerificationEmail: sendVerificationEmail,
    resendVerificationEmail: resendVerificationEmail,
    confirmTempUser: confirmTempUser,
    sendConfirmationEmail: sendConfirmationEmail,
    options: nev.options
};