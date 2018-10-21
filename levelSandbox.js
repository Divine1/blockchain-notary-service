/* ===== Persist data with LevelDB ==================
|  Learn more: level: https://github.com/Level/level |
/===================================================*/

let level = require('level');
let chainDB = './chaindata';
let db = level(chainDB);

const {getStoryASCIIData} = require("./utility");

// Add data to levelDB with key/value pair
const addLevelDBData =  (key,value) =>{
  db.put(key, value, function(err) {
    if (err) return console.log('Block ' + key + ' submission failed', err);
  })
};

const insertAddress =(address,addressObject)=>{
    console.log("in levelSandbox insertAddress addressObject ",addressObject)
    return new Promise(function(resolve,reject){
        db.put(address, addressObject, function (err) {
            if (err){ 
                console.log('Ooops!', err);
                resolve({"error" : "insertAddress error exists", "message" : err})
            }
            else{
                resolve({"error" : ""})
            }
            console.log("addressObject inserted")
        })
    })
};

const getAddress = (address) =>{
    const ERROR_ADDRESS_NOT_EXISTS = "ADDRESS NOT EXISTS";
    console.log("in levelSandbox getAddress address ",address)
    return new Promise(function(resolve,reject){
        db.get(address, function (err, value) {
            if (err) {
                console.log('Ooops!', err) // likely the key was not found
                resolve({"error" : ERROR_ADDRESS_NOT_EXISTS, "message" : err})
            }
            else{
                
                console.log('addressObject = ' , JSON.parse(value))
                resolve({
                    "error" : "",
                    "response" : JSON.parse(value)
                })
            }
        })
    })
}

const deleteAddress = (address) =>{
    console.log("in levelSandbox deleteAddress address ",address)
    return new Promise(function(resolve,reject){
        db.del(address, function (err) {
            if (err){
                console.log('Ooops!', err) // likely the key was not found
                resolve({"error" : "deleteAddress error while deleting", "message" : err})
            }
            else{
                resolve({"error" : ""});
            }
            
        });
    })
};

// Get data from levelDB with key
 const getLevelDBData = (key)=>{
     console.log("in getLevelDBData()")
    return new Promise(function(resolve,reject){
        db.get(key, function(err, value) {
            if (err) {
                console.log('Not found!', err);
                reject(err);
            }
            //console.log(key, " == " ,value);
            var myvalue = JSON.parse(value);
            //console.log("myvalue ",myvalue.hash);
            resolve(myvalue);
        }) 
    });
};

//https://github.com/Level/level#put

// Add data to levelDB with value
 const addDataToLevelDB = (value) =>{
    let i = 0;
    db.createReadStream().on('data', function(data) {
          i++;
        }).on('error', function(err) {
            return console.log('Unable to read data stream!', err)
        }).on('close', function() {
         // console.log('Block #' + i);
          //console.log("value ",value)
          addLevelDBData(i, value);
        });
};

const getBlockChainLength = ()=>{
    return new Promise(function(resolve,reject){
        var length = 0;
        db.createReadStream({ keys: true, values: true }).on('data', function(data) {
           // console.log("data ",data);
           let dataJson = JSON.parse(data.value);
           if(dataJson.hasOwnProperty("previousBlockhash")){
            length++;
           }
            
        }).on('error', function(err) {
            //console.log('Unable to read data stream!', err)
            reject(err)
        }).on('close', function() {
            console.log("getBlockChainLength ",length);
            resolve(length);
        });
    });
};

var printAllBlocks =  ()=>{
    return new Promise(function(resolve,reject){
        console.log("in printAllBlocks()")
        let allBlockData = null;
        db.createReadStream({ keys: true, values: true }).on('data', function(data) {
            console.log("data ",data);
            //allBlockData = data;
            //console.log("70",allBlockData);
            //data.value.body.address
        }).on('error', function(err) {
            //console.log('Unable to read data stream!', err)
            reject(err)
        }).on('close', function() {
            resolve(allBlockData);
        });
    });
};

var getBlocksWithAddress =  (address)=>{
    return new Promise(function(resolve,reject){
        console.log("in getBlocksWithAddress() address ",address)
        let allBlockData = [];
        db.createReadStream({ keys: true, values: true }).on('data', function(data) {
            let dataJson = JSON.parse(data.value);
            if(dataJson.hasOwnProperty("body") && dataJson.body.hasOwnProperty("address")){
                if(address == dataJson.body.address){
                    if(typeof dataJson.body == "string"){

                    }
                    else{
                        let story = dataJson.body.star.story;
                        let storyASCII = getStoryASCIIData(story);
                        dataJson.body.star.storyDecoded = storyASCII;
                    }
                    allBlockData.push(dataJson);
                }
            }
        }).on('error', function(err) {
            reject(err)
        }).on('close', function() {
            resolve(allBlockData);
        });
    });
};

var getBlocksWithHash =  (hash)=>{
    return new Promise(function(resolve,reject){
        console.log("in getBlocksWithHash() hash ",hash)
        let allBlockData = {};
        db.createReadStream({ keys: true, values: true }).on('data', function(data) {
            let dataJson = JSON.parse(data.value);
            if(dataJson.hasOwnProperty("hash")){
                if(hash == dataJson.hash){
                    if(typeof dataJson.body == "string"){

                    }
                    else{
                        let story = dataJson.body.star.story;
                        let storyASCII = getStoryASCIIData(story);
                        dataJson.body.star.storyDecoded = storyASCII;
                    }
                    allBlockData = dataJson;
                }
            }
        }).on('error', function(err) {
            reject(err)
        }).on('close', function() {
            resolve(allBlockData);
        });
    });
};

//input blockheight
var getBlockUsingHeight = (blockheight)=>{
    return new Promise(function(resolve,reject){
        console.log("in getBlock(blockheight)")
        var exactBlock = null;
        db.createReadStream({ keys: true, values: true }).on('data', function(data) {
           // console.log("data ",data);
            var myvalue = JSON.parse(data.value);
            console.log("194-myvalue ", myvalue);

            // if(myvalue.body.hasOwnProperty("story")){
            //     let story = myvalue.body.story;
            //     let storyASCII = getStoryASCIIData(story);
            //     myvalue.body.storyDecoded = storyASCII;
            // }
           

            if(blockheight == myvalue.height){
                console.log("204-myvalue ", myvalue);
                if(typeof myvalue.body == "string"){

                }
                else{
                    let story = myvalue.body.star.story;
                    let storyASCII = getStoryASCIIData(story);
                    myvalue.body.star.storyDecoded = storyASCII;
                }
                exactBlock = myvalue;
                return;
            }
        }).on('error', function(err) {
            //console.log('Unable to read data stream!', err)
            reject(err)
        }).on('close', function() {
            console.log("exactBlock ",exactBlock)

            resolve(exactBlock)
        });
    });
};

module.exports = {addLevelDBData,getLevelDBData,addDataToLevelDB,getBlockChainLength,getBlockUsingHeight,printAllBlocks,
    getBlocksWithAddress,getBlocksWithHash,
    insertAddress,getAddress,deleteAddress};