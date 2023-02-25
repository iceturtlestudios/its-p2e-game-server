require('dotenv').config() //console.log(process.env)

const express = require('express')
const app = express()
//const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http, {cors: { origin: '*'}});

//const http = require('http');
//const SIO = require('socket.io');
const REDIS = require("redis");
const { v4: uuidv4 } = require('uuid');
const NanoTimer = require('nanotimer');
const NT1 = new NanoTimer();
const NT15 = new NanoTimer();
const NTFAST = new NanoTimer();

//DB if needed
//const mDB = require("./engine/mmysql");
//Redis if needed
//const redis_client = REDIS.createClient({ url: process.env.REDIS });
//redis_client.on('error', (err) => console.log('Redis Client Error', err));

const EC = require("./engine/_core");
let CORE = new EC.Core();

const EPC = require("./engine/polygon");
let PCM = new EPC.CryptoPolygon();

//timing dt
let FAST_lastUpdate = Date.now();
let MEDIUM_lastUpdate = Date.now();
let SLOW_lastUpdate = Date.now();
let SAMPLE_ProcTime = 0;
let STATS = {};

let ROUND_TIME = parseInt(process.env.ROUND_TIME_SECONDS);//Round Time (SECS)
let ROUND_COOLDOWN_SECONDS = parseInt(process.env.ROUND_COOLDOWN_SECONDS);
let TCOUNTER = ROUND_TIME;//Current Countdown (SECS)

app.use(express.static('public'))
//***********************************************************************************************************************
//Helper Class
//***********************************************************************************************************************
class SERVER {
    constructor() {
        this.ACM = null;
        this.CORE = null;
        console.log("new SERVER Created")
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    async Init(){ }
}
let MServer = new SERVER();
CORE.MServer = MServer;//Attach to CORE
MServer.CORE = CORE;//Attach as well
//***********************************************************************************************************************
//***********************************************************************************************************************
async function Init(){
    NT1.setInterval(Process_1_Seconds, '', '1s');//seconds
    NT15.setInterval(Process_30_Seconds, '', '30s');//seconds
    NTFAST.setInterval(ProcessFAST, '', '100m');;//Normally 100m (10 times a second)

    //Informational
    await PCM.Init();

    //Update Bank
    await Process_30_Seconds();

    //REDIS (OPTIONAL)
    //await redis_client.connect();

    //MYSQL DB (OPTIONAL)
    //await mDB.Init();
    //TEST SEND
    //await PCM.Send(0.10, process.env.ITS_TIP_PUB_KEY);
}
//***********************************************************************************************************************
//***********************************************************************************************************************
async function Process_1_Seconds() {
    let now = Date.now(); let dt = now - MEDIUM_lastUpdate; MEDIUM_lastUpdate = now; dt = dt / 1000;//to ms
    let cooldown = -1;
    if(TCOUNTER > (ROUND_TIME - ROUND_COOLDOWN_SECONDS)){
        cooldown = Math.abs((ROUND_TIME - ROUND_COOLDOWN_SECONDS) - TCOUNTER);
        //console.log("ON COOLDOWN - " + cooldown);
    }

    let info = CORE.RM.Info();
    info.bank = CORE.BANK;
    info.last_winner = CORE.LAST_WINNER;
    info.server_wallet = process.env.SERVER_PUB_KEY;
    info.payout = process.env.GAME_PAYOUT;
    info.pay_in = process.env.GAME_PAYMENT;
    let min = Math.floor(TCOUNTER / 60); let sec = TCOUNTER - (min * 60);
    info.timer = min + ":" + sec;
    CORE.Process(info, dt, cooldown);
    CORE.LAST_WINNER = null;//clear it

    TCOUNTER--;

    //END OF ROUND HERE
    if(TCOUNTER <= 0){
        TCOUNTER = ROUND_TIME;//do first so no other extra payouts sent
        console.log("Process WINNER!!!!")
        let winner_wallet = CORE.PM.FindWinner();
        CORE.PM.ResetScores();//Reset

        //This may cause delays to send transactions here due to "awaits"
        if(winner_wallet !== null){
            CORE.LAST_WINNER = winner_wallet;
            console.log(winner_wallet);
            console.log("SENDING PAYOUT: " + process.env.GAME_PAYOUT + " " + winner_wallet);
            await PCM.Send(process.env.GAME_PAYOUT, winner_wallet);
        }
        else {
            console.log("NO WINNER FOUND (0 Scores)");
        }

        //Owner and Tip Payouts (winner or not) - Only if greater than MIN here
        //Ideally keep at least a few Polygon for fees and players to earn against
        let BChk = (CORE.BANK > parseFloat(process.env.OWNER_MIN));
        console.log("CHECK BANK: " + CORE.BANK + " MIN: " + parseFloat(process.env.OWNER_MIN) + " TEST: " + BChk);

        if(CORE.BANK > parseFloat(process.env.OWNER_MIN)){
            let owner_amt = process.env.OWNER_PAYOUT;
            let its_tip_amt = process.env.ITS_TIP_PAYOUT;
            console.log("BANK: " + CORE.BANK + " OWNER PAY OUT: " + owner_amt + " ITS TIP OUT: " + its_tip_amt)

            //TODO - IMPORTANT - ENABLE THIS TO SEND OWNER/TIPS OUT
            if(process.env.SEND_OWNER_AND_TIPS === "TRUE") {
                console.log("SENDING OWNER: " + process.env.OWNER_PAYOUT + " " + process.env.OWNER_PUB_KEY);
                await PCM.Send(process.env.OWNER_PAYOUT, process.env.OWNER_PUB_KEY);

                //ITS TIP (Optional, but supports more game development and fixes, thx!!)
                console.log("SENDING TIP: " + process.env.ITS_TIP_PAYOUT + " " + process.env.ITS_TIP_PUB_KEY);
                await PCM.Send(process.env.ITS_TIP_PAYOUT, process.env.ITS_TIP_PUB_KEY);
            }

        }
        //Dont do any logic here due to "awaits"
    }
}
//***********************************************************************************************************************
//***********************************************************************************************************************
async function Process_30_Seconds() {
    let now = Date.now(); let dt = now - SLOW_lastUpdate; SLOW_lastUpdate = now; dt = dt / 1000;//to ms

    console.log("---------------------------------------------------------------------------");
    let info = CORE.RM.Info();
    info.bank = CORE.BANK;
    info.last_winner = CORE.LAST_WINNER;
    info.server_wallet = process.env.SERVER_PUB_KEY;
    info.payout = process.env.GAME_PAYOUT;
    console.log(JSON.stringify(info));
    console.log("---------------------------------------------------------------------------");

    //Update BANK Balance
//    CORE.BANK = Math.round((await PCM.ServerBalance() + Number.EPSILON) * 100) / 100;//Rounded down

    //Alchemy Instead (more accurate - Default RPC sometime gets 0 balance - BUG)
    if(MServer.ACM){
        CORE.BANK = Math.round((await MServer.ACM.ServerBalance() + Number.EPSILON) * 100) / 100;//Rounded down
        console.log("UPDATE BANK = " + CORE.BANK);
    }

}
//***********************************************************************************************************************
// FAST Game Processing (10 times a second usually)
//***********************************************************************************************************************
async function ProcessFAST(){
    let now = Date.now(); let dt = now - FAST_lastUpdate; FAST_lastUpdate = now; dt = dt / 1000;//to ms

    //console.time("core_process");//DEBUG
    //CORE.Process(dt);
    SAMPLE_ProcTime = (Date.now() - now) / 1000;
    //console.timeEnd("core_process");
}
//***********************************************************************************************************************
//***********************************************************************************************************************
io.on('connection', client => {

    //Connect client
    CORE.Connect(client);
    client.on('wallet', (data) => { try { CORE.Wallet(client, data); } catch (e) { console.log(e); } });
    client.on('buy', (data) => { try { CORE.BuyCredits(client, data); } catch (e) { console.log(e); } });
    client.on('spawn', (data) => { try { CORE.Spawn(client, data); } catch (e) { console.log(e); } });
    client.on('input', (data) => { try { CORE.Input(client, data); } catch (e) { console.log(e); } });
    client.on('disconnect', () => { try { CORE.DisConnect(client); } catch (e) { console.log(e); } });
});
//***********************************************************************************************************************
//***********************************************************************************************************************
http.listen(process.env.MY_PORT, function() {
    console.log('listening on *:' + process.env.MY_PORT);
    Init().then();
});

module.exports = MServer;