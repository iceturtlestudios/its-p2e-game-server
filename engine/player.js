const mDB = require("./mmysql");
const bcrypt = require('bcrypt');
const saltRounds = 10;
require('dotenv').config()//console.log(process.env)

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
            client:client, pid:-1, credit:0, wallet:null, score:0, input:null, remove:0
        };
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    GiveCredit(wallet, amt){
        let gp_amount = parseFloat(process.env.GAME_PAYMENT);
        if(amt >= gp_amount){
            let credits = Math.floor(amt / gp_amount) * process.env.GAME_PAYMENT_LIVES;
            console.log("CREDITS: " + credits + " " + typeof(amt));
            for (let key in this.PLAYERS) {
                if (this.PLAYERS.hasOwnProperty(key)) {
                    //Find matching player - give credits
                    console.log("CHECK: " + this.PLAYERS[key].wallet.toLowerCase() + " " + wallet.toLowerCase());
                    if(this.PLAYERS[key].wallet.toLowerCase() === wallet.toLowerCase()){
                        this.PLAYERS[key].credit += credits;
                        console.log("CREDITS GRANTED: " + wallet + " " + credits);
                        return;
                    }
                }
            }
        }
        else { console.log("Not Enough Polygon Given") }

    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    Died(cid){
        if(this.PLAYERS.hasOwnProperty(cid)){
            this.PLAYERS[cid].pid = -1;
            console.log("AVATAR DIED " + cid);
        }
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    GiveScore(cid, amt){
        if(this.PLAYERS.hasOwnProperty(cid)){
            this.PLAYERS[cid].score += amt;
            console.log("ADD SCORE " + cid + " " + amt);
        }
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    ResetScores(){
        for (let key in this.PLAYERS) {
            if (this.PLAYERS.hasOwnProperty(key)) {
                this.PLAYERS[key].score = 0;
            }
        }
        console.log("RESET SCORES!");
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    FindWinner(){
        let winner = null;
        let top_score = 0;
        for (let key in this.PLAYERS) {
            if (this.PLAYERS.hasOwnProperty(key)) {
                let P = this.PLAYERS[key];
                if(P.score > 0 && P.score > top_score){
                    winner = P.wallet;
                    top_score = P.score;
                    console.log("Found Top Score: " + winner + " " + top_score);
                }
            }
        }
        return winner;
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
    Process(info, out_data, cooldown){
        //Cleanup Players
        this.RMGroup(this.PLAYERS);

        for (let key in this.PLAYERS) {
            if (this.PLAYERS.hasOwnProperty(key)) {
                if(this.PLAYERS[key].remove === 0){
                    let pid = this.PLAYERS[key].pid;
                    out_data.pid = pid;
                    out_data.hp = 0;
                    if(pid !== -1){ out_data.hp = this.core.RM.GetHP(pid); }//get hp if spawned
                    out_data.credit = this.PLAYERS[key].credit;
                    out_data.score = this.PLAYERS[key].score;
                    out_data.info = info;
                    out_data.info.data_size = JSON.stringify(out_data).length;
                    out_data.cooldown = cooldown;
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
