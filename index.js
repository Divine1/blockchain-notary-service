const express = require("express");
const app = express();
const simplechain = require("./simpleChain");
const db = require("./levelSandbox");
const bodyParser = require("body-parser");
const url = require('url');
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');

const {
        COMMONCONSTANTS,
        validateStarObject,
        getStoryHexData,
        getValidationWindowTime,
        getStoryASCIIData
    } = require("./utility");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));



app.get("/print",(req,res)=>{
    console.log("in /print")
    // db.printAllBlocks().then();
    const address = "1EcPPsPNh74zzQaZTCcEGuCkpkQB9BjPgD";
    const blockchain = new simplechain.Blockchain();

    db.getSign("H0fEhNu9GMyyZorJibCnESJIxgMlkxwMY+1mcSxL/OAGNTClGnHPLmL1+gSWa6yZImng9WEOuCvAinKRN2fodX4=")
    .then();
   /* blockchain.getAddress(address).then((responseData)=>{
        console.log("then in line:27 ");
        console.log("responseData ",responseData)
        //const signatureDetails = responseData.response.signatureDetails;
        
        //signature,blockdataUsageStatus:

        // signatureDetails.filter((data,index)=>{
        //     console.log("data- ",data," :index- ",index);
        // })
    }).catch((err)=>{
        console.log("err ",err)
    })
*/
    res.send({"data":"see logs"})
})

//http://localhost:8000/block
app.post("/block",(req,res)=>{
    console.log("/block post invoked");

    let address = req.body.address;

    if(validateStarObject(req.body)){

    let star = req.body.star;
    let dec = star.dec;
    let ra = star.ra;
    let story = star.story;
    let storyHex = getStoryHexData(story);
    let requestTimeStamp = Date.now();
    let dataResponse = {
        hash : "",
        height : 0,
        body : {
            address : address,
            star : {
            ra : ra,
            dec : dec,
            story : storyHex
            }
        },
        time : "",
        previousBlockHash : ""
    };
    const blockchain = new simplechain.Blockchain();
        blockchain.getAddress(address).then((responseData)=>{
            console.log("77 ");
            console.log("responseData ",responseData.response);

            db.getAllSign().then((signdatas)=>{

                console.log("signdatas ",signdatas)
                let signData = signdatas.filter((data,index) => {
                    if(data.address == address && data.blockdataUsageStatus == COMMONCONSTANTS.VALIDATED){
                        return true;
                    }
                })
                
                if(signData.length > 0){

                    console.log("in 80")
                    const block = new simplechain.Block()
                    const blockchain = new simplechain.Blockchain();
                    block.body = dataResponse.body;
                    blockchain.addBlock(block).then((data) =>{
                        console.log("data ",data)
                        dataResponse.hash = data.hash;
                        dataResponse.height = data.height; 
                        dataResponse.time = requestTimeStamp;
                        dataResponse.previousBlockHash = data.previousBlockhash;
                        
                        if(typeof data.body == "string"){

                        }
                        else{
                        let storyASCII = getStoryASCIIData(data.body.star.story);
                        dataResponse.body.star.storyDecoded = storyASCII;
                        }


                        blockchain.deleteAddress(address).then((da)=>{
                            signData[0].blockdataUsageStatus = COMMONCONSTANTS.USED; 
                            db.insertSign(signData[0]).then((d) => {
                                console.log("insert signJson success d: ",d);
                                res.send(dataResponse);
                            }).catch((e)=>{
                                console.log("insert signJson failed e: ",e);
                            })
                            
                        }).catch((err)=>{
                            console.log("100 err ",err)
                            res.send({
                                "error" : action+" - delete address : "+JSON.stringify(err),
                                "address":address
                            }); 
                        });


                    }).catch((err) =>{
                        console.log("err ",err)
                        res.send({
                            "error" : COMMONCONSTANTS.ERROR,
                            "message" : err,
                            "body" : body,
                            "address" : address
                        })
                    });
                }
                else{
                    res.send({
                        "error" : "please validate your signature",
                        "address" : address
                    })
                }
                
            }).catch((err)=>{
                res.send({
                    "error" : "no tokens available for star registration",
                    "address" : address
                })
            })
        }).catch((err)=>{
            res.send({
                "error" : "Kindly register and validate your data before initiating for storage",
                "address" : address
            })
        })
    }
    else{
        res.send({
            "error" : "request has invalid input format for star object",
            "address" : address
        })
    }
});

// http://localhost:8000/requestValidation
app.post("/requestValidation",(req,res)=>{
    console.log("in /requestValidation post method address ",req.body);
    const address = req.body.address;
    const blockchain = new simplechain.Blockchain();
    if(address == ""){
        res.send({"error" :"enter address in request body"})
    }
    else{
        //var userData = getUserDataFromAddress(address);
        blockchain.getAddress(address).then((responseData)=>{
            var userData = responseData;

            if(userData.error == COMMONCONSTANTS.ERROR_ADDRESS_NOT_EXISTS){
                console.log(COMMONCONSTANTS.ERROR_ADDRESS_NOT_EXISTS);
                const currentRequestTimeStamp = Date.now();
                const starRegistry = "starRegistry";
                const message = address+":"+currentRequestTimeStamp+":"+starRegistry;
                const validationWindow = 300;
                const dataResponse = {
                    address,
                    "requestTimeStamp" : currentRequestTimeStamp,
                    message,
                    validationWindow
                };
                //maintainState.push(dataResponse);
                blockchain.insertAddress(dataResponse).then();
                console.log("dataResponse ",dataResponse)
                res.send(dataResponse)
            }
            else{
                userData = userData.response;
                var calValidationWindow = getValidationWindowTime(userData.requestTimeStamp);
                if(calValidationWindow == COMMONCONSTANTS.ERROR_VALIDATION_WINDOW_EXPIRED){
                    //maintainState = maintainState.filter((value,key)=>(value.address != address));
                    blockchain.deleteAddress(address).then();
                    res.send({"error" : COMMONCONSTANTS.ERROR_VALIDATION_WINDOW_EXPIRED});
                }
                else{
                    const dataResponse = {
                        address,
                        "requestTimeStamp" : userData.requestTimeStamp,
                        "message" : userData.message,
                        "validationWindow" : calValidationWindow
                    };
                    res.send(dataResponse)
                }
            }  
        }).catch((err)=>{
            blockchain.deleteAddress(address).then(()=>{
                res.send({
                        "error" : JSON.stringify(err),
                        message: "error during requestvalidation"
                });
            });
        })
    }
})

//http://localhost:8000/message-signature/validate
app.post("/message-signature/validate",(req,res)=>{
    console.log("in /message-signature/validate post method");

    let address = req.body.address;
    const signature = req.body.signature;
    const blockchain = new simplechain.Blockchain();
    console.log("req.body ",req.body)

    
    blockchain.getAddress(address).then((responseData)=>{
 
        var userData = responseData;
        if(userData == COMMONCONSTANTS.ERROR_ADDRESS_NOT_EXISTS){
            console.log(COMMONCONSTANTS.ERROR_ADDRESS_NOT_EXISTS);
            res.send({"error" : COMMONCONSTANTS.ERROR_ADDRESS_NOT_EXISTS});
        }
        else{
            userData = userData.response;
            db.getSign(signature).then((signresponse)=>{
                res.send({"error" : "the signature already exists, kindly use a new signature"});
            }).catch((err)=>{
                let message = userData.message;
                console.log(bitcoinMessage.verify(message, address, signature));
                if(bitcoinMessage.verify(message, address, signature))
                {
                    var calValidationWindow = getValidationWindowTime(userData.requestTimeStamp);
                    if(calValidationWindow == COMMONCONSTANTS.ERROR_VALIDATION_WINDOW_EXPIRED){
                        blockchain.deleteAddress(address).then();
                        res.send({"error" : COMMONCONSTANTS.ERROR_VALIDATION_WINDOW_EXPIRED});
                    }
                    else{
                        const dataResponse = {
                            registerStar : true,
                            status: {
                                address : userData.address,
                                requestTimeStamp : userData.requestTimeStamp,
                                message : userData.message,
                                validationWindow : calValidationWindow,
                                messageSignature : "valid"
                            }
                        };

                        
                        let signJson = {};
                        signJson.signature = signature;
                        signJson.blockdataUsageStatus = COMMONCONSTANTS.VALIDATED;
                        signJson.address = address;
                        db.insertSign(signJson).then((d) => {
                            console.log("insert signJson success d: ",d);
                            res.send(dataResponse);
                        }).catch((e)=>{
                            console.log("insert signJson failed e: ",e);
                        })

                    }
                }
                else{
                    res.send({"error" : "invalid address/signature","address":address});
                }
            })
        }
    }).catch((err)=>{
        blockchain.deleteAddress(address).then(()=>{
            res.send({
                    "error" : JSON.stringify(err),
                    message: "error during /message-signature/validate"
            });
        });
    })
});

//http://localhost:8000/stars/address:142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ
app.get("/stars/address*",(req,res)=>{
    console.log("in method /stars/address ")
    var query = url.parse(req.url,true);
    var address = query.pathname.split(":")[1];
    console.log("address ",address);
    db.getBlocksWithAddress(address).then((data)=>{
        res.send(data)
    }).catch((err)=>{
        console.log("err ",err)
    })
})

//http://localhost:8000/stars/hash:a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f
app.get("/stars/hash*",(req,res)=>{
    console.log("in method /stars/hash ")
    var query = url.parse(req.url,true);
    var hash = query.pathname.split(":")[1];
    console.log("hash ",hash);
    db.getBlocksWithHash(hash).then((data)=>{
        res.send(data)
    }).catch((err)=>{
        console.log("err ",err)
    })
})

//http://localhost:8000/block/2
app.get("/block/:blockheight", (req,res)=>{
    var blockheight = req.params.blockheight;
    console.log("blockheight ",blockheight)
    const blockchain = new simplechain.Blockchain();
    if(blockheight ==null){
        res.send({
            "status" : COMMONCONSTANTS.ERROR,
            "message" : "please send blockheight parameter in http get request"
        })
    }
    else{
        blockchain.getBlock(blockheight).then( data => {
            if(data == null){
                throw "block not found for given blockheight"
            }
            else{
                console.log("then getBlock ",data)
                res.send(data)
            }
        })
        .catch((err)=>{
            console.log("err ",  err.Error)
            res.send({
                "status" : COMMONCONSTANTS.ERROR,
                "message" : err,
                "blockheight" : blockheight
            })
        })
    }
})

app.use((req,res) => {
    res.send({
        "status" : COMMONCONSTANTS.ERROR,
        "message" : "invalid url. refer README.md for endpoint details"
    })
});

let server = app.listen(COMMONCONSTANTS.PORT,()=>{
    console.log("server started at port ",server.address().port);
})