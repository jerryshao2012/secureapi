# node-secure-api
The secure api library provides a set of security APIs for enrollment, authentication and authorization.

## Usage

### `node bin/www`

Start secure API services. An default admin account will be created if it is not existing.

Protected APIs need to be accessed through authenticated token in bearer header. Check postman collection for sample requests.

### Configuration
  
Secure API is using MongoDB. MongoDB configuration is defined in root/config.js.
````
// Database URL
database: "mongodb://localhost:27017/secureapi"
````
Session timeout: please check [JSON Web Tokens](https://github.com/auth0/node-jsonwebtoken)
````
// Expires in 24 hours
expiresIn: "24h"
````
Enrollment:
````
tempUserCollection: "tempUsers",
expirationTime: 600, // 10 minutes
verificationURL: "http://localhost:" + port + "/api/v1/email-verification/${URL}",
transportOptions: {
    service: "Gmail",
    auth: {
        user: "awesomeapp.api@gmail.com",
        pass: "*******"
    }
},
verifyMailOptions: {
    from: "Do Not Reply <myawesomeemail_do_not_reply@gmail.com>",
    subject: "Please confirm account",
    html: "Click the following link to confirm your account:</p><p>${URL}</p>",
    text: "Please confirm your account by clicking the following link: ${URL}"
},
````
Authentication level: level2, level1, level0
````
level0: {
    urls: ['/'],
    through: ''
},
level1: {
    urls: ['/api/v1/keyPair', '/api/v1/api-docs'],
    through: 'basic',
    scope: "admin"
},
level2: {
    urls: ['/api/v1'],
    through: 'jwt'
},
level3: {
    urls: ['/api/v2'],
    through: 'web'
}
````
### Postman collection

Postman collection is located in root/secure.APIs.postman.collection.json.

## Testing
Integrated with postman collection, mocha, chai, chai-http. After install Mocha:
````
npm install mocha chai chai-http --save-dev

````
Just run:
````
npm test
````
## API documentation

* Swagger 2 standard API documentation can be accessed at /api/v1/api-docs such as localhost:6002/api/v1/api-docs if server is launched on port 6002 locally. The link is protected by default admin account.

## Logs

Beside console logs, api logs are located in root/logs/all-logs.log.

Log level and format is defined in root/config.js.
````
// Log level & format
logFormat: "dev"

````
## Web reference application for Secure API
Use brower to access:
````
http://localhost:6002/api/v2/home
````
Note: contains reference implementation for password recovery / sign up / remember me

## References
* [Underscore](http://underscorejs.org) a library that provides a whole mess of useful functional programming helpers without extending any built-in objects.
* [Express](https://expressjs.com) fast, unopinionated, minimalist web framework for Node.js
* [JSON Web Tokens](https://github.com/auth0/node-jsonwebtoken) an implementation of JSON Web Tokens
* [mongoose](http://mongoosejs.com) elegant mongodb object modeling for node.js 
* [Node Email Verification](https://github.com/whitef0x0/node-email-verification) verify user signup over email with NodeJS and MongoDB
* [rsa-json](https://github.com/substack/rsa-json) generate RSA keypairs as json blobs
* [Swagger UI Express](https://www.npmjs.com/package/swagger-ui-express) adds middleware to your express app to serve the Swagger UI bound to your Swagger document. This acts as living documentation for your API hosted from within your app
* [cfenv](https://github.com/cloudfoundry-community/node-cfenv) easy access to your Cloud Foundry application environment
* [node-cron](https://github.com/kelektiv/node-cron) tiny task scheduler in pure JavaScript for node.js based on GNU crontab. This module allows you to schedule task in node.js using full crontab syntax.
* [morgan](https://github.com/expressjs/morgan) HTTP request logger middleware for node.js
* [winston](https://github.com/winstonjs/winston) a logger for just about everything
* [Mocha](https://mochajs.org) a feature-rich JavaScript test framework running on Node.js and in the browser, making asynchronous testing simple and fun. Mocha tests run serially, allowing for flexible and accurate reporting, while mapping uncaught exceptions to the correct test cases.
* [Chai](http://www.chaijs.com) a BDD / TDD assertion library for node and the browser that can be delightfully paired with any javascript testing framework
* [Chai HTTP](https://github.com/chaijs/chai-http) HTTP integration testing with Chai assertions
* [express-session](https://github.com/expressjs/session) Express session middleware
* (connect-mongodb-session)[https://github.com/mongodb-js/connect-mongodb-session] Use to store express web sessions in MongoDB
* (Nodemailer)[https://github.com/nodemailer/nodemailer] Send e-mails with Node.JS
* (nodemailer-express-handlebars)[https://www.npmjs.com/package/nodemailer-express-handlebars] Express Handlebars plugin for Nodemailer

## TODO
- Convert into ESX/Ecma6 without Transpiler (Babel etc.)
- Make test cases' dependency more clean. 
