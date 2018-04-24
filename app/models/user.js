// get an instance of mongoose and mongoose.Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Crypto library
const crypto = require('crypto');
// AES library
var aesjs = require('aes-js');

// Get our config file
const config = require('../../config');

// set up a mongoose model and pass it using module.exports
var userSchema = new Schema({
    userName: {type: String, unique: true, required: true, dropDups: true},
    password: {type: String, required: true},
    email: {type: String, unique: true, required: true},
    phone: String,
    scope: String,
    disabled: {type: Boolean, required: true}
}, {timestamps: true});

userSchema.methods.validPassword = function (pwd, clientPublicKey) {
    if (!pwd) return false;
    if (clientPublicKey) {
        try {
            var iv = [];
            if (pwd && pwd.indexOf('.') >= 0) {
                iv = aesjs.utils.hex.toBytes(pwd.substr(pwd.indexOf('.') + 1));
                pwd = pwd.substr(0, pwd.indexOf('.'));
            }
            // Elliptic Curve Diffie-Hellman (ECDH) key exchanges
            var serverKey = crypto.createECDH('secp256k1');
            serverKey.setPrivateKey(config.elliptic.privateKey, 'base64');
            const secret = serverKey.computeSecret(clientPublicKey, 'base64', 'hex');
            // The cipher-block chaining mode of operation maintains internal state, so to decrypt
            // a new instance must be instantiated. The initialization vector (must be 16 bytes)
            var aesCbc = new aesjs.ModeOfOperation.cbc(aesjs.utils.hex.toBytes(secret), iv);
            pwd =
                // To string
                aesjs.utils.utf8.fromBytes(
                    // Remove padding
                    aesjs.padding.pkcs7.strip(
                        aesCbc.decrypt(aesjs.utils.hex.toBytes(pwd))));
        } catch (e) {
            // Ignore it
        }
    }
    return config.hash(pwd) === this.password;
};

module.exports = mongoose.model('User', userSchema);