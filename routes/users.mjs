import express from 'express';
const router = express.Router();

import * as User from '../app/models/user';

/* GET users listing. */
router.get('/', function (req, res) {
    User.find({}, function (err, users) {
        res.json(users);
    }).select('-_id -password -__v');
});

//module.exports = router;
export default router;