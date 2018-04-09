const express = require('express');
const router = express.Router();
// RSA key generation
const createKeys = require('rsa-json');
// Add swagger
const swaggerUi = require('swagger-ui-express'),
    swaggerDocument = require('../swagger.json');

/* GET generate RSA keypair */
router.get('/keyPair', function (req, res) {
    createKeys({bits: 1024}, function (err, keyPair) {
        if (err) return res.json({success: false, error: err});
        res.status(201).json({success: true, keyPair: keyPair});
    });
});
/* GET swagger */
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = router;