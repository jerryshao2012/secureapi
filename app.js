/**
 * Get the packages we need
 */
const createError = require('http-errors');
// The popular Node framework
const express = require('express');
// Express session middleware
const webSession = require('express-session');
var MongoWebSessionStore = require('connect-mongodb-session')(webSession);
const path = require('path');
// Get cookies from our requests
const cookieParser = require('cookie-parser');
// Get parameters from our POST requests
const bodyParser = require('body-parser');
// Interact with our MongoDB database
const mongoose = require('mongoose');
const assert = require('assert');
// Used to create, sign, and verify tokens
const jwt = require('jsonwebtoken');
// App logger framework
const logger = require('./app/logger');
// Launch cron jobs
new require('./app/job');

// Get our mongoose model
const User = require('./app/models/user');

/**
 * Configuration
 */
// Get our config file
const config = require('./config');

const indexRouter = require('./routes/index');
const webApiRouter = require('./routes/web');
const usersRouter = require('./routes/users');
const userRouter = require('./routes/user');
const publicApiRouters = require('./routes/api');
const otherRouter = require('./routes/other');

const app = new express();

// Use morgan and winston together
app.use(require("morgan")(config.logFormat, {stream: logger.stream}));

// Connect to database
mongoose.connect(config.database, function (err) {
    assert.equal(null, err);

    console.log("Connected successfully to mongo database server on startup");

    // For initial setup
    User.count({}, function (err, count) {
        if (!err && count === 0) {
            // Create a sample user
            var testUser = new User({
                userName: 'Test User',
                password: config.hash("password"),
                email: 'awesomeapp.api@gmail.com',
                scope: 'admin',
                disabled: false
            });

            // Save the sample user
            testUser.save(function (err) {
                if (err) {
                    console.log("Could not create first testing user", err.stack);
                } else {
                    console.log('First testing user created successfully');
                }
            });
        }
    });
});

// Use cookie parser so we can get cookie from request
app.use(cookieParser());
// Use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Routes
 */
// Basic route
app.use('/', indexRouter);
// Route for secure api
app.use('/api/v1', publicApiRouters);

// API ROUTES -------------------
// Get an instance of the router for api routes
var apiRoutes = express.Router();
// Route to return all users (GET http://localhost:8080/api/v1/users)
apiRoutes.use('/users', usersRouter);
// Route for user maintain
apiRoutes.use('/user', userRouter);
// Other protected API end points
apiRoutes.use('/', otherRouter);
apiRoutes.get('/userInfo', function (req, res) {
    res.redirect('/api/v1/user/');
});

// Apply the routes to our application with the prefix /api/v1
app.use('/api/v1', apiRoutes);

var webSessionStore = new MongoWebSessionStore({
    uri: config.database,
    collection: 'webSession'
});
var sessionSettings = {
    secret: config.secret,
    cookie: {
        maxAge: config.jwt.expiresInMilliseconds
    },
    // Default is connect.sid
    name: 'sa.sid',
    // https://www.npmjs.com/package/express-session#saveuninitialized
    saveUninitialized: false,
    proxy: true,
    // https://www.npmjs.com/package/express-session#resave
    resave: true,
    store: webSessionStore
};
// Catch errors
webSessionStore.on('error', function(error) {
    assert.ifError(error);
    assert.ok(false);
});

if (process.env.name === 'production') {
    // Trust first proxy
    app.set('trust proxy', 1);
    // Serve secure cookies
    sessionSettings.cookie.secure = true;
}
app.use("/api/v2", webSession(sessionSettings));
// Route for web app
app.use('/api/v2', webApiRouter);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

var env = process.env.NODE_ENV || 'development';
// Error handler
app.use(function (err, req, res) {
    // Set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = env === 'development' ? err : {};

    // Render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;