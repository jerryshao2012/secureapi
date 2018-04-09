const express = require('express');
const router = express.Router();
// Get our config file
const config = require('../config');

const User = require('../app/models/user');

/* Create a user. */
router.post('/', function (req, res) {
    console.log("headers=" + JSON.stringify(req.headers) + "; body=" + JSON.stringify(req.body));
    // Create a user
    var disabled = req.body["disabled"];
    var password = req.body["password"];
    var email = req.body["email"];

    var newUser = new User({
        userName: req.body["userName"],
        password: config.hash(password),
        scope: req.body["scope"],
        email: email,
        disabled: disabled === "true"
    });

    // Create the user
    newUser.save(function (err) {
        if (err) return res.json({success: false, error: err["errmsg"]});

        console.log('User created successfully');
        res.status(201).json({success: true, message: 'User created successfully'});
    });
});

/* Update a user. */
router.put('/', function (req, res) {
    console.log("headers=" + JSON.stringify(req.headers) + "; body=" + JSON.stringify(req.body));
    if (req.body.userName) {
        var password = req.body["password"];
        var scope = req.body["scope"];
        var disabled = req.body["disabled"];
        var email = req.body["email"];
        var updateUser = {};
        if (password) updateUser["password"] = config.hash(password);
        if (scope) updateUser["scope"] = scope;
        if (email) updateUser["email"] = email;
        if (disabled) updateUser["disabled"] = disabled === "true";

        User.findOneAndUpdate({
            userName: req.body.userName
        }, updateUser, {}, function (err, user) {
            if (err) return res.json({success: false, error: err["errmsg"]});
            if (user) {
                console.log('User updated successfully');
                res.json({success: true, message: 'User updated successfully'});
            } else {
                res.status(404).json({success: false, error: 'No user found'});
            }
        });
    } else {
        res.status(404).json({success: false, error: 'No user found'});
    }
});

/* Delete a user. */
router.delete('/', function (req, res) {
    console.log("headers=" + JSON.stringify(req.headers) + "; body=" + JSON.stringify(req.body));
    if (req.body.userName) {
        User.findOneAndRemove({
            userName: req.body.userName
        }, {}, function (err, user) {
            if (err) return res.json({success: false, error: err["errmsg"]});
            if (user) {
                console.log('User deleted successfully');
                res.json({success: true, message: 'User deleted successfully'});
            } else {
                res.status(404).json({success: false, error: 'No user found'});
            }
        });
    } else {
        res.status(404).json({success: false, error: 'No user found'});
    }
});

/* Get a user. */
router.get('/:userName', function (req, res) {
    var userName = req.params.userName;
    var condition = (!userName || userName.toLowerCase() === "all") ? {} : {userName: userName};
    User.findOne(condition, function (err, user) {
        if (err) return res.json({success: false, error: err["errmsg"]});
        if (user) {
            res.json({success: true, user: user});
        } else {
            res.status(404).json({success: false, error: 'No user found'});
        }
    }).select('-_id -password -__v');
});

module.exports = router;