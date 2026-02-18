const express = require('express');
const router = express.Router();

router.get('/ip', function (req, res, next) {
    fetch('https://ipinvestigator.expeditedaddons.com/?api_key=E9A50Z1FP3M162094G7JOBT7IQU8VC6523LXWH8KSRY4ND&ip=68.10.149.45')
        .then(function (response) {
            return response.text().then(function (body) {
                res.json({
                    'status:': response.status,
                    'headers:': Object.fromEntries(response.headers.entries()),
                    'response:': body
                });
            });
        })
        .catch(function (error) {
            next(error);
        });
});

// GET home page
router.get('/', function (req, res, next) {
    res.redirect('/api/v2/home');
});

module.exports = router;
