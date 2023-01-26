const UTIL = require( 'util' );
const MYSQL = require("mysql");

//Info
console.log("[MYSQL] " + process.env.MYSQL);

//Tracking Clients
let mysql_default = null;
let mysql_promise = null;
//***********************************************************************************************************************
//***********************************************************************************************************************
exports.Init = async (name) => {

    let config = {
        host     : process.env.MYSQL,
        user     : process.env.MYSQL_USER,
        password : process.env.MYSQL_PASSWORD,
        database : process.env.MYSQL_DB,
    }

    mysql_default = MYSQL.createPool(config);

    mysql_default.query('SELECT 1', function (error, results, fields) {
        if (error) throw error;
        // connected!
    });

    //Promise version
    mysql_promise = makePromiseDb( config );

    //Test Promise
    try {
        let test = await exports.PQuery("SELECT 1", null);
        console.log("[DB TEST] SELECT 1: " + JSON.stringify(test));
    } catch ( err ) {
        // handle the error
    }

}
//***********************************************************************************************************************
//***********************************************************************************************************************
function makePromiseDb( config ) {
    const connection = MYSQL.createPool( config );
    return {
        query( sql, args ) {
            return UTIL.promisify( connection.query )
                .call( connection, sql, args );
        },
        close() {
            return UTIL.promisify( connection.end ).call( connection );
        }
    };
}
//***********************************************************************************************************************
//***********************************************************************************************************************
exports.Query = async (sql, args, callback) => {
    if(args){
        mysql_default.query(sql, args, function (err, result) {
            //if (err) throw err;
            callback(err, result);
        });
    }
    else {
        mysql_default.query(sql, function (err, result) {
            //if (err) throw err;
            callback(err, result);
        });
    }
}
//***********************************************************************************************************************
//***********************************************************************************************************************
exports.PQuery = async (sql, args) => {
    if(args == null){args = [];}
    return mysql_promise.query(sql, args);//promise
}
