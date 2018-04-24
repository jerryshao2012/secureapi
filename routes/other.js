const express = require('express');
const router = express.Router();
// Node RSA library
var NodeRSA = require('node-rsa');
// Add swagger
const swaggerUi = require('swagger-ui-express'),
    swaggerDocument = require('../swagger.json');

/* GET generate RSA keypair */
router.get('/keyPair', function (req, res) {
    var keyPair = new NodeRSA({b: 1024});
    res.status(201).json({success: true, keyPair: {
        publicKey: keyPair.exportKey('pkcs1-public-pem'),
        privateKey: keyPair.exportKey('pkcs1-private-pem')
    }});
});
/* GET swagger */
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = router;