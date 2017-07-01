var Promise = require("bluebird");
var writeToXML = require('./writeToXML');
var logger = require("./logger");
var socketHelper = require("./socketHelper");

var loggerObject = {
    jsFile: "app-connections.js"
}


function logMessage(level, msg) {
    socketHelper.sendMessage("governanceCollector", msg);
    logger.log(level, msg, loggerObject);

}


function getAppConnections(app, appId, options) {
    //Creating the promise for the Connections List
    //Root admin privileges should allow him to access to all available connections. Otherwise check your environment's security rules for the designed user.
    return new Promise(function(resolve, reject) {
        logMessage("info", "Collecting data connections for app " + appId);
        console.log();
        console.log("*****************************************************");
        console.log("             Loading the Connections List            ");
        console.log("*****************************************************");

        var start_time = Date.now();

        app.getConnections()
            .then(function(document_connections) {
                var received_time = Date.now();
                console.log("It took " + (received_time - start_time) + "ms to receive the info.");

                var loading_time = 0;

                //Setting up data and options for XML file storage
                var data = {
                    document_connections,
                    qsLoadingTime: loading_time
                };

                logMessage("info", "Data connection collection complete for app " + appId);
                writeToXML("documentConnections", "DocumentsConnections", data, appId);
                resolve("Checkpoint: Connections List is loaded");
            })
            .catch(function(error) {
                logMessage("error", "Error processing data connections for app " + appId);
                logMessage("error", error.message);
                reject(new Error(error));
            });
    });
}

module.exports = getAppConnections;