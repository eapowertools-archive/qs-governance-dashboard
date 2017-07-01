var Promise = require("bluebird");
var writeToXML = require('./writeToXML');
var logger = require("./logger");
var socketHelper = require("./socketHelper");

var loggerObject = {
    jsFile: "app-library-measures.js"
}

function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);
}


module.exports = {
    getAppList: function(qix, options) {
        return new Promise(function(resolve, reject) {
            logMessage("info", "Collecting application list");
            var start_time = Date.now();
            return qix.global.getDocList()
                .then(function(documents) {
                    var received_time = Date.now();
                    console.log("It took " + (received_time - start_time) + "ms to receive the info.");


                    var data = {
                        documents,
                        qsLoadingTime: loading_time
                    }

                    logMessage("info", "Application list collection complete.");
                    writeToXML("documentList", "DocumentsList", data, appId);
                    resolve("Checkpoint: Applications List is loaded");

                })
                .catch(function(error) {
                    logMessage("error", "Error processing application list");

                    logMessage("error", error.message);
                    reject(error);
                });
        });
    }
}