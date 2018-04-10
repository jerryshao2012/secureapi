# node-secure-api
The secure api library provides a set of security APIs for enrollment, authentication and authorization.

## Usage

### `node bin/www`

Start secure API services. An default admin account will be created if it is not exit.

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
logFormat: "dev",

````
## TODO
- Convert into ESX/Ecma6 without Transpiler (Babel etc.)
- Make test cases' dependency more clean. 
