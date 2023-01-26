// Like Roguelike Unity https://www.youtube.com/watch?v=Fdcnt2-Jf4w
let XOffset = 0;
let YOffset = 0;
let ZoomView = 2;//1;
let MAP_WIDTH = 64;
let MAP_HEIGHT = 64;
let RL_MAP = null;
let RogueCanvas = null;
let RogueContext = null;

//Loading Graphics (Load first)
let RogueLoadingImage = "img/gui/Loading.png"; //default loading image
let RogueImageAppend = ""; //string to append to image name to force reloading
let RogueImageSources = {};
let RogueImages = {};
let RogueLoadedImages = 0;//Image PreLoad Tracking
let RogueNumImages = 0;

//NPCs here
let RID=0;//global increment id
let RogueNPCs = {}

//TODO Track players and their locations here...etc
let RoguePlayers = {}
let PlayerMove = -1;//Direct we want

//My Stats (or get from my player data later)
let RogueMyGold = 0;
let RogueMyGems = 0;
let RogueMyFood = 0;

 //****************************************************************************************************************
//****************************************************************************************************************
let RL_IMAGES ={
    tiles: "img/rogue_like.png",
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
//******************************************************************************************************************************
// Map Cointains many tilemap layers
//******************************************************************************************************************************
function RogueMap(gw,gh,ts){
    let tm0 = RogueTM(gw,gh,0);//Blocking (0 = open, 1 = blocked)
    let tm1 = RogueTM(gw,gh,0);//Ground (any, block as needed based on value)
    let tm2 = RogueTM(gw,gh,0);//AutoFringe (for islands etc)
    let tm3 = RogueTM(gw,gh,0);//Items (Coins, Food, Armor, Weapons, Potions, etc)
    let tm4 = RogueTM(gw,gh,0);//NPCs here
    let w = gw * ts;//grid w/h * tilesize (actual pixel bounds)
    let h = gh * ts;
    let map = { tm:[tm0, tm1, tm2, tm3, tm4], gw:gw,gh:gh,w:w,h:h,ts:ts };
    return map;
}
//******************************************************************************************************************************
//TODO IMPROVE!!!
//******************************************************************************************************************************
function RogueMapGenerate(gw, gh, ts){
    let map = RogueMap(gw,gh,ts);

    let max_npc = 50;
    let count_npc = 0;
    let max_food = 10;//Low start amounts
    let count_food = 0;
    let max_gold = 10;//Low start amounts
    let count_gold = 0;
    let max_gem = 10;//Low start amounts
    let count_gem = 0;

    //Set Random (non edge)
    for (let x = 1; x < map.gw-1; x++) {
        for (let y = 1; y < map.gh-1; y++) {

            //ground is random (decorated flooring)
            // 0-15 are open ground
            // 16+ block for now (walls, rocks, ...)
            let g = RogueRandInt(19);
            RogueTMSet(map.tm, RL_GroundLayer, gw, x, y, g);

            //Blocking tiles 16+
            if(g > 15){
                RogueTMSet(map.tm, RL_BlockingLayer, gw, x, y, 1);
            }
            else { //open ground for items or npcs
                let rng = RogueRandInt(100);

                //only set one thing per location (small percentage of chance)
                //Food
                if(rng === 2){
                    if(count_food < max_food){
                        let food = 1;//RogueRandInt(15)+1;//TODO more food options here
                        RogueTMSet(map.tm, RL_ItemsLayer, gw, x, y, food);
                        count_food++
                    }
                }
                //Gold
                if(rng === 3){
                    if(count_gold < max_gold){
                        let gold = 100;
                        RogueTMSet(map.tm, RL_ItemsLayer, gw, x, y, gold);
                        count_gold++
                    }
                }
                //Gems (p2E)
                if(rng === 4){
                    if(count_gem < max_gem){
                        let gem = 1000;
                        RogueTMSet(map.tm, RL_ItemsLayer, gw, x, y, gem);
                        count_gem++
                    }
                }
                //NPC - up to max
                /*if(rng === 99){
                    if(count_npc < max_npc){
                        let npc = 1;//RogueRandInt(10);//TODO more monsters here
                        RogueTMSet(map.tm, RL_NPCLayer, gw, x, y, npc);
                        count_npc++
                    }
                }*/
            }
        }
    }

    //generate NPCs (Attempt)
    for(let i=0;i<max_npc;i++){ SpawnNPC(map); }

    return map;
}
//******************************************************************************************************************************
//******************************************************************************************************************************
function SpawnNPC(map){
    let x = RogueRandInt(MAP_WIDTH); let y = RogueRandInt(MAP_HEIGHT);
    if(RogueIsLocationOpen(map, x, y) === true){
        RID++;
        RogueNPCs[RID] = {hp:100, damage:1, x:x, y:y, remove:false};//simple tracking data
        //console.log(RogueNPCs[RID]);
    }
}
//******************************************************************************************************************************
//******************************************************************************************************************************
function SpawnPlayer(map){

    //Try until Open spot
    for(let i=0;i<50;i++){
        let x = RogueRandInt(MAP_WIDTH); let y = RogueRandInt(MAP_HEIGHT);
        if(RogueIsLocationOpen(map, x, y) === true){
            RID++;
            RoguePlayers[RID] = {hp:100, damage:1, x:x, y:y, remove:false};//simple tracking data
            console.log(RoguePlayers[RID]);
            return;
        }
    }
}
//******************************************************************************************************************************
//******************************************************************************************************************************
function RogueIsLocationOpen(map, x, y){
    if(RogueTMGet(map.tm, RL_GroundLayer, map.gw, x, y) <= 15){//open (not blocked)
        if(RogueTMGet(map.tm, RL_ItemsLayer, map.gw, x, y) === 0){//no items
            //if(RogueTMGet(map.tm, RL_NPCLayer, map.gw, x, y) === 0){//no npcs
            return true;
            //}
        }
    }
    return false;
}
//******************************************************************************************************************************
//******************************************************************************************************************************
function RogueIsMoveable(map, x, y){
    if(x < 0 || x >= MAP_WIDTH){return false;}//out of bounds
    if(y < 0 || y >= MAP_HEIGHT){return false;}
    if(RogueTMGet(map.tm, RL_GroundLayer, map.gw, x, y) <= 15){//open (not blocked)
        return true;
        //if(RogueTMGet(map.tm, RL_NPCLayer, map.gw, x, y) === 0){//no npcs
        //}
    }
    return false;
}
 //******************************************************************************************************************************
 //******************************************************************************************************************************
function MoveNPC(npc, x, y){
    npc.x = x; npc.y = y;
    //TODO do damage to player on touch
    for (let pid in RoguePlayers) {
        if (RoguePlayers.hasOwnProperty(pid)) {
            if(RoguePlayers[pid].x === x && RoguePlayers[pid].y === y){
                RoguePlayers[pid].hp -= npc.damage;
                //died (will need to respawn)
                if(RoguePlayers[pid].hp < 0){ RoguePlayers[pid].hp = 0; RoguePlayers[pid].remove = true; }
                //TODO show dead frame etc..
            }
        }
    }

}
 //******************************************************************************************************************************
 //******************************************************************************************************************************
 function MovePlayer(player, x, y){
     let map = RL_MAP;
     player.x = x; player.y = y;

     //TODO pickup food, item, gem
     if(RogueTMGet(map.tm, RL_ItemsLayer, map.gw, x, y) === 1){
         RogueMyFood++;
         RogueTMSet(map.tm, RL_ItemsLayer, map.gw, x, y, 0);//clear it
     }
     if(RogueTMGet(map.tm, RL_ItemsLayer, map.gw, x, y) === 100){
         RogueMyGold++;
         RogueTMSet(map.tm, RL_ItemsLayer, map.gw, x, y, 0);//clear it
     }
     if(RogueTMGet(map.tm, RL_ItemsLayer, map.gw, x, y) === 1000){
         RogueMyGems++;
         RogueTMSet(map.tm, RL_ItemsLayer, map.gw, x, y, 0);//clear it

         //TODO Trigger Payout (Crypto here - Server side only)
     }
     PlayerMove = -1;//clear
 }
//******************************************************************************************************************************
//******************************************************************************************************************************
function RogueMapProcess(){
    let map = RL_MAP;
    let max_npc = 50;
    let count_npc = 0;
    let max_food = 100;
    let count_food = 0;
    let max_gold = 50;//higher
    let count_gold = 0;
    let max_gem = 20;//rare
    let count_gem = 0;

    let x, y;

    //Random NPC Movement or Chase Players here
    for (let nid in RogueNPCs) {
        if (RogueNPCs.hasOwnProperty(nid)) {
            x = RogueNPCs[nid].x; y = RogueNPCs[nid].y;
            let ndir = RogueRandInt(4);
            if(ndir === 0){ if(RogueIsMoveable(map, x+1, y) === true){ MoveNPC(RogueNPCs[nid], x+1, y); } }
            if(ndir === 1){ if(RogueIsMoveable(map, x-1, y) === true){ MoveNPC(RogueNPCs[nid], x-1, y); } }
            if(ndir === 2){ if(RogueIsMoveable(map, x, y+1) === true){ MoveNPC(RogueNPCs[nid], x, y+1); } }
            if(ndir === 3){ if(RogueIsMoveable(map, x, y-1) === true){ MoveNPC(RogueNPCs[nid], x, y-1); } }
        }
    }

    //TODO - TEST AUTO MOVE - USE INPUTS INSTEAD (direction = 0-4)
    for (let pid in RoguePlayers) {
        if (RoguePlayers.hasOwnProperty(pid)) {
            x = RoguePlayers[pid].x; y = RoguePlayers[pid].y;

            //Automatic
            if(PlayerMove === -1){
                //let ndir = RogueRandInt(4);
                //if(ndir === 0){ if(RogueIsMoveable(map, x+1, y) === true){ MovePlayer(RoguePlayers[pid], x+1, y); } }
                //if(ndir === 1){ if(RogueIsMoveable(map, x-1, y) === true){ MovePlayer(RoguePlayers[pid], x-1, y); } }
                //if(ndir === 2){ if(RogueIsMoveable(map, x, y+1) === true){ MovePlayer(RoguePlayers[pid], x, y+1); } }
                //if(ndir === 3){ if(RogueIsMoveable(map, x, y-1) === true){ MovePlayer(RoguePlayers[pid], x, y-1); } }
            }
            else {//Input based
                if(PlayerMove === 0){ if(RogueIsMoveable(map, x+1, y) === true){ MovePlayer(RoguePlayers[pid], x+1, y); } }
                if(PlayerMove === 1){ if(RogueIsMoveable(map, x-1, y) === true){ MovePlayer(RoguePlayers[pid], x-1, y); } }
                if(PlayerMove === 2){ if(RogueIsMoveable(map, x, y+1) === true){ MovePlayer(RoguePlayers[pid], x, y+1); } }
                if(PlayerMove === 3){ if(RogueIsMoveable(map, x, y-1) === true){ MovePlayer(RoguePlayers[pid], x, y-1); } }
            }
        }
    }

    //Move Players
        //TODO Earn Pickups (gold, food, gems)
            //TODO Gems = Crypto Send Here

    //Count current
    for (x = 1; x < map.gw-1; x++) {
        for (y = 1; y < map.gh-1; y++) {
            if(RogueTMGet(map.tm, RL_ItemsLayer, map.gw, x, y) === 1){ count_food++; }
            if(RogueTMGet(map.tm, RL_ItemsLayer, map.gw, x, y) === 100){ count_gold++; }
            if(RogueTMGet(map.tm, RL_ItemsLayer, map.gw, x, y) === 1000){ count_gem++; }
            //if(RogueTMGet(map.tm, RL_NPCLayer, map.gw, x, y) === 1){ count_npc++; }

        }
    }
    count_npc = Object.keys(RogueNPCs).length;

    //info update
    let ss = "My Food/Gold/Gems: " + RogueMyFood + "/" + RogueMyGold + "/" + RogueMyGems;
    let m = ss + " Map Size: " + MAP_WIDTH + "x" + MAP_HEIGHT;
    $('#info').html(m + " Food: " + count_food + " " + "Gold: " + count_gold + " " + "Gems: " + count_gem + " " + "NPCs: " + count_npc);

    //Add more gold, gems, npcs, if < max
    if(count_food < max_food){
        x = RogueRandInt(MAP_WIDTH); y = RogueRandInt(MAP_HEIGHT);
        if(RogueIsLocationOpen(map, x, y) === true){
            let food = 1;//RogueRandInt(15)+1;//TODO more food options here
            RogueTMSet(map.tm, RL_ItemsLayer, map.gw, x, y, food);
        }
    }
    if(count_gold < max_gold){
        x = RogueRandInt(MAP_WIDTH); y = RogueRandInt(MAP_HEIGHT);
        if(RogueIsLocationOpen(map, x, y) === true){
            let gold = 100;
            RogueTMSet(map.tm, RL_ItemsLayer, map.gw, x, y, gold);
        }
    }
    if(count_gem < max_gem){
        x = RogueRandInt(MAP_WIDTH); y = RogueRandInt(MAP_HEIGHT);
        if(RogueIsLocationOpen(map, x, y) === true){
            let gem = 1000;
            RogueTMSet(map.tm, RL_ItemsLayer, map.gw, x, y, gem);
        }
    }

    //Spawn NPC (attempt)
    if(count_npc < max_npc){ SpawnNPC(map); }

    HTML5Draw();
    //console.log("PROCESS");

}
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
    RogueContext.clearRect(0, 0, 1024, 1024);
    let src = RogueImages["tiles"];
    let index, sx, sy, tx, ty;
    let STS = 16;
    let TS = 16 * ZoomView;

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
            sy = Math.floor(35 / 32); sx = 35 - (sy * 32);
            tx = (RogueNPCs[nid].x - XOffset) * TS;
            ty = (RogueNPCs[nid].y - YOffset) * TS;
            RogueContext.drawImage(src, sx * STS,sy * STS,STS,STS,tx,ty,TS, TS);
        }
    }

    //Draw Players
    for (let pid in RoguePlayers) {
        if (RoguePlayers.hasOwnProperty(pid)) {
            sy = Math.floor(36 / 32); sx = 36 - (sy * 32);
            tx = (RoguePlayers[pid].x - XOffset) * TS;
            ty = (RoguePlayers[pid].y - YOffset) * TS;
            RogueContext.drawImage(src, sx * STS,sy * STS,STS,STS,tx,ty,TS, TS);
        }
    }

}
//****************************************************************************************************************
//****************************************************************************************************************
$(document).ready(function(){

    SIO_READY()

    /*
    //Create Map Data
    RL_MAP = RogueMapGenerate(MAP_WIDTH, MAP_HEIGHT, 16);

    let i=0;
    //console.log(RL_MAP);
    //console.log(JSON.stringify(RL_MAP.tm[RL_GroundLayer]));
    //console.log(JSON.stringify(RL_MAP.tm[RL_BlockingLayer]));
    //console.log(JSON.stringify(RL_MAP.tm[RL_ItemsLayer]));
    //console.log(JSON.stringify(RL_MAP.tm[RL_NPCLayer]));


    $(document).keydown(function(e){
        let key = e.keyCode;
        if ( key === 37  ){ XOffset-=4;if(XOffset < 0){ XOffset = 0;} HTML5Draw(); }
        else if (key === 38){ YOffset-=4;if(YOffset < 0){ YOffset = 0;} HTML5Draw(); }
        else if (key === 39){ XOffset+=4; if(XOffset > MAP_WIDTH - 1){XOffset = MAP_WIDTH - 1;} HTML5Draw(); }
        else if (key === 40){ YOffset+=4; if(YOffset > MAP_HEIGHT - 1){YOffset = MAP_HEIGHT - 1;} HTML5Draw(); }
        if ( key === 68  ){ PlayerMove = 0; }//d
        if ( key === 83  ){ PlayerMove = 2; }//s
        if ( key === 65  ){ PlayerMove = 1; }//a
        if ( key === 87  ){ PlayerMove = 3; }//w

    });


    RogueLoader("Canvas", RL_IMAGES, ()=>{
        console.log("READY!!");

        $("#b_spawn").click(function () {

            //TEST Spawn
            SpawnPlayer(RL_MAP);

        });

        //Zoom on wheel
        RogueCanvas.addEventListener('wheel',function(event){
            if(event.wheelDeltaY > 0){ ZoomView += 1;if(ZoomView > 4){ZoomView = 4;}}
            else {ZoomView -= 1;if(ZoomView < 1){ZoomView = 1;}}
            //console.log(ZoomView);
            HTML5Draw();
            event.preventDefault();
        }, false);

        HTML5Draw();

        setInterval(()=> { RogueMapProcess(); }, 500);

        //RogueCanvas.addEventListener('mousemove', function(evt) { MouseMove(evt);}, false);
        //RogueCanvas.addEventListener('mousedown', function(evt) { MouseDown(evt);}, false);
        //RogueCanvas.addEventListener('mouseup', function(evt) { MouseUp(evt);}, false);
        //RogueCanvas.addEventListener('mouseout', function(evt) { MouseOut(evt);}, false);
        //RogueCanvas.addEventListener('wheel',function(event){            event.preventDefault();        }, false);

    });

     */
});






//****************************************************************************************************************
//****************************************************************************************************************
function SIO_READY(){

    let HOST = "http://127.0.0.1:3200/";
    //if(location.host === "dev-api.iceturtlestudios.com"){
        //HOST = "http://dev-api.iceturtlestudios.com:3000/";
    //}
    console.log(HOST)
    socket = io(HOST);

    socket.on("connect", () => {
        console.log(socket.id);
//        console.log("Connected " + MyWalletAddress);
//        socket.emit('wallet', MyWalletAddress);
    });

    socket.on('update', (d) => {
        //MyData = d;

        //Only get this once
        //if(MyData.map){
            //DrawMap();
        //}
        //console.log(d);
        //console.log('message: ' + JSON.stringify(d));
    });
    socket.on('chat', (msg) => {
        //ServerUpdate(d);
        console.log('message: ' + msg);
    });
    socket.on('pid', (msg) => {
        //ServerUpdate(d);
        MyPID = msg;
        console.log('PID: ' + msg);
    });
    socket.on('list', (msg) => {
        MAP_COUNT = msg.maps;
        console.log("MAPS: " + MAP_COUNT);
//        socket.emit('join', 1);
    });
    socket.on('joined', (msg) => {
        console.log(msg);
    });

    socket.emit('list', 1);
}