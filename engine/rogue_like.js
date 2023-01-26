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

let CFood = 0;
let CGold = 0;
let CGems = 0;
let CNPCs = 0;
let CPLAYERS = 0;
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
        RogueNPCs[RID] = {hp:100, damage:1, x:x, y:y, remove:0};//simple tracking data
        //console.log(RogueNPCs[RID]);
    }
}
//******************************************************************************************************************************
//******************************************************************************************************************************
function SpawnPlayer(map){

    //Always Safe Zones Only to be fair
    let x = RogueRandInt(MAP_WIDTH); let y = RogueRandInt(MAP_HEIGHT);
    let side = RogueRandInt(4);
    if(side === 0){y = 0;}//top
    if(side === 1){y = MAP_HEIGHT - 1;}//bottom
    if(side === 2){x = 0;}//left
    if(side === 3){y = MAP_WIDTH - 1;}//right

    //Double check if open (no blocking)
    if(RogueIsLocationOpen(map, x, y) === true){
        RID++;
        RoguePlayers[RID] = {hp:100, damage:1, x:x, y:y, dir:-1, remove:0};//simple tracking data
        console.log(RoguePlayers[RID]);
        return RID;
    }
    return -1;
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
                if(RoguePlayers[pid].hp < 0){ RoguePlayers[pid].hp = 0; RoguePlayers[pid].remove = 1; }
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
function RogueMapProcess(dt){
    let map = RL_MAP;
    let max_npc = 50;
    let count_npc = 0;
    let count_player = 0;
    let max_food = 100;
    let count_food = 0;
    let max_gold = 50;//higher
    let count_gold = 0;
    let max_gem = 20;//rare
    let count_gem = 0;

    let x, y, dir;

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

    for (let pid in RoguePlayers) {
        if (RoguePlayers.hasOwnProperty(pid)) {
            x = RoguePlayers[pid].x; y = RoguePlayers[pid].y;
            dir = RoguePlayers[pid].dir;
            if(dir >= 0) {//Input based for players
                if(dir === 0){ if(RogueIsMoveable(map, x+1, y) === true){ MovePlayer(RoguePlayers[pid], x+1, y); } }
                if(dir === 1){ if(RogueIsMoveable(map, x-1, y) === true){ MovePlayer(RoguePlayers[pid], x-1, y); } }
                if(dir === 2){ if(RogueIsMoveable(map, x, y+1) === true){ MovePlayer(RoguePlayers[pid], x, y+1); } }
                if(dir === 3){ if(RogueIsMoveable(map, x, y-1) === true){ MovePlayer(RoguePlayers[pid], x, y-1); } }
            }
        }
    }

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
    count_player = Object.keys(RoguePlayers).length;

    //info update
    //let ss = "My Food/Gold/Gems: " + RogueMyFood + "/" + RogueMyGold + "/" + RogueMyGems;
    //let m = ss + " Map Size: " + MAP_WIDTH + "x" + MAP_HEIGHT;
    //let debug = m + " Food: " + count_food + " " + "Gold: " + count_gold + " " + "Gems: " + count_gem + " " + "NPCs: " + count_npc;
    //console.log(debug);
    //$('#info').html(m + " Food: " + count_food + " " + "Gold: " + count_gold + " " + "Gems: " + count_gem + " " + "NPCs: " + count_npc);

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


    //Stats
    CFood = count_food;
    CGold = count_gold;
    CGems = count_gem;
    CNPCs = count_npc;
    CPLAYERS = count_player;

    //HTML5Draw();
    //console.log("ROGUELIKE_PROCESS");

}
//**********************************************************************************************************************************
//**********************************************************************************************************************************
function ShipRockCheck(GD, Ship){
    // Check for collision of ship with asteroid
    if (GD.Rocks.length !== 0) {
        for(let k = 0; k < GD.Rocks.length; k++){
            let R = GD.Rocks[k];
            if(CircleCollision(Ship.x, Ship.y, 11, R.x, R.y, R.collisionRadius)){
                //Ship.x = Math.floor(Math.random() * (GD.VW - 100)) + 50;//next random location
                //Ship.y = Math.floor(Math.random() * (GD.VH - 100)) + 50;
                Ship.velX = 0; Ship.velY = 0;
                Ship.hp -= 1;
                if(Ship.hp === 0){ Ship.isAlive = false; }
                return;
            }
        }
    }
}

//**********************************************************************************************************************************
//**********************************************************************************************************************************
function CircleCollision(p1x, p1y, r1, p2x, p2y, r2){
    let radiusSum;
    let xDiff;
    let yDiff;

    radiusSum = r1 + r2;
    xDiff = p1x - p2x;
    yDiff = p1y - p2y;

    if (radiusSum > Math.sqrt((xDiff * xDiff) + (yDiff * yDiff))) {
        return true;
    } else {
        return false;
    }
}

//**********************************************************************************************************************************
//RogueLike Logic
//**********************************************************************************************************************************
class RogueLike {
    constructor(core) {
        this.core = core;
        this.players = [];

        //Create Map Data
        RL_MAP = RogueMapGenerate(MAP_WIDTH, MAP_HEIGHT, 16);
        console.log(JSON.stringify(RL_MAP));

        //Debug
        //console.log("[GAME SERVER] " + name + " (" + amt + ") ID: " + client.id + " " + JSON.stringify([this.maps, this.players]) );
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    //IsRoom(index){ return index >= 0 && index < this.amt; }
    //UpdateRoom(index, data){ if(this.IsRoom(index) === true){ this.maps[index] = data; } }
    //AddPlayer(index, pid, P){ this.players[index][pid] = P; }
    //RemovePlayer(index, pid){ this.players[index][pid].remove = 1; }
    GetUpdate(){ return {npcs: RogueNPCs, players: RoguePlayers, map: RL_MAP}; }
    Info(){
        return {food: CFood, gold: CGold, gem: CGems, npc: CNPCs, players: CPLAYERS};
    }
    Spawn(){ return SpawnPlayer(RL_MAP); }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    SetInput(pid, dir){
        if (RoguePlayers.hasOwnProperty(pid)) {
            RoguePlayers[pid].dir = dir;
        }
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    Disconnect(pid){
        if (RoguePlayers.hasOwnProperty(pid)) {
            RoguePlayers[pid].remove = 1;
            console.log("found RM pid: " + pid);
        }
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    Process(dt){
        RogueMapProcess(dt);
        this.RemoveGroup(RoguePlayers);//clean up dead player avatars
        this.RemoveGroup(RogueNPCs);//Just in case enemies die off as well
    }
    //--------------------------------------------------------------------------------------------------------------
    // Remove from Object Group (after processing)
    //--------------------------------------------------------------------------------------------------------------
    RemoveGroup(group){
        let remove =  [];
        for (let key in group) { if (group.hasOwnProperty(key)) { if(group[key].remove === 1){ remove.push(key); } } }
        for(let i=0; i< remove.length; i++){
            delete group[remove[i]];
            console.log("Removed Player or NPC: " + remove[i])
        }
    }

}
exports.RogueLike = RogueLike;
