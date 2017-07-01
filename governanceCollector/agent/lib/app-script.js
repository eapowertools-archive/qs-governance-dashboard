var Promise = require("bluebird");
var writeToXML = require('./writeToXML');
var logger = require("./logger");
var socketHelper = require("./socketHelper");

var loggerObject = {
    jsFile: "app-script.js"
}

function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);
}


var start_time;
var end_time;


function getAppScript(app, appId, options) {
    //Creating the promise for the Applications Scripts
    //Root admin privileges should allow him to access to all available applications. Otherwise check your environment's security rules for the designed user.
    return new Promise(function(resolve) {
        logMessage("info", "Collecting application script for app " + appId);
        start_time = Date.now();
        //requesting the script of the document
        app.getScript()
            .then(function(script) {
                var script_lines = [];
                script_lines = script.split('\n');

                var connect_statements = [];
                script_lines.forEach(function(line, index) {
                    var new_line = line.replace('\t', '').replace('\r', '');
                    if (new_line.search('LIB CONNECT TO ') > -1) {
                        connect_statements.push({
                            statement: new_line,
                            library: new_line.replace('LIB CONNECT TO ', '').replace('"', '').replace('[', '').replace(']', '').replace(';', ''),
                            script_line: index + 1
                        });
                    }
                });

                end_time = Date.now();
                var data = { script: script, connect_statements: connect_statements, parseTime: end_time - start_time };

                logMessage("info", "application script collection complete for app " + appId);
                writeToXML("documentScript", "ScriptInfo", data, appId);
                resolve("Checkpoint: Applications Scripts are loaded");
            });
    });
}

module.exports = getAppScript;