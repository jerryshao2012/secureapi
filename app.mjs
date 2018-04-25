/**
 * Get the packages we need
 */
//const createError = require('http-errors');
import createError from 'http-errors';
// The popular Node framework
import fs from 'fs';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
// Get parameters from our POST requests
import bodyParser from 'body-parser';
// Interact with our MongoDB database
import mongoose from 'mongoose';

import assert from 'assert';
// App logger framework
import logger from './app/logger';
// Launch cron jobs
import job from './app/job';
//new require('./app/job');

// Get our mongoose model
import User from './app/models/user';

/**
 * Configuration
 */
// Get our config file
import config from './config';

import indexRouter from './routes/index';
import usersRouter from './routes/users';
import userRouter from './routes/user';
import apiRouter from './routes/api';
import otherRouter from './routes/other';

const app = new express();

// Use morgan and winston together
//app.use(require("morgan")(config.logFormat, {stream: logger.stream}));

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
                    console.log("Could not create first user", err);
                } else {
                    console.log('User saved successfully');
                }
            });
        }
    });
});

// Use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// View engine setup
app.set('views', path.join('./', 'views'));
app.set('view engine', 'jade');

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join('./', 'public')));

/**
 * Routes
 */
// Basic route
app.use('/', indexRouter);
// Route for secure api
app.use('/api/v1', apiRouter);

// API ROUTES -------------------
// Get an instance of the router for api routes
var apiRoutes = express.Router();
// Route to return all users (GET http://localhost:8080/api/v1/users)
apiRoutes.use('/users', usersRouter);
// Route for user maintain
apiRoutes.use('/user', userRouter);
// Other protected API end points
apiRoutes.use('/', otherRouter);

// Apply the routes to our application with the prefix /api/v1
app.use('/api/v1', apiRoutes);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// Error handler
app.use(function (err, req, res) {
    // Set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // Render the error page
    res.status(err.status || 500);
    res.render('error');
});

//module.exports = app;
export default app;