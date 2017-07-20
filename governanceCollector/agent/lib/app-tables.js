var Promise = require("bluebird");
var writeToXML = require('./writeToXML');
var logger = require("./logger");
var socketHelper = require("./socketHelper");

var loggerObject = {
    jsFile: "app-tables.js"
}

function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);
}


var start_time, end_time;

function getAppTables(app, appId, options) {
    //Creating the promise for the Applications Tables
    //Root admin privileges should allow him to access to all available applications. Otherwise check your environment's security rules for the designed user.
    return new Promise(function (resolve) {
        logMessage("info", "Collecting list of tables in the application data model for app " + appId);
        var params = {
            "qWindowSize": {
                "qcx": 0,
                "qcy": 0
            },
            "qNullSize": {
                "qcx": 0,
                "qcy": 0
            },
            "qCellHeight": 0,
            "qSyntheticMode": false,
            "qIncludeSysVars": false
        }
        start_time = Date.now();
        //Requesting the tables of the document
        app.getTablesAndKeys(params.qWindowSize, params.qNullSize, params.qCellHeight, params.qSyntheticMode, params.qIncludeSysVars)
            .then(function (key_tables) {
                end_time = Date.now();

                //Setting up data and options for XML file storage
                var data = {
                    key_tables,
                    qsLoadingTimeTable: end_time - start_time
                };

                return data;
            })
            .then(function (data) {
                logMessage("info", "Table metadata collection complete for appid: " + appId);
                writeToXML("documentsKeyTables", "KeyTables", data, appId);
                resolve("Checkpoint: Applications Tables are loaded");
            })
            .catch(function (error) {
                logMessage("error", JSON.stringify(error));
                resolve(error);
            })
    });
}

module.exports = getAppTables;