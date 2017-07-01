var Promise = require('bluebird');
var serializeAppForGovernance = require('./serializeAppForGovernance');
var logger = require("./logger");
var socketHelper = require("./socketHelper");

var loggerObject = {
    jsFile: "backupApp.js"
}

function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);
}

var start_time, end_time, load_time;

function backupApp(qix, appId, options) {
    return new Promise(function(resolve, reject) {
        var x = {};
        start_time = Date.now();
        logMessage("info", "Collecting application metadata for app " + appId);
        return qix.global.openDoc(appId, '', '', '', options.noData)
            .then(function(app) {
                end_time = Date.now();
                load_time = end_time - start_time;
                return serializeAppForGovernance(app, load_time, options)
                    .then(function(appData) {
                        logMessage("info", "Application metadata complete for app " + appId);
                        //app.session.close();
                        resolve(appData);
                    });
            })
            .catch(function(error) {
                logMessage("error", "Error during backup process");
                logMessage("error", error.message);
                reject(error);
            });
    });
}

module.exports = backupApp;