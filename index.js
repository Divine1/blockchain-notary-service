const express = require("express");
const app = express();
const simplechain = require("./simpleChain");
const db = require("./levelSandbox");
const bodyParser = require("body-parser");
const url = require('url');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const PORT = 8000;
const ERROR = "ERROR";
let maintainState=[];

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

//http://localhost:8000/block
app.post("/block",(req,res)=>{
    console.log("/block post invoked");
    let body = req.body.body;
    let address = req.body.address;
    console.log("body ",body);
    let star = req.body.star;
    let dec = star.dec;
    let ra = star.ra;
    let story = star.story;
    let storyBuffer = Buffer.from(story, 'utf8').toString("hex");
    let userData = maintainState.filter((value,key)=>(value.address == address));
    userData = userData[0];
    let dataResponse = {
        hash : "",
        height : 0,
        body : {
          address : userData.address,
          star : {
            ra : ra,
            dec : dec,
            story : storyBuffer
          }
        },
        time : "",
        previousBlockHash : ""
      };

    if(body == null){
        res.send({
            "status" : ERROR,
            "message" : "body is empty. Please send post request with body parameter"
        })
    }
    else{
        const block = new simplechain.Block()
        const blockchain = new simplechain.Blockchain();
        //block.body = body;

        block.body = dataResponse.body;

        blockchain.addBlock(block).then((data) =>{
            console.log("data ",data)
            dataResponse.hash = data.hash;
            dataResponse.height = data.height; 
            dataResponse.time = userData.requestTimeStamp;
            dataResponse.previousBlockHash = data.previousBlockhash;
            res.send(dataResponse);
        }).catch((err) =>{
            console.log("err ",err)
            res.send({
                "status" : ERROR,
                "message" : err,
                "body" : body,
                "address" : address
            })
        });
    }
});

// http://localhost:8000/requestValidation
app.post("/requestValidation",(req,res)=>{
    console.log("in /requestValidation post method");
    const address = req.body.address;
    const currentRequestTimeStamp = Date.now();
    const starRegistry = "starRegistry";
    const message = address+":"+currentRequestTimeStamp+":"+starRegistry;
    const validationWindow = 300;
    const dataResponse = {
        address,"requestTimeStamp" : currentRequestTimeStamp,message,validationWindow
    };
    console.log("before maintainState ",maintainState);
    maintainState.push(dataResponse);
    console.log("after maintainState ",maintainState);
    console.log("dataResponse ",dataResponse)
    res.send(dataResponse)
})

//http://localhost:8000/message-signature/validate
app.post("/message-signature/validate",(req,res)=>{
    console.log("in /message-signature/validate post method");

    const address = req.body.address;
    const signature = req.body.signature;
    const currentRequestTimeStamp = Date.now();
    console.log("req.body ",req.body)

    let userData = maintainState.filter((value,key)=>(value.address == address));
    if(userData.length ==1){
        userData = userData[0];
        let remainingSeconds = (currentRequestTimeStamp - userData.requestTimeStamp)/1000;
        let calValidationWindow = 300 - Math.round(remainingSeconds);
        if(calValidationWindow >=0){
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
            res.send(dataResponse);
        }
        else{
            res.send({"error" : "validationWindow expired","address" :address});
            maintainState = maintainState.filter((value,key)=>(value.address != address));
        }
    }
    else{
        res.send({"error" : "invalid address/signature","address":address});
    } 
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