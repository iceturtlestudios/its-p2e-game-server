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
    }
    //--------------------------------------------------------------------------------------------------------------
    // Helpers
    //--------------------------------------------------------------------------------------------------------------
    IsGame(id){ return this.GAMES.hasOwnProperty(id); }
    GameDelete(client){ delete this.GAMES[client.id]; }
    Connect(client){ this.PM.Connect(client); }
    GetPIDs(){ return Object.keys(this.PM.PLAYERS);}
    GetGIDs(){ return Object.keys(this.GAMES);}
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    DisConnect(P, client){

        if(this.IsGame(client.id)){//If client is a game server
            this.GameDelete(client);
            console.log("[--- GAME SERVER REMOVED ---] " + client.id);
        }
        P.remove = 1;//flag to remove
        console.log("[OFF] " + client.id);
        //if(P.pid !== null){ console.log(P.pid); }//Do something if logged in previously
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    Games(client){
        let d = [];
        for (let key in this.GAMES) {
            if (this.GAMES.hasOwnProperty(key)) {
                let g = this.GAMES[key];
                d.push({id:key, name:g.name, amt:g.amt})
            }
        }
        client.emit('games', d );
    }
    //--------------------------------------------------------------------------------------------------------------
    //Client Become a Server
    //--------------------------------------------------------------------------------------------------------------
    Server(P, client, d){
        if(d.key === process.env.SERVER_KEY){
            this.GAMES[client.id] =  new GS.Game_server(this, client, d.name, d.amt);
            this.PM.PLAYERS[client.id].server = 1;//Flag as Server
            client.emit('server', [1,"OK"] );
        }
        else { console.log("BAD SERVER KEY")}

    }
    //--------------------------------------------------------------------------------------------------------------
    //Server Update
    //--------------------------------------------------------------------------------------------------------------
    ServerMapUpdate(id, d){
        this.SENDS++;
        if (this.IsGame(id)) {
            this.GAMES[id].UpdateRoom(parseInt(d.id), d.data);

            //Example Stats
            this.STATS = "Server Map Update: " + d.id + " DataSize: " + JSON.stringify(this.GAMES[id].maps).length;
            //console.log("Server Map Update: " + d.id + " DataSize: " + JSON.stringify(this.GAMES[id].maps).length);
        }
    }

    //--------------------------------------------------------------------------------------------------------------
    //Join a Game/Map
    //--------------------------------------------------------------------------------------------------------------
    Join(client, P, gid, mid){
        console.log("Join Game " + gid + " / " + mid );

        //Remove from Current if any
        if(P.gid !== null){
            if(this.IsGame(P.gid)){ this.GAMES[P.gid].RemovePlayer(P.mid, client.id);}
            P.gid = null; P.mid = null;
        }

        //Join
        if(this.IsGame(gid)){
            let G = this.GAMES[gid];
            if(G.IsRoom(mid) === true){
                G.AddPlayer(mid, client.id, P);
                P.gid = gid; P.mid = mid;
                client.emit('join', [1,"OK"] );
            } else { client.emit('join', [0,"no map"] ); }
        } else { client.emit('join', [0,"no game"] ); }

        //Require Login - require pid (user id)
        //if(P.pid){    }
        //else { client.emit('join_game', [0,"login first"] ); }
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    Leave(client, P){
        if(P.gid !== null){
            if(this.IsGame(P.gid)){ this.GAMES[P.gid].RemovePlayer(P.mid, client.id); }
            P.gid = null; P.mid = null;
        }
        client.emit('leave', [1,"OK"] );
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    Input(P, client, d){
        if(this.PM.isPlayer(client) === false){ return console.log("player not connected:  " + client.id); }
        //console.log(JSON.stringify(d));
        P.input = d;//just store it for game to process
    }
    //--------------------------------------------------------------------------------------------------------------
    //Process Game Updates (to Players)
    //--------------------------------------------------------------------------------------------------------------
    Process(dt){
        this.RM.Process(dt);
        /*
        for (let key in this.GAMES) {
            if (this.GAMES.hasOwnProperty(key)) {
                this.GAMES[key].Process();
            }
        }
        this.PM.Process();*/
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    async API(cmd, client, data){
        if(this.PM.isPlayer(client) === false){ return console.log("player not connected:  " + client.id); }

        try {
            let P = this.PM.PLAYERS[client.id];
            switch(cmd) {
                case "server": await this.Server(P, client, data); break;
                case "server_map_update": await this.ServerMapUpdate(client.id, data); break;
                case "games": await this.Games(client); break;
                case "register": await this.PM.Register(P, client, data); break;
                case "login": await this.PM.Login(P, client, data); break;
                case "join": this.Join(client, P, data.gid, data.mid); break;
                case "input": this.Input(P, client, data); break;
                case "leave": this.Leave(client, P); break;
                case "disconnect": this.DisConnect(P, client); break;
                default:
            }
        } catch (e) { console.log(e); }
    }

}
exports.Core = Core;
