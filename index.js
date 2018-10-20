const express = require("express");
const app = express();
const simplechain = require("./simpleChain");
const db = require("./levelSandbox");
const bodyParser = require("body-parser");
const url = require('url');
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const PORT = 8000;
const ERROR = "ERROR";
const ERROR_ADDRESS_NOT_EXISTS = "ADDRESS NOT EXISTS";
const ERROR_VALIDATION_WINDOW_EXPIRED = "ERROR VALIDATION WINDOWEXPIRED";

app.get("/print",(req,res)=>{
    console.log("in /print")
    db.printAllBlocks().then();
    res.send({"data":"see logs"})
})

app.get("/block/:blockheight", (req,res)=>{
    var blockheight = req.params.blockheight;
    console.log("blockheight ",blockheight)
    const blockchain = new simplechain.Blockchain();
    if(blockheight ==null){
        res.send({
            "status" : ERROR,
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
                "status" : ERROR,
                "message" : err,
                "blockheight" : blockheight
            })
        })
    }
})

var validateStarObject = (body) =>{
    if(body.hasOwnProperty("star")){
        if(body.star.hasOwnProperty("dec") && 
        body.star.hasOwnProperty("ra") && 
        body.star.hasOwnProperty("story")){
            if(body.star.dec.length >10 && body.star.ra.length > 10 && body.star.story.length > 6){
                return true;
            }
        }
    }
    return false;
}
//http://localhost:8000/block
app.post("/block",(req,res)=>{
    console.log("/block post invoked");

    let address = req.body.address;

    if(validateStarObject(req.body)){

    let star = req.body.star;
    let dec = star.dec;
    let ra = star.ra;
    let story = star.story;
    let storyBuffer = Buffer.from(story, 'utf8').toString("hex");
    let requestTimeStamp = Date.now();
    let dataResponse = {
        hash : "",
        height : 0,
        body : {
            address : address,
            star : {
            ra : ra,
            dec : dec,
            story : storyBuffer
            }
        },
        time : "",
        previousBlockHash : ""
    };
    const blockchain = new simplechain.Blockchain();
    blockchain.getAddress(address).then((responseData)=>{
        console.log("77 ");
        console.log("responseData ",responseData.response.verify)
            if(responseData.response.verify){
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
                    res.send(dataResponse);
                }).catch((err) =>{
                    console.log("err ",err)
                    res.send({
                        "error" : ERROR,
                        "message" : err,
                        "body" : body,
                        "address" : address
                    })
                });
            }
            else{
                res.send({
                    "error" : "your message is not verified. kindly verify it",
                    "address" : address
                })
            }
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

var getValidationWindowTime = function(requestTimeStamp){
    console.log("in getValidationWindowTime() requestTimeStamp ",requestTimeStamp)
    const currentRequestTimeStamp = Date.now();
    let remainingSeconds = (currentRequestTimeStamp - requestTimeStamp)/1000;
    let calValidationWindow = 300 - Math.round(remainingSeconds);
    console.log("calValidationWindow ",calValidationWindow);

    if(calValidationWindow >=0){
        console.log("calValidationWindow ",calValidationWindow);
        return calValidationWindow;
    }
    else{
        console.log("ERROR_VALIDATION_WINDOW_EXPIRED ",ERROR_VALIDATION_WINDOW_EXPIRED );
        return ERROR_VALIDATION_WINDOW_EXPIRED;
    }
};

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

            if(userData.error == ERROR_ADDRESS_NOT_EXISTS){
                console.log(ERROR_ADDRESS_NOT_EXISTS);
                const currentRequestTimeStamp = Date.now();
                const starRegistry = "starRegistry";
                const message = address+":"+currentRequestTimeStamp+":"+starRegistry;
                const validationWindow = 300;
                const dataResponse = {
                    address,"requestTimeStamp" : currentRequestTimeStamp,message,validationWindow,
                    verify: false
                };
                //maintainState.push(dataResponse);
                blockchain.insertAddress(dataResponse).then();
                console.log("dataResponse ",dataResponse)
                res.send(dataResponse)
            }
            else{
                userData = userData.response;
                var calValidationWindow = getValidationWindowTime(userData.requestTimeStamp);
                if(calValidationWindow == ERROR_VALIDATION_WINDOW_EXPIRED){
                    //maintainState = maintainState.filter((value,key)=>(value.address != address));
                    blockchain.deleteAddress(address).then();
                    res.send({"error" : ERROR_VALIDATION_WINDOW_EXPIRED});
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
        if(userData == ERROR_ADDRESS_NOT_EXISTS){
            console.log(ERROR_ADDRESS_NOT_EXISTS);
            res.send({"error" : ERROR_ADDRESS_NOT_EXISTS});
        }
        else{
            userData = userData.response;
            let message = userData.message;
            console.log(bitcoinMessage.verify(message, address, signature));
            if(bitcoinMessage.verify(message, address, signature))
             {
                var calValidationWindow = getValidationWindowTime(userData.requestTimeStamp);
                if(calValidationWindow == ERROR_VALIDATION_WINDOW_EXPIRED){
                    blockchain.deleteAddress(address).then();
                    res.send({"error" : ERROR_VALIDATION_WINDOW_EXPIRED});
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
                    blockchain.deleteAddress(address).then(()=>{
                        responseData.response.verify=true;
                        console.log("deleteAddress success ", responseData)
                        blockchain.insertAddress(responseData.response).then(()=>{
                            //console.log("deleteAddress success ", responseData)
                            res.send(dataResponse);
                        }).catch((err)=>{
                            res.send({"errorEndpoint" : "in /message-signature/validate endpoint",
                            "error" : "insert address : "+JSON.stringify(err),
                            "address":address}); 
                        });;
                    }).catch((err)=>{
                        res.send({"errorEndpoint" : "in /message-signature/validate endpoint",
                        "error" : "delete address : "+JSON.stringify(err),
                        "address":address}); 
                    });
                }
             }
             else{
                 res.send({"error" : "invalid address/signature","address":address});
             }
        }
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

app.use((req,res) => {
    res.send({
        "status" : ERROR,
        "message" : "invalid url. refer README.md for endpoint details"
    })
});

app.listen(PORT,()=>{
    console.log("server started at port ",PORT);
})