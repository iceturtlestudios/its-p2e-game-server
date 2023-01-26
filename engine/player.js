const mDB = require("./mmysql");
const bcrypt = require('bcrypt');
const saltRounds = 10;

//**********************************************************************************************************************************
//Player Manager
//**********************************************************************************************************************************
class Player {
    constructor(core) {
        this.core = core;
        this.PLAYERS = {};//Connections
        this.PID = 0;
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    isPlayer(client){ return this.PLAYERS.hasOwnProperty(client.id); }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    PlayerDefaultData(client){
        return {
            client:client, pid:-1, credit:0, wallet:null, input:null, remove:0
        };
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    Connect(client){
        this.PLAYERS[client.id] = this.PlayerDefaultData(client);
        console.log("[ON] " + client.id);
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    DisConnect(client){
        this.PLAYERS[client.id].remove = 1;
        console.log("[OFF] " + client.id);
    }
    //--------------------------------------------------------------------------------------------------------------
    // Remove from Object Group (after processing)
    //--------------------------------------------------------------------------------------------------------------
    RMGroup(group){
        let remove =  [];
        for (let key in group) { if (group.hasOwnProperty(key)) { if(group[key].remove === 1){ remove.push(key); } } }
        for(let i=0; i< remove.length; i++){
            delete group[remove[i]];
            console.log("Removed Player from Core: " + remove[i])
        }
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    Process(stats, out_data){
        //Cleanup Players
        this.RMGroup(this.PLAYERS);

        for (let key in this.PLAYERS) {
            if (this.PLAYERS.hasOwnProperty(key)) {
                if(this.PLAYERS[key].remove === 0){
                    out_data.pid = this.PLAYERS[key].pid;
                    out_data.credit = this.PLAYERS[key].credit;
                    out_data.info = stats;
                    //console.log("UPDATE")
                    //console.log(out_data)
                    this.PLAYERS[key].client.emit('update', out_data );
                    //if(this.PLAYERS[key].input !== null){ inputs[key] = this.PLAYERS[key].input; }
                }
            }
        }

    }


}
exports.Player = Player;
