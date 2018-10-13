/* ===== Persist data with LevelDB ==================
|  Learn more: level: https://github.com/Level/level |
/===================================================*/

let level = require('level');
let chainDB = './chaindata';
let db = level(chainDB);

// Add data to levelDB with key/value pair
const addLevelDBData =  (key,value) =>{
  db.put(key, value, function(err) {
    if (err) return console.log('Block ' + key + ' submission failed', err);
  })
};

// Get data from levelDB with key
 const getLevelDBData = (key)=>{
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
            length++;
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
            //onsole.log("data ",data);
            //allBlockData = data;
            //console.log("70",allBlockData);
            data.value.body.address
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
//printAllBlocks().then(()=>console.log(""))

//input blockheight
var getBlockUsingHeight = (blockheight)=>{
    return new Promise(function(resolve,reject){
        console.log("in getBlock(blockheight)")
        var exactBlock = null;
        db.createReadStream({ keys: true, values: true }).on('data', function(data) {
           // console.log("data ",data);
            var myvalue = JSON.parse(data.value);
            if(blockheight == myvalue.height){
                exactBlock = myvalue;
                return;
            }
        }).on('error', function(err) {
            //console.log('Unable to read data stream!', err)
            reject(err)
        }).on('close', function() {
            //console.log("exactBlock ",exactBlock)
            resolve(exactBlock)
        });
    });
};

module.exports = {addLevelDBData,getLevelDBData,addDataToLevelDB,getBlockChainLength,getBlockUsingHeight,printAllBlocks,
    getBlocksWithAddress,getBlocksWithHash};