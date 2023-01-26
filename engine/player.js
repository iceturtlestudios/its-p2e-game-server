const mDB = require("./mmysql");
const bcrypt = require('bcrypt');
const saltRounds = 10;

//**********************************************************************************************************************************
//Player Manager
//**********************************************************************************************************************************
class Player {
    constructor(core) {
        this.core = core;
        this.PLAYERS = {};
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    isPlayer(client){ return this.PLAYERS.hasOwnProperty(client.id); }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    PlayerDefaultData(client){
        return {
            client:client, pid:null, api_key: null, wallet:null, gid:null, mid:null, input:null, remove:0
        };
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    Connect(client){
        this.PLAYERS[client.id] = this.PlayerDefaultData(client);
        console.log("[ON] " + client.id);
    }
    //--------------------------------------------------------------------------------------------------------------
    //Register a New User (MYSQL)
    //--------------------------------------------------------------------------------------------------------------
    async Register(P, client, data){
        //console.log("REGISTER: " + JSON.stringify(data));
        if(data.email.length < 3){ return client.emit('register', [0,"email short (3 min)"] ); }
        if(data.user.length < 3){ return client.emit('register', [0,"user short (3 min)"] ); }
        if(data.password.length < 8){ return client.emit('register', [0,"password short (8 min)"] ); }
        let g = await mDB.PQuery("SELECT * FROM user WHERE email = ?", [data.email]);
        if(g){
            if(g.length > 0){ return client.emit('register', [0,"user exists"] ); }
            else {
                bcrypt.hash(data.password, saltRounds, async function(err, hash) {
                    if(hash){
                        let sql = "INSERT INTO user (email, username, password) VALUES (?,?,?)";
                        await mDB.Query(sql, [data.email, data.user, hash],function (err, result) {
                            if (err) { return client.emit('register', [0,"email or username exists"] ); }
                            client.emit('register', [1,"OK"] );
                        });
                    }
                });
            }
        }
    }
    //--------------------------------------------------------------------------------------------------------------
    //Login a User (MYSQL)
    //--------------------------------------------------------------------------------------------------------------
    async Login(P, client, data){
        //console.log("LOGIN: " + JSON.stringify(data));
        let g = await mDB.PQuery("SELECT * FROM user WHERE email = ?", [data.email]);
        if(g){
            if(g.length > 0){
                let rec = g[0];
                //console.log(rec["id"] + " " + rec["password"])
                bcrypt.compare(data.password, rec["password"], function(err, result) {
                    if(result){
                        P.pid = rec["id"];
                        return client.emit('login', [1,"OK", rec["id"]] );
                    }
                    client.emit('login', [0,"NO"] );
                });
                return;
            }
        }
        console.log(g)
        client.emit('login', [0,"no user"] );
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
    Process(){
        //Cleanup Players
        this.RMGroup(this.PLAYERS);
    }


}
exports.Player = Player;
