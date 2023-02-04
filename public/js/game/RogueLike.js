// Like Roguelike Unity https://www.youtube.com/watch?v=Fdcnt2-Jf4w
let XOffset = 0;
let YOffset = 0;
let ZoomView = 1;//1;
let MAP_WIDTH = 32;
let MAP_HEIGHT = 32;
let RL_MAP = null;
let RogueCanvas = null;
let RogueContext = null;

//Loading Graphics (Load first)
let RogueLoadingImage = "img/Loading.png"; //default loading image
let RogueImageAppend = ""; //string to append to image name to force reloading
let RogueImageSources = {};
let RogueImages = {};
let RogueLoadedImages = 0;//Image PreLoad Tracking
let RogueNumImages = 0;

//NPCs here
let RID=0;//global increment id
//let RogueNPCs = {}

//TODO Track players and their locations here...etc
//let RoguePlayers = {}
let PlayerMove = -1;//Direct we want

//My Stats (or get from my player data later)
let RogueMyGold = 0;
let RogueMyGems = 0;
let RogueMyFood = 0;

let SERVER_UPDATE = null;
let WALLET = null;
let SERVER_WALLET = null;
let SERVER_PAYMENT = -1;
let INFO = "";
let EARNED = 0;

let PolygonProvider;// = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com/');
let PolygonSigner = null;
let StartPay = false;
 //****************************************************************************************************************
//****************************************************************************************************************
let RL_IMAGES ={
    tiles: "img/rogue_like.png",
    player_hl: "img/player_hl.png",
};
//****************************************************************************************************************
//****************************************************************************************************************

const RL_BlockingLayer = 0;
const RL_GroundLayer = 1;
const RL_FringeLayer = 2;
const RL_ItemsLayer = 3;
const RL_NPCLayer = 4;

function RogueRandInt(n) { return Math.floor(Math.random() * n); }
function RogueLerp(start, end, amt)  { return (1-amt)*start+amt*end }

//******************************************************************************************************************************
//TILEMAPS
//******************************************************************************************************************************
function RogueTM(w,h,v){ let m = []; for(let i=0;i < (w * h); i++ ){ m.push(v); } return m; }
function RogueTMSet(tm, layer, w, x, y, v){ tm[layer][(y * w) + x] = v; }
function RogueTMGet(tm, layer, w, x, y){ return tm[layer][(y * w) + x]; }
//****************************************************************************************************************
//Loads images, triggers callback when complete
//****************************************************************************************************************
function RogueLoadImages(images, Callback){
    let src;

    //Image Sources
    RogueImageSources = images
    let Sources = RogueImageSources;

    //Total Image count
    for (src in Sources){ RogueNumImages++; }

    //Trigger Loads
    for (src in Sources)
    {
        if(Sources.hasOwnProperty(src))
        {
            RogueImages[src] = new Image();
            RogueImages[src].onload = function(){
                RogueLoadedImages += 1;

                //trigger Callback function when last one is done
                if (RogueLoadedImages >= RogueNumImages) {
                    console.log("All Images Loaded: " + RogueLoadedImages);
                    Callback();//trigger callback
                }
                //console.log("Count: " + GFX_LoadedImages + "/" + RogueNumImages);
            };
            //Show any Load Errors in console
            RogueImages[src].onerror = function(){console.log("Error Image::" + this.src);};
            RogueImages[src].src = Sources[src];
            //console.log("Image::" + src);
        }
    }
}

//****************************************************************************************************************
//****************************************************************************************************************
function RogueLoader(canvas, images, Callback)
{
    //Save Main HTML5 Drawing Area
    RogueCanvas = document.getElementById(canvas);
    RogueContext = RogueCanvas.getContext('2d');
    RogueContext.imageSmoothingEnabled = false;//keep pixelated

    //First draw default loading Image then begin loading other images in the background
    var LoadingimageObj = new Image();
    LoadingimageObj.onload = function() {
        RogueContext.drawImage(LoadingimageObj, 0, 0);//draw directly

        //Other Images
        RogueLoadImages(images, Callback);

    };
    LoadingimageObj.src = RogueLoadingImage;//triggers onload after done
}
//****************************************************************************************************************
//****************************************************************************************************************
function HTML5Draw(){
    if(SERVER_UPDATE === null) { return; }
    RogueContext.clearRect(0, 0, 1024, 1024);
    let src = RogueImages["tiles"];
    let player_hl = RogueImages["player_hl"];
    let index, sx, sy, tx, ty;
    let STS = 32;
    let TS = 32 * ZoomView;
    let RL_MAP = SERVER_UPDATE.map;
    let RogueNPCs = SERVER_UPDATE.npcs;
    let RoguePlayers = SERVER_UPDATE.players;
    let PID = SERVER_UPDATE.pid;//my player id

    for(let x=0;x<MAP_WIDTH;x++) {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            //DrawTile(0, x, y, 'tile_set_', TS);
            //GFX_DrawImageAdvanced(RogueContext,src, sx * stc, sy * stc, stc, stc, tx, ty, ts, ts);
            //console.log(src);
            //tx = x * TS;
            //ty = y * TS;
            tx = (x - XOffset) * TS;
            ty = (y - YOffset) * TS;

            //ground
            index = RogueTMGet(RL_MAP.tm, RL_GroundLayer, RL_MAP.gw, x, y);
            sy = Math.floor(index / 32);
            sx = index - (sy * 32);
            RogueContext.drawImage(src, sx * STS,sy * STS,STS,STS,tx,ty,TS, TS);

            //items
            index = RogueTMGet(RL_MAP.tm, RL_ItemsLayer, RL_MAP.gw, x, y);
            if(index === 1){
                sy = Math.floor(34 / 32); sx = 34 - (sy * 32);
                RogueContext.drawImage(src, sx * STS,sy * STS,STS,STS,tx,ty,TS, TS);
            }
            if(index === 100){
                sy = Math.floor(33 / 32); sx = 33 - (sy * 32);
                RogueContext.drawImage(src, sx * STS,sy * STS,STS,STS,tx,ty,TS, TS);
            }
            if(index === 1000){
                sy = Math.floor(32 / 32); sx = 32 - (sy * 32);
                RogueContext.drawImage(src, sx * STS,sy * STS,STS,STS,tx,ty,TS, TS);
            }

            //players/npcs
            //index = RogueTMGet(RL_MAP.tm, RL_NPCLayer, RL_MAP.gw, x, y);
            //if(index === 1){
                //sy = Math.floor(35 / 32); sx = 35 - (sy * 32);
                //RogueContext.drawImage(src, sx * STS,sy * STS,STS,STS,tx,ty,TS, TS);
            //}
        }
    }

    //Draw NPCs
    for (let nid in RogueNPCs) {
        if (RogueNPCs.hasOwnProperty(nid)) {
            let tt = RogueNPCs[nid].type + 35;
            sy = Math.floor(tt / 32);
            sx = tt - (sy * 32);
            tx = (RogueNPCs[nid].x - XOffset) * TS;
            ty = (RogueNPCs[nid].y - YOffset) * TS;
            RogueContext.drawImage(src, sx * STS,sy * STS,STS,STS,tx,ty,TS, TS);
        }
    }

    //Draw Players
    for (let pid in RoguePlayers) {
        if (RoguePlayers.hasOwnProperty(pid)) {
            //player highlight
            if(PID.toString() === pid){
                tx = (RoguePlayers[pid].x - XOffset) * TS;
                ty = (RoguePlayers[pid].y - YOffset) * TS;
                RogueContext.drawImage(player_hl, 0,0,16,16,tx,ty,TS, TS);
            }
            sy = Math.floor(36 / 32); sx = 36 - (sy * 32);
            tx = (RoguePlayers[pid].x - XOffset) * TS;
            ty = (RoguePlayers[pid].y - YOffset) * TS;
            RogueContext.drawImage(src, sx * STS,sy * STS,STS,STS,tx,ty,TS, TS);
        }
    }

    //UI Info

    let pstat = "HP: " + SERVER_UPDATE.hp + " Score: " + SERVER_UPDATE.score +  " Credits: " + SERVER_UPDATE.credit;
    //In Canvas Info
    RogueContext.globalAlpha = 0.5;
    RogueContext.fillStyle = "#333333";
    RogueContext.fillRect(10, 10, 1024-20, 30);
    RogueContext.fillStyle = "#111111";
    RogueContext.strokeRect(10, 10, 1024-20, 30);

    RogueContext.globalAlpha = 1.0;
    RogueContext.fillStyle = "#FFFFFF";
    RogueContext.font = "bold 14px verdana, sans-serif ";
    //RogueContext.font = "20px Georgia";
    RogueContext.fillText(pstat, 20, 30);

    RogueContext.fillStyle = "#0ecb05";
    RogueContext.font = "bold 14px verdana, sans-serif ";
    //RogueContext.font = "20px Georgia";
    RogueContext.fillText("Paid: " + EARNED, 900, 30);
}
//****************************************************************************************************************
//****************************************************************************************************************
async function ConnectWallet(){

    if(window.ethereum && ethereum.isMetaMask){
        PolygonProvider = new ethers.providers.Web3Provider(window.ethereum, "any")
        PolygonProvider.on("network", (newNetwork, oldNetwork) => {
            if (oldNetwork) {
                window.location.reload();//Reload if we changed networks
            }
        });

        let net = await PolygonProvider.getNetwork();
        console.log(net.chainId);
        if(net.chainId === 137){
            //Only if Polygon
            $("#requirePolygon").hide();
            $("#connectButton").show();
        }
    }
}
//****************************************************************************************************************
//****************************************************************************************************************
function STARTUP(){

    SIO_READY()


    $(document).keydown(function(e){
        let key = e.keyCode;
//        if ( key === 37  ){ XOffset-=4;if(XOffset < 0){ XOffset = 0;} HTML5Draw(); }
//        else if (key === 38){ YOffset-=4;if(YOffset < 0){ YOffset = 0;} HTML5Draw(); }
//        else if (key === 39){ XOffset+=4; if(XOffset > MAP_WIDTH - 1){XOffset = MAP_WIDTH - 1;} HTML5Draw(); }
//        else if (key === 40){ YOffset+=4; if(YOffset > MAP_HEIGHT - 1){YOffset = MAP_HEIGHT - 1;} HTML5Draw(); }
        if ( key === 68  ){ PlayerMove = 0; }//d
        if ( key === 83  ){ PlayerMove = 2; }//s
        if ( key === 65  ){ PlayerMove = 1; }//a
        if ( key === 87  ){ PlayerMove = 3; }//w

    });

    RogueLoader("Canvas", RL_IMAGES, ()=>{
        console.log("READY!!");

        $("#b_spawn").click(function () {
            socket.emit('spawn');
        });
        $("#b_buy").click(function () {
            StartPayment();
        });

        //Zoom on wheel
        /*
        RogueCanvas.addEventListener('wheel',function(event){
            if(event.wheelDeltaY > 0){ ZoomView += 1;if(ZoomView > 4){ZoomView = 4;}}
            else {ZoomView -= 1;if(ZoomView < 1){ZoomView = 1;}}
            //console.log(ZoomView);
            HTML5Draw();
            event.preventDefault();
        }, false);
         */

        //HTML5Draw();

        setInterval(()=> { HTML5Draw(); }, 500);
        setInterval(()=> {
            socket.emit('input', PlayerMove); PlayerMove  =-1;
        }, 500);

        //RogueCanvas.addEventListener('mousemove', function(evt) { MouseMove(evt);}, false);
        //RogueCanvas.addEventListener('mousedown', function(evt) { MouseDown(evt);}, false);
        //RogueCanvas.addEventListener('mouseup', function(evt) { MouseUp(evt);}, false);
        //RogueCanvas.addEventListener('mouseout', function(evt) { MouseOut(evt);}, false);
        //RogueCanvas.addEventListener('wheel',function(event){            event.preventDefault();        }, false);

    });
}
//****************************************************************************************************************
//****************************************************************************************************************
function SIO_READY(){

    let HOST = "http://127.0.0.1:3200/";
    if(location.host === "p2e-demo.iceturtlestudios.com:3200"){
        HOST = "http://p2e-demo.iceturtlestudios.com:3200/";
    }
    console.log(HOST)
    socket = io(HOST);

    socket.on("connect", () => {
        console.log(socket.id);
        //console.log("Connected " + WALLET);
        socket.emit('wallet', WALLET);
    });

    socket.on('update', (d) => {
        SERVER_UPDATE = d;

        //Only get this once
        if(SERVER_UPDATE.map){ HTML5Draw(); }
        console.log(d);


        //update info
        let wttrim = WALLET.substring(0, 5) + "..." + WALLET.substring(38)
        //$('#winfo').html("Wallet: " + wttrim);
        SERVER_WALLET = SERVER_UPDATE.info.server_wallet;
        SERVER_PAYMENT =  SERVER_UPDATE.info.pay_in;
        let ref = 'https://polygonscan.com/address/' + SERVER_UPDATE.info.server_wallet;
        delete SERVER_UPDATE.info.server_wallet;//clear it

        if(SERVER_UPDATE.info.last_winner === WALLET){
            EARNED += parseFloat(SERVER_UPDATE.info.payout);
        }
        delete SERVER_UPDATE.info.last_winner;//clear it

        $('#server_wallet').html('<a href="' + ref + '" target=_blank>' + ref + '</a>');
        $('#info').html("SERVER INFO: " + JSON.stringify(SERVER_UPDATE.info));
        let info2 = "<span style=\"color:dodgerblue;\">P2E DEMO </span> | ";
        info2 = info2 + '<span style="color:darkgreen;">BANK: ' + SERVER_UPDATE.info.bank + '</span> | ';
        if(SERVER_UPDATE.cooldown >= 0){
            info2 = info2 + '<span style="color:red;">SPAWN NOW (' + SERVER_UPDATE.cooldown + ')</span>';
        }
        else {
            info2 = info2 + '<span style="color:green;">PLAY NOW!</span>';
        }


        //info2 = info2 + " | SCORE: " + SERVER_UPDATE.score + " | ";
        //info2 = info2 + " CREDITS: " + SERVER_UPDATE.credit + " | ";
        info2 = info2 + " | " + wttrim;
        $('#info2').html(info2);

        //console.log('message: ' + JSON.stringify(d));
    });
    socket.on('buy', (msg) => {
        //ServerUpdate(d);
        //console.log('message: ' + msg);
        //$('#msg').html(msg);

    });
    socket.on('spawn', (msg) => { $('#msg').html(msg); });
}
//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------
async function getGasPrice() {
    let mul = 1.1;
    const price = await PolygonProvider.getGasPrice();
    const str = ethers.utils.formatEther(price);
    const eth = str * mul;
    return ethers.utils.parseEther(eth.toFixed(18));
}
//****************************************************************************************************************
//****************************************************************************************************************
async function StartPayment() {

    console.log(SERVER_WALLET + " " + SERVER_PAYMENT);
    if(SERVER_WALLET && SERVER_PAYMENT > 0 && StartPay === false){
        StartPay = true;//block multiple txns
        let GAS = await getGasPrice();
        console.log("GAS_PRICE: " + GAS);
        console.log(ethers.utils.formatEther(GAS));
        console.log("AMT: " + SERVER_PAYMENT);

        //let provider = new ethers.providers.Web3Provider(window.ethereum);
        //let signer = provider.getSigner();
        if(PolygonSigner){
            console.log("Sending Polygon")
            try {
                let tx_proc = {
                    to: SERVER_WALLET,
                    value: ethers.utils.parseEther(SERVER_PAYMENT),
                    gasPrice: GAS
                }
                let tx = await PolygonSigner.sendTransaction(tx_proc);
                await tx.wait();
                console.log(tx.hash);
                StartPay = false;//allow retry

            } catch(err) {
                console.log(err)
                //Message("Payment Failed or Cancelled.<br>May not have enough POLYGON");
                StartPay = false;//allow retry
            }
        }
        StartPay = false;//allow retry
    }
}
//****************************************************************************************************************
//****************************************************************************************************************
$(document).ready(function(){

    $("#connectButton").click(async function () {
        let accounts = await PolygonProvider.send("eth_requestAccounts", []);
        WALLET = accounts[0];
        console.log(WALLET);
        $("#main_div").hide();
        $("#game_div").show();

        //OK to Start - We have Wallet/Polygon
        STARTUP();

        PolygonSigner = PolygonProvider.getSigner()
        //console.log(PolygonSigner);
        //console.log(PolygonProvider);

    });


    ConnectWallet();
});
