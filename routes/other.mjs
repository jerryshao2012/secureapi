import express from 'express';
const router = express.Router();
// RSA key generation
import createKeys from 'rsa-json';
// Add swagger
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json';

/* GET generate RSA keypair */
router.get('/keyPair', function (req, res) {
    createKeys({bits: 1024}, function (err, keyPair) {
        if (err) return res.json({success: false, error: err});
        res.status(201).json({success: true, keyPair: keyPair});
    });
});
/* GET swagger */
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//module.exports = router;
export default router;