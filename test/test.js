const assert = require('assert');
const postman = require("../secure.APIs.postman.collection.json");
const chai = require('chai');
const chaiHttp = require('chai-http');
const _ = require('underscore');
//var server = require('../bin/www');

chai.use(chaiHttp);

function generateHost(url) {
    return url.protocol + "://" + url.host.join(".") + ":" + url.port;
}

function generatePath(array) {
    return "/" + array.join("/");
}

function generateBody(array) {
    return _.map(array, function (item) {
        return item.key + "=" + encodeURI(item.value);
    }).join("&")
}

var api = postman.item.find(function (item) {
    return item.name === 'Login';
});
describe(api.name, function () {
    it(api.name + ' done', function (done) {
        chai.request(generateHost(api.request.url))
            .post(generatePath(api.request.url.path))
            .type('form')
            .send(generateBody(api.request.body.urlencoded))
            .end(function (err, res) {
                if (err) done(err);
                assert.equal(res.status, 201);
                assert.equal(res.body.success, true);
                assert.equal(res.body.message, "Authentication successful");
                assert.ok(res.body.token, "Found authentication token");
                var token = res.body.token;
                done();

                var api = postman.item.find(function (item) {
                    return item.name === 'Remove a User';
                });
                describe("Clean up: " + api.name, function () {
                    it(api.name + ' done', function (done) {
                        chai.request(generateHost(api.request.url))
                            .delete(generatePath(api.request.url.path))
                            .set('Authorization', 'Bearer ' + token)
                            .type('form')
                            .send(generateBody(api.request.body.urlencoded))
                            .end(function () {
                                // Ignore error
                                done();

                                var api = postman.item.find(function (item) {
                                    return item.name === 'Create a User';
                                });
                                describe(api.name, function () {
                                    it(api.name + ' done', function (done) {
                                        chai.request(generateHost(api.request.url))
                                            .post(generatePath(api.request.url.path))
                                            .set('Authorization', 'Bearer ' + token)
                                            .type('form')
                                            .send(generateBody(api.request.body.urlencoded))
                                            .end(function (err, res) {
                                                if (err) done(err);
                                                assert.equal(res.status, 201);
                                                assert.equal(res.body.success, true);
                                                assert.equal(res.body.message, "User created successfully");

                                                done();

                                                var api = postman.item.find(function (item) {
                                                    return item.name === 'Update a User';
                                                });
                                                describe(api.name, function () {
                                                    it(api.name + ' done', function (done) {
                                                        chai.request(generateHost(api.request.url))
                                                            .put(generatePath(api.request.url.path))
                                                            .set('Authorization', 'Bearer ' + token)
                                                            .type('form')
                                                            .send(generateBody(api.request.body.urlencoded))
                                                            .end(function (err, res) {
                                                                if (err) done(err);
                                                                assert.equal(res.status, 200);
                                                                assert.equal(res.body.success, true);
                                                                assert.equal(res.body.message, "User updated successfully");

                                                                done();

                                                                var api = postman.item.find(function (item) {
                                                                    return item.name === 'Get a User';
                                                                });
                                                                describe(api.name, function () {
                                                                    it(api.name + ' done', function (done) {
                                                                        chai.request(generateHost(api.request.url))
                                                                            .get(generatePath(api.request.url.path))
                                                                            .set('Authorization', 'Bearer ' + token)
                                                                            .end(function (err, res) {
                                                                                if (err) done(err);
                                                                                assert.equal(res.status, 200);
                                                                                assert.equal(res.body.success, true);
                                                                                assert.ok(res.body.user, "User found");

                                                                                done();

                                                                                var api = postman.item.find(function (item) {
                                                                                    return item.name === 'Remove a User';
                                                                                });
                                                                                describe(api.name, function () {
                                                                                    it(api.name + ' done', function (done) {
                                                                                        chai.request(generateHost(api.request.url))
                                                                                            .delete(generatePath(api.request.url.path))
                                                                                            .set('Authorization', 'Bearer ' + token)
                                                                                            .type('form')
                                                                                            .send(generateBody(api.request.body.urlencoded))
                                                                                            .end(function (err, res) {
                                                                                                if (err) done(err);
                                                                                                assert.equal(res.status, 200);
                                                                                                assert.equal(res.body.success, true);
                                                                                                assert.equal(res.body.message, "User deleted successfully");

                                                                                                done();

                                                                                                var api = postman.item.find(function (item) {
                                                                                                    return item.name === 'Logoff';
                                                                                                });
                                                                                                describe(api.name, function () {
                                                                                                    it(api.name + ' done', function (done) {
                                                                                                        chai.request(generateHost(api.request.url))
                                                                                                            .get(generatePath(api.request.url.path))
                                                                                                            .set('Authorization', 'Bearer ' + token)
                                                                                                            .end(function (err, res) {
                                                                                                                if (err) done(err);
                                                                                                                assert.equal(res.status, 200);
                                                                                                                assert.equal(res.body.success, true);
                                                                                                                assert.equal(res.body.message, "Logoff successful");
                                                                                                                done();
                                                                                                            });
                                                                                                    });
                                                                                                });
                                                                                            });
                                                                                    });
                                                                                });
                                                                            });
                                                                    });
                                                                });
                                                            });
                                                    });
                                                });
                                            });
                                    });
                                });
                            });
                    });
                });
            });
    });
});

var certApi = postman.item.find(function (item) {
    return item.name === 'API Cert';
});
describe(certApi.name, function () {
    it(certApi.name + ' done', function (done) {
        chai.request(generateHost(certApi.request.url))
            .get(generatePath(certApi.request.url.path))
            .end(function (err, res) {
                assert.equal(err, null);
                assert.equal(res.status, 200);
                done();
            });
    });
});
