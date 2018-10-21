const COMMONCONSTANTS = {
    VALIDATED : "validated",
    NOTVALIDATED : "notvalidated",
    USED : "used",
    PORT : 8000,
    ERROR : "ERROR",
    ERROR_ADDRESS_NOT_EXISTS : "ADDRESS NOT EXISTS",
    ERROR_VALIDATION_WINDOW_EXPIRED : "ERROR VALIDATION WINDOWEXPIRED"
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

module.exports = {
    validateStarObject,
    getStoryHexData,
    getStoryASCIIData,
    COMMONCONSTANTS,
    getValidationWindowTime
};
