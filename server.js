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
    CORE.Process(dt);
}
//***********************************************************************************************************************
//***********************************************************************************************************************
async function Process_10_Seconds() {
    let now = Date.now(); let dt = now - SLOW_lastUpdate; SLOW_lastUpdate = now; dt = dt / 1000;//to ms

    STATS = "PLAYERS: " + CORE.GetPIDs().length;
    STATS = STATS + " GAMES: " + CORE.GetGIDs().length
    console.log("---------------------------------------------------------------------------");
    console.log(STATS + " SendPerSec: " + (CORE.SENDS / 10));
    console.log(CORE.STATS); CORE.SENDS = 0;
    console.log("SampleProc: " + SAMPLE_ProcTime);
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
//const HTTPServer = http.createServer((req, res) => {
    //res.statusCode = 200;
    //res.setHeader('Content-Type', 'text/plain');
    //res.end('P2E-Game-Server');
//});
//***********************************************************************************************************************
//***********************************************************************************************************************
//const io = new SIO.Server(HTTPServer, {
    //cors: { origin: '*'}

    //Example CORS
    //origin: ["https://localhost", "https://*.your_domain.com"], //methods: ["GET", "POST"],
    // allowedHeaders: ["my-custom-header"], //credentials: true
//});
//***********************************************************************************************************************
//***********************************************************************************************************************
io.on('connection', client => {

    //Connect client
    CORE.Connect(client);

    //Become a Server
    client.on('server', (data) => { CORE.API("server", client, data); });
    //Server Map Update
    client.on('server_map_update', (data) => { CORE.API("server_map_update", client, data); });
    //List Games
    client.on('games', (data) => { CORE.API("games", client, data); });
    client.on('register', async (data) => { await CORE.API("register", client, data); });
    client.on('login', async (data) => { await CORE.API("login", client, data); });
    client.on('join', (data) => { CORE.API("join", client, data); });
    client.on('input', (data) => { CORE.API("input", client, data); });
    client.on('leave', (data) => { CORE.API("leave", client, data); });
    client.on('disconnect', (data) => { CORE.API("disconnect", client, data); });
});
//***********************************************************************************************************************
//***********************************************************************************************************************
//HTTPServer.listen(process.env.MY_PORT, process.env.MY_HOST, () => {
    //console.log(`Server running at http://${process.env.MY_HOST}:${process.env.MY_PORT}/`);
    //Init().then();
//});

/*
app.get('/', function(req, res) {
    //res.sendfile('index.html');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('P2E-Game-Server');

});*/

http.listen(process.env.MY_PORT, function() {
    console.log('listening on *:' + process.env.MY_PORT);
    Init().then();
});