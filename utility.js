const simplechain = require("./simpleChain");

const COMMONCONSTANTS = {
    VALIDATED : "validated",
    NOTVALIDATED : "notvalidated",
    USED : "used",
    PORT : 8000,
    ERROR : "ERROR",
    ERROR_ADDRESS_NOT_EXISTS : "ADDRESS NOT EXISTS",
    ERROR_VALIDATION_WINDOW_EXPIRED : "ERROR VALIDATION WINDOWEXPIRED",
    FROM_BLOCK : "FROM_BLOCK",
    FROM_MESSAGE_VALIDATE : "FROM_MESSAGE_VALIDATE"
};

const getBinarySize = (data) => {
    return Buffer.byteLength(data, 'utf8');
};

const validateStarObject = (body) =>{
    if(body.hasOwnProperty("star")){
        if(body.star.hasOwnProperty("dec") && 
        body.star.hasOwnProperty("ra") && 
        body.star.hasOwnProperty("story")){
            if(body.star.dec.length > 2 && 
                body.star.ra.length > 2 && 
                (getBinarySize(body.star.story) > 2 && getBinarySize(body.star.story) <= 500)){
                return true;
            }
        }
    }
    return false;
};

const getStoryHexData = (storyASCII)=>{
    const storyHex = Buffer.from(storyASCII, 'utf8').toString("hex");
    return storyHex;
};

const getStoryASCIIData = (storyHex)=>{
    const storyBuffer = new Buffer(storyHex, 'hex');
    const storyAscii = storyBuffer.toString("utf8");
    return storyAscii;
};

const getValidationWindowTime = function(requestTimeStamp){
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

const createSignatureObject = (signature,response,signatureStatus)=>{
    console.log("in createSignatureObject() start")
    let signArray = [];
    let signJson = {};
    signJson.signature = signature;
    signJson.blockdataUsageStatus = signatureStatus;

    if(response.hasOwnProperty("signatureDetails")){
        signArray = response.signatureDetails;
        signArray.push(signJson);
        console.log("in if");
    }
    else{
        signArray.push(signJson);
        console.log("in else");
    }
    console.log("in createSignatureObject() end signArray ",signArray)
    return signArray;
};

const updateAddressObject = (address,signature,responseData,dataResponse,res,signatureStatus,action)=>{
    console.log("in updateAddressObject() responseData ",responseData)
    console.log("action ",action)
    const blockchain = new simplechain.Blockchain();

    blockchain.deleteAddress(address).then((da)=>{
        //responseData.response.signatureDetails = createSignatureObject(signature,responseData.response,signatureStatus);
        console.log("deleteAddress success. new address data: ", responseData)
        blockchain.insertAddress(responseData.response).then(()=>{
            console.log("in insertaddress")
            
        }).catch((err)=>{
            res.send({
                "error" : action+" - insert address : "+JSON.stringify(err),
                "address":address
            }); 
        });;
    }).catch((err)=>{
        console.log("100 err ",err)
        res.send({
            "error" : action+" - delete address : "+JSON.stringify(err),
            "address":address
        }); 
    });
};

module.exports = {
    validateStarObject,
    getStoryHexData,
    getStoryASCIIData,
    COMMONCONSTANTS,
    getValidationWindowTime,
    updateAddressObject
};
