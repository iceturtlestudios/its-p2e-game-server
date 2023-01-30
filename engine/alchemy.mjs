// Installation: npm install alchemy-sdk
import { Alchemy, Network, AlchemySubscription, Utils } from "alchemy-sdk";
import * as dotenv from 'dotenv'
import ethers from "ethers"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
//require('dotenv').config()//console.log(process.env)

const settings = {
    apiKey: process.env.ALCHEMY_KEY, // Replace with your Alchemy API Key
    network: Network.MATIC_MAINNET, // Replace with your network
};
const alchemy = new Alchemy(settings);
//**********************************************************************************************************************************
//**********************************************************************************************************************************
export class ACM {
    constructor() {
        this.isInit = false;
        this.CORE = null;
        this.Pending = {};
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    async Init(CORE){
        this.CORE = CORE;
        let theCORE = CORE;//ref
        //Only Once Allowed
        if(this.isInit === false){
            // Subscription for Alchemy's pendingTransactions API
            console.log("ALCHEMY_KEY: " + process.env.ALCHEMY_KEY)
            console.log("SUBSCRIBING (ALCHEMY) To: " + process.env.SERVER_PUB_KEY);

            alchemy.ws.on({ method: AlchemySubscription.MINED_TRANSACTIONS,
                    addresses: [ { to: process.env.SERVER_PUB_KEY }]
                },
                (tx) => {
                    //console.log(tx);//DEBUG
                    let tx_value = parseFloat(Utils.formatEther(tx.transaction.value));//To float
                    let from = tx.transaction.from;

                    //Check Status
                    alchemy.core.getTransactionReceipt(tx.transaction.hash).then((tx) => {
                        //console.log(tx)//DEBUG
                        if (!tx) {
                            console.log("Pending or Unknown Transaction");
                        } else if (tx.status === 1) {
                            console.log("Transaction was successful!");
                            if(theCORE){
                                theCORE.GotPayment(from, tx_value);
                            }
                            else {console.log("NO CORE: " + from + " " + tx_value); }

                        } else {
                            console.log("Transaction failed!");
                        }
                    });
                    ///setTimeout(()=>{
                    ///},10000);
                }
            );
            this.isInit = true;
        }
    }
}
