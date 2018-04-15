import _ from 'underscore';
// Used to create, sign, and verify tokens
import jwt from 'jsonwebtoken';
// Task scheduler library
import cron from 'node-cron';

// Get our config file
import * as myconfig from '../config';

// Get our mongoose model
import * as mySession from '../app/models/session';

// Corm job to remove session every 2 hours
// https://www.npmjs.com/package/node-cron
console.log(new Date() + ': clean session task every two hours');
cron.schedule('0 */2 * * *', function () {
    console.log(new Date() + ': running a clean session task');

    var createdAt = new Date(Date.now() - 1000 * 60 * 60);
    mySession.count({createdAt: {"$lt": createdAt}}, function (err, count) {
        console.log("Number of session(s) to verify & clean up: ", count);

        if (count > 0) {
            const pageSize = 100;
            const totalPage = count / pageSize + (count % pageSize > 0 ? 1 : 0);
            for (var pageNumber = 1; pageNumber <= totalPage; pageNumber++) {
                mySession.find({}, null, {}).skip((pageNumber - 1) * pageSize).limit(pageSize)
                    .exec(function (err, sessions) {
                        if (!err) {
                            _.each(sessions, function (session) {
                                console.log("Check session token: " + session.token);
                                jwt.verify(session.token, myconfig.jwt.publicKey, function (err) {
                                    // Only clean expired token
                                    if (err && err.name === 'TokenExpiredError') {
                                        mySession.findOneAndRemove({
                                            token: session.token
                                        }, {}, function (err) {
                                            if (err) {
                                                console.log("Failed to remove session token: " + session.token);
                                            } else {
                                                console.log("Removed session token: " + session.token);
                                            }
                                        });
                                    }
                                });
                            });
                        }
                    });
            }
        }
    });
});

// Remove all sessions on startup
/*Session.remove(function (err, count) {
    console.log("Removed: " + count);
});*/

//module.exports = {};
export default {};