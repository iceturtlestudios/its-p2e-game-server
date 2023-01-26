require('dotenv').config()//console.log(process.env)

const RL = require("./rogue_like");
const GS = require("./game_server");
const PM = require("./player");//Player Manager

//**********************************************************************************************************************************
//**********************************************************************************************************************************
class Core {
    constructor() {
        this.GAMES = {};
        this.PM = new PM.Player(this);//Player Manager
        this.RM = new RL.RogueLike();
        this.STATS = "";
        this.SENDS = 0;
        this.BANK = 1000000;//Update to Server Wallet Balance
    }
    //--------------------------------------------------------------------------------------------------------------
    // Helpers
    //--------------------------------------------------------------------------------------------------------------
    IsGame(id){ return this.GAMES.hasOwnProperty(id); }
    GameDelete(client){ delete this.GAMES[client.id]; }
    Connect(client){ this.PM.Connect(client); }
    DisConnect(client){
        //Remove Avatar if spawned (RM)
        if(this.PM.isPlayer(client) === true){
            let P = this.PM.PLAYERS[client.id];
            if(P.pid >= 0){
                console.log("removing pid: " + P.pid);
                this.RM.Disconnect(P.pid);
            }
        }
        this.PM.DisConnect(client);
    }
    GetPIDs(){ return Object.keys(this.PM.PLAYERS);}
    GetGIDs(){ return Object.keys(this.GAMES);}
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    BuyCredits(client, d){
        if(this.PM.isPlayer(client) === false){ return console.log("player not connected:  " + client.id); }
        let P = this.PM.PLAYERS[client.id];

        //TODO Player must pay 1 Polygon to player (min) = 10 Credits
        P.credit += 10;//TEST GIVE 10
        P.client.emit('buy', "Purchase Successful! +10" );
        console.log([P.client.id, P.credit]);
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    Spawn(client, d){
        if(this.PM.isPlayer(client) === false){ return console.log("player not connected:  " + client.id); }
        let P = this.PM.PLAYERS[client.id];
        let msg = ""
        if(P.credit <= 0){return P.client.emit('spawn', "Buy Credits First To Play" ); }
        if(P.pid >= 0){return P.client.emit('spawn', "Already Spawned" ); }
        let sid = this.RM.Spawn();
        if(sid >= 0){//only if successful remove credit
            P.credit -= 1; P.pid = sid;
            P.client.emit('spawn', "Spawned OK" );
        }
        else { P.client.emit('spawn', "Could not Spawn - Try Again" ); }
        console.log([P.client.id, P.credit]);
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    Input(client, d){
        if(this.PM.isPlayer(client) === false){ return console.log("player not connected:  " + client.id); }
        let P = this.PM.PLAYERS[client.id];

        //console.log(JSON.stringify(d));
        if(isNaN(d) === false){
            //P.input = d;
            if(P.pid >= 0){
                this.RM.SetInput(P.pid, d);
                console.log([P.client.id, d]);
            }
        }


    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    Wallet(client, d){
        if(this.PM.isPlayer(client) === false){ return console.log("player not connected:  " + client.id); }
        let P = this.PM.PLAYERS[client.id];
        P.wallet = d;//just store it for game to process
        console.log([P.client.id, P.wallet]);
    }
    //--------------------------------------------------------------------------------------------------------------
    //Process Game Updates (to Players)
    //--------------------------------------------------------------------------------------------------------------
    Process(stats, dt){
        this.RM.Process(dt);
        this.PM.Process(stats, this.RM.GetUpdate());
    }

}
exports.Core = Core;
