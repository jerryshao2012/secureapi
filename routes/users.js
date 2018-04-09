const express = require('express');
const router = express.Router();

const User = require('../app/models/user');

/* GET users listing. */
router.get('/', function (req, res) {
    User.find({}, function (err, users) {
        res.json(users);
    }).select('-_id -password -__v');
});

module.exports = router;