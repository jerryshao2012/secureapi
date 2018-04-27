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
    urls: '/',
    through: ''
},
level1: {
    urls: ['/api/v1/keyPair', '/api/v1/api-docs'],
    through: 'basic',
    scope: "admin"
},
level2: {
    urls: '/api/v1',
    through: 'jwt'
},
level3: {
    urls: '/api/v2',
    through: 'web'
}
````
#### Context urls matching

[RFC 3986 `urls`](https://tools.ietf.org/html/rfc3986#section-3.3) is used for context matching.

```
         foo://example.com:8042/over/there?name=ferret#nose
         \_/   \______________/\_________/ \_________/ \__/
          |           |            |            |        |
       scheme     authority       path        query   fragment
```

* **path matching**
    - `urls: ''` - matches any path, all requests will be proxied.
    - `urls: '/'` - matches any path, all requests will be proxied.
    - `urls: '/api'` - matches paths starting with `/api`

* **multiple path matching**
    - `urls: ['/api', '/ajax', '/someotherpath']` 

* **wildcard path matching**
    
    For fine-grained control you can use wildcard matching. Glob pattern matching is done by _micromatch_. Visit [micromatch](https://www.npmjs.com/package/micromatch) or [glob](https://www.npmjs.com/package/glob) for more globbing examples.
    - `urls: '**'` matches any path, all requests will be proxied.
    - `urls: '**/*.html'` matches any path which ends with `.html`
    - `urls: '/*.html'` matches paths directly under path-absolute
    - `urls: '/api/**/*.html'` matches requests ending with `.html` in the path of `/api`
    - `urls: ['/api/**', '/ajax/**']` combine multiple patterns
    - `urls: ['/api/**', '!**/bad.json']` exclusion

* **custom matching**
    
    For full control you can provide a custom function to determine which requests should be proxied or not.
    ```
    /**
     * @return {Boolean}
     */
    var filter = function (pathname, req) {
        return (pathname.match('^/api') && req.method === 'GET');
    };

    ...
    level1: {
        urls: filter,
        through: 'basic',
        scope: "admin"
    }
    ...
    ```
    
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

## Fast elliptic-curve cryptography
[Elliptic-curve cryptography (ECC)](https://en.wikipedia.org/wiki/Elliptic-curve_cryptography) is an approach to public-key cryptography based on the algebraic structure of elliptic curves over finite fields. ECC requires smaller keys compared to non-ECC cryptography (based on plain Galois fields) to provide equivalent security. Reference implementation for how to use Elliptic Curve Cryptography library in web application with NodeJS [crypto module](https://nodejs.org/api/crypto.htm).

Note: For web client side, the generated client side elliptic key will be kept in local storage.

## Protected reverse proxy

Upgrade [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware) to be a protected reverse proxy.

Sample configurations show how to reverse proxy https://www.google.com and http://www.example1.org:
````
    junctions: [
        // Check https://github.com/chimurai/http-proxy-middleware for how to config reverse proxy
        {
            context: ['/api/v2/sales', '/logos', '/images', '/xjs', '/logos', '/gen_204'],
            options: {
                target: 'https://www.google.com',
                changeOrigin: true,
                pathRewrite: {
                    '^/api/v2/sales': ''           // Remove path
                }
            }
        },
        {
            context: '/api/v2/dashboard',
            options: {
                target: 'http://www.example1.org',  // target host
                changeOrigin: true,                 // needed for virtual hosted sites
                ws: true,                           // proxy websockets
                pathRewrite: {
                    '^/api/v2/dashboard/old-path': '/api/new-path',     // rewrite path
                    '^/api/v2/dashboard/remove/path': '/path'           // remove base path
                },
                router: {
                    // when request.headers.host == 'dev.localhost:3000',
                    // override target 'http://www.example.org' to 'http://localhost:8000'
                    'dev.localhost:3000': 'http://localhost:8000'
                }
            }
        }
    ]
```` 
[http://localhost:6002/api/v2/sales](http://localhost:6002/api/v2/sales)is protected by Secure API authentication. Only successful authenticated user can access it.

## References
* [Underscore](http://underscorejs.org) a library that provides a whole mess of useful functional programming helpers without extending any built-in objects.
* [Express](https://expressjs.com) fast, unopinionated, minimalist web framework for Node.js
* [JSON Web Tokens](https://github.com/auth0/node-jsonwebtoken) an implementation of JSON Web Tokens
* [mongoose](http://mongoosejs.com) elegant mongodb object modeling for node.js 
* [Node Email Verification](https://github.com/whitef0x0/node-email-verification) verify user signup over email with NodeJS and MongoDB
* [node-rsa](https://github.com/rzcoder/node-rsa) NodeJS RSA library
* [Swagger UI Express](https://www.npmjs.com/package/swagger-ui-express) adds middleware to your express app to serve the Swagger UI bound to your Swagger document. This acts as living documentation for your API hosted from within your app
* [cfenv](https://github.com/cloudfoundry-community/node-cfenv) easy access to your Cloud Foundry application environment
* [node-cron](https://github.com/kelektiv/node-cron) tiny task scheduler in pure JavaScript for node.js based on GNU crontab. This module allows you to schedule task in node.js using full crontab syntax.
* [morgan](https://github.com/expressjs/morgan) HTTP request logger middleware for node.js
* [winston](https://github.com/winstonjs/winston) a logger for just about everything
* [Mocha](https://mochajs.org) a feature-rich JavaScript test framework running on Node.js and in the browser, making asynchronous testing simple and fun. Mocha tests run serially, allowing for flexible and accurate reporting, while mapping uncaught exceptions to the correct test cases.
* [Chai](http://www.chaijs.com) a BDD / TDD assertion library for node and the browser that can be delightfully paired with any javascript testing framework
* [Chai HTTP](https://github.com/chaijs/chai-http) HTTP integration testing with Chai assertions
* [express-session](https://github.com/expressjs/session) Express session middleware
* [connect-mongodb-session](https://github.com/mongodb-js/connect-mongodb-session) Use to store express web sessions in MongoDB
* [Nodemailer](https://github.com/nodemailer/nodemailer) Send e-mails with Node.JS
* [nodemailer-express-handlebars](https://www.npmjs.com/package/nodemailer-express-handlebars) Express Handlebars plugin for Nodemailer
* [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware) Reverse proxy for Node.JS
* [aes-js](https://github.com/ricmoo/aes-js) A pure JavaScript implementation of the AES block cipher algorithm and all common modes of operation (CBC, CFB, CTR, ECB and OFB)
* [Elliptic](https://github.com/indutny/elliptic) Fast elliptic-curve cryptography in a plain javascript implementation
* [Browserify](http://browserify.org/) run NodeJS in browser - require('modules') in the browser by bundling up all of your dependencies

## TODO
- Convert into ESX/Ecma6 without Transpiler (Babel etc.)
- Make test cases' dependency more clean
- Swagger update