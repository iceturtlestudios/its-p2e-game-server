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

//DB
const mDB = require("./engine/mmysql");
const EC = require("./engine/_core");
let CORE = new EC.Core();

//timing dt
let FAST_lastUpdate = Date.now();
let MEDIUM_lastUpdate = Date.now();
let SLOW_lastUpdate = Date.now();
let SAMPLE_ProcTime = 0;
let STATS = "";

let TCOUNTER_MAX = 20;//Round Time
let TCOUNTER = 20;//Countdown

app.use(express.static('public'))

//TODO Use CACHE (Future)
//const redis_client = REDIS.createClient({ url: process.env.REDIS });
//redis_client.on('error', (err) => console.log('Redis Client Error', err));
//***********************************************************************************************************************
//***********************************************************************************************************************
async function Init(){
    NT1.setInterval(Process_1_Seconds, '', '1s');//seconds
    NT15.setInterval(Process_10_Seconds, '', '10s');//seconds
    NTFAST.setInterval(ProcessFAST, '', '100m');;//Normally 100m (10 times a second)

    //REDIS (OPTIONAL)
    //await redis_client.connect();

    //MYSQL DB (OPTIONAL)
    //await mDB.Init();

    console.log("[Server] Starting");
}
//***********************************************************************************************************************
//***********************************************************************************************************************
async function Process_1_Seconds() {
    let now = Date.now(); let dt = now - MEDIUM_lastUpdate; MEDIUM_lastUpdate = now; dt = dt / 1000;//to ms
    CORE.Process(STATS, dt);
    let info = CORE.RM.Info();

    let min = Math.floor(TCOUNTER / 60);
    let sec = TCOUNTER - (min * 60);
    STATS = "ROUND TIMER: " + min + ":" + sec;
    STATS = STATS + " | BANK: " + CORE.BANK;
    STATS = STATS + " | PLAYERS: " + info.players
    STATS = STATS + " | NPCS: " + info.npc
    STATS = STATS + " | FOOD: " + info.food
    STATS = STATS + " | GOLD: " + info.gold
    STATS = STATS + " | GEMS: " + info.gem

    TCOUNTER--;
    if(TCOUNTER <= 0){
        console.log("Process WINNER!!!!")
        TCOUNTER = TCOUNTER_MAX
    }
}
//***********************************************************************************************************************
//***********************************************************************************************************************
async function Process_10_Seconds() {
    let now = Date.now(); let dt = now - SLOW_lastUpdate; SLOW_lastUpdate = now; dt = dt / 1000;//to ms

    console.log("---------------------------------------------------------------------------");
    console.log(STATS);
    //console.log(STATS + " SendPerSec: " + (CORE.SENDS / 10));
    //console.log(CORE.STATS); CORE.SENDS = 0;
    //console.log("SampleProc: " + SAMPLE_ProcTime);
    console.log("---------------------------------------------------------------------------");
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

