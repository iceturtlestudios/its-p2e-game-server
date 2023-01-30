console.log("###########################################################################################");
console.log("MAIN.INIT");
console.log("###########################################################################################");
import {ACM} from './engine/alchemy.mjs'
import MServer from './server.js'

MServer.ACM = new ACM();
MServer.ACM.Init(MServer.CORE);
//MServer.ACM.CORE = MServer.CORE;//attach


