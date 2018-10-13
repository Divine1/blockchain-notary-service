# privateblockchain-withapi

## Nodejs framework

[Expressjs](https://expressjs.com/) framework is used in this project
` npm install --save express `

Entry point for the application is `index.js`

## Other libraries used
` npm install --save level `

` npm install --save crypto-js `

` npm install --save body-parser `


`body-parser` library is use to parse body parameter of HTTP POST request

## End point details

URL configured in this Project : `http://localhost:9000` 

    - Endpoint 1
        - method : GET
        - uri : /block/:[blockheight]
    
    - Endpoint 2 
        - method : POST
        - uri : /block
        - content-type : application/json
        - Request body : ` 
            {
                "body" : "sample data",
                "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
                "star": {
                    "dec": "-26° 29'  24.9",
                    "ra": "16h 29m 1.0s",
                    "story": "Found star using https://www.google.com/sky/"
                }
            }
        `
    
    - Endpoint 3
        - method : POST
        - uri : /requestValidation
        - Request body : `
            {
                "address" : "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"
            }
        `
    - Endpoint 4
        - method : POST
        - uri : /message-signature/validate
        - Request body : `
            {
                "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
                "signature": "H6ZrGrF0Y4rMGBMRT2+hHWGbThTIyhBS0dNKQRov9Yg6GgXcHxtO9GJN4nwD2yNXpnXHTWU9i+qdw5vpsooryLU="
            }
        `
    
    - Endpoint 5
        - method : GET
        - uri : /stars/address:[ADDRESS]
    
    - Endpoint 6
        - method : GET
        - uri : /stars/hash:[HASH]

You can also enter an invalid endpoint say for example `http://localhost:9000/xyz` to view the end point details


