
//**********************************************************************************************************************************
//Game Server (Manager)
//**********************************************************************************************************************************
class Game_server {
    constructor(core, client, name, amt) {
        this.core = core;
        this.client = client;
        this.amt = amt;
        this.maps = [];
        this.players = [];
        this.remove = 0;//flag to remove

        //Init Maps/Player Groups
        for(let i=0;i<amt; i++){
            this.maps.push(null);//placeholders for map updates (null)
            this.players.push({});//placeholders for players per Map
        }

        //Debug
        console.log("[GAME SERVER] " + name + " (" + amt + ") ID: " + client.id + " " + JSON.stringify([this.maps, this.players]) );
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    IsRoom(index){ return index >= 0 && index < this.amt; }
    UpdateRoom(index, data){ if(this.IsRoom(index) === true){ this.maps[index] = data; } }
    AddPlayer(index, pid, P){ this.players[index][pid] = P; }
    RemovePlayer(index, pid){ this.players[index][pid].remove = 1; }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    SendPlayerUpdate(Group, out_data){
        let inputs = {};

        //TODO Send player inputs to game server
        for (let key in Group) {
            if (Group.hasOwnProperty(key)) {
                if(Group[key].remove === 0){
                    out_data.pid = key;
                    Group[key].client.emit('update', out_data );
                    if(Group[key].input !== null){ inputs[key] = Group[key].input; }
                }
            }
        }
        return inputs;
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    Process(){
        let inputs_all = [];
        for(let i=0; i < this.amt; i++){
            let out_data = this.maps[i];
            if(out_data !== null){
                //console.log(Object.keys(this.players[i]));
                let inputs = this.SendPlayerUpdate(this.players[i], out_data);
                inputs_all.push(inputs);
            }
            this.RemoveGroup(this.players[i]);
        }
        this.client.emit('server_inputs', inputs_all );
    }
    //--------------------------------------------------------------------------------------------------------------
    // Remove from Object Group (after processing)
    //--------------------------------------------------------------------------------------------------------------
    RemoveGroup(group){
        let remove =  [];
        for (let key in group) { if (group.hasOwnProperty(key)) { if(group[key].remove === 1){ remove.push(key); } } }
        for(let i=0; i< remove.length; i++){
            delete group[remove[i]];
            console.log("Removed Player from GameServer: " + remove[i])
        }
    }

}
exports.Game_server = Game_server;
