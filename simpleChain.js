const SHA256 = require("crypto-js/sha256")
const db = require("./levelSandbox");

class Block{
  constructor(data){
    this.hash = "";
    this.height = 0;
    this.body = data;
    this.time = 0;
    this.previousBlockhash= "";
  }
}

class Blockchain{
	  constructor(){
    	
    }
   async genesisBlock(genesisBlock){
    let chainLength = await db.getBlockChainLength();
    console.log("genesisblock chainLength ",chainLength)
    if(chainLength === 0){
      
      this.addBlock(genesisBlock);
    }
    else{
      console.log("genesis block already exists")
    }
   }
    
    async addBlock(newBlock){
        
        let chainLength = await db.getBlockChainLength();
        newBlock.height = chainLength;
        newBlock.time = new Date().getTime().toString().slice(0,-3);
        if(chainLength >0){
             let previousBlock = await db.getLevelDBData(chainLength - 1);
             newBlock.previousBlockhash = previousBlock.hash;
        }
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        console.log("newBlock ",newBlock)
        db.addLevelDBData(chainLength,JSON.stringify(newBlock))
        return newBlock;
    }
    
  

    // Get block height
    async getBlockHeight(){
      const chainLength = await db.getBlockChainLength();
      console.log("chainLength ",chainLength)
      return chainLength-1;
    }

    // get block
     async getBlock(blockHeight){
      // return object as a single string
        let block = await db.getBlockUsingHeight(blockHeight);
        console.log("1block ",block)
        return block; 
    }

    // validate block
    async validateBlock(blockHeight){
      console.log("in validateBlock()")
      
      // get block object
      let block = await db.getBlockUsingHeight(blockHeight);
      // get block hash
      let blockHash = block.hash;
      // remove block hash to test block integrity
      block.hash = '';
      // generate block hash
      let validBlockHash = SHA256(JSON.stringify(block)).toString();
      // Compare
      if (blockHash===validBlockHash) {
        console.log("valid block")
          return true;
        } else {
          console.log("invalid block")
          console.log(' vBlock #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
          return false;
        }
    }

    // Validate blockchain
    async validateChain(){
      let errorLog = [];
      const chainLength = await db.getBlockChainLength();
      console.log("chainLength ",chainLength)
      for (var i = 0; i < chainLength-1; i++) {
        // validate block
        if (! await this.validateBlock(i))errorLog.push(i);
        // compare blocks hash link
        let chain_i = await db.getLevelDBData(i);
        console.log("chain_i ",chain_i," == ",i)
        let blockHash = chain_i.hash;
        let chain_ip1 = await db.getLevelDBData(i+1);
        console.log("chain_ip1 ",chain_ip1," == ",i+1)
        let previousHash = chain_ip1.previousBlockhash;
        if (blockHash!==previousHash) {
          errorLog.push(i);
        }
      }
      if (errorLog.length>0) {
        console.log('Block errors = ' + errorLog.length);
        console.log('Blocks: '+errorLog);
      } else {
        console.log('No errors detected');
      }
    }

}

var genesisBlock = () => {
  console.log("in genesisBlock()")
  const blockchain = new Blockchain()
  
  blockchain.genesisBlock(new Block("first block"));
}

genesisBlock();

module.exports = {Blockchain,Block};