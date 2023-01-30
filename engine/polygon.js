const ethers = require('ethers');
const Web3 = require('web3')
//WONT WORK - import { ACM } from "./alchemy.mjs";
//const AAC = require("./alchemy.mjs");
//const Decimal = require('decimal')
//const WEI = 1000000000000000000
//const ethToWei = (amount) => new Decimal(amount).times(WEI)
require('dotenv').config()//console.log(process.env)

//**********************************************************************************************************************************
//**********************************************************************************************************************************
class CryptoPolygon {
    constructor() {
        this.networkEndpoint = 'https://polygon-rpc.com/';
        this.provider = new ethers.providers.JsonRpcProvider(this.networkEndpoint);
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    async Init(){
        console.log("******************************************************************************************");
        console.log("******************************************************************************************");
        console.log("SERVER_WALLET: " + process.env.SERVER_PUB_KEY);
        console.log("SERVER BALANCE (BANK): " + await this.ServerBalance());
        if(process.env.SEND_POLYGON_ACTIVE === "TRUE"){
            console.log("SEND POLYGON is ACTIVE (Will Send to players and owners)");
        } else { console.log("SEND POLYGON is NOT ACTIVE (No sending out yet - TEST MODE)"); }
        console.log("******************************************************************************************");
        console.log("OWNER_WALLET: " + process.env.OWNER_PUB_KEY);
        console.log("OWNER_PERCENT: " + process.env.OWNER_PUB_KEY_PERCENT + " (%) (Your Share)");
        console.log("ITS_TIP_WALLET: " + process.env.ITS_TIP_PUB_KEY);
        console.log("ITS_PUB_KEY_PERCENT: " + process.env.ITS_PUB_KEY_PERCENT + " (%) (Ice Turtle Studios)");
        console.log("******************************************************************************************");
        console.log("GAME ROUND TIME (SECONDS): " + process.env.ROUND_TIME_SECONDS);
        console.log("GAME PAYMENT MIN REQUIREMENT (POLYGON): " + process.env.GAME_PAYMENT);
        console.log("GAME PAYMENT CREDITS/LIVES: " + process.env.GAME_PAYMENT_LIVES);
        console.log("GAME PAYOUT: " + process.env.GAME_PAYOUT);
        console.log("******************************************************************************************");
        console.log("******************************************************************************************");

        //this.watchEtherTransfers();
//        await global.mACM.Init();
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    async getGasPrice() {
        let mul = 1.1;
        const price = await this.provider.getGasPrice();
        const str = ethers.utils.formatEther(price);
        const eth = str * mul;
        return ethers.utils.parseEther(eth.toFixed(18));
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    async ServerBalance(){
        let w = process.env.SERVER_PUB_KEY;
        //let wallet = new ethers.Wallet(w, this.provider);
        let balance = await this.provider.getBalance(process.env.SERVER_PUB_KEY)
        balance = ethers.utils.formatEther(balance)
        return  parseFloat(balance)
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    async Send (amount, target_wallet, active=0){

        //Requires String of value
        amount = amount.toString();

        // Create a wallet instance
        let private_wallet_key = process.env.SERVER_PRIVATE_KEY
        let wallet = new ethers.Wallet(private_wallet_key, this.provider);

        // Check balance FIRST
        let balance = await this.provider.getBalance(wallet.address)
        // convert a currency unit from wei to matic
        balance = ethers.utils.formatEther(balance)

        if(parseFloat(balance) < parseFloat(amount)) {
            console.log('Not enough balance!');
            return false;
        } else {
            // Create a transaction object
            let GAS = await this.getGasPrice();
            console.log("GAS_PRICE: " + GAS);
            console.log(ethers.utils.formatEther(GAS));
            console.log("AMT: " + amount);
            console.log("ACTIVE: " + process.env.SEND_POLYGON_ACTIVE);
            if(process.env.SEND_POLYGON_ACTIVE === "TRUE"){
                let tx = {
                    to: target_wallet,
                    // Convert currency unit from ether to wei
                    value: ethers.utils.parseEther(amount), //gasPrice: 35000000000
                    gasPrice: GAS
                }
                // Send a transaction
                const txObj = await wallet.sendTransaction(tx)
                console.log('txHash', txObj.hash);
            }
            else {
                console.log("SENDING IS NOT ACTIVE - NOT SENT!")
            }
            return true;
        }
    }

}
exports.CryptoPolygon = CryptoPolygon;

