var Promise = require('bluebird');
var serializeAppForGovernance = require('./serializeAppForGovernance');
var logger = require("./logger");
var socketHelper = require("./socketHelper");
var enigma = require('enigma.js');
var enigmaInstance = require("./enigmaInstance");

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

function backupApp(config, appId, options) {
    return new Promise(function (resolve, reject) {
        var x = {};
        start_time = Date.now();
        logMessage("info", "Collecting application metadata for app " + appId);
        var session = enigma.create(enigmaInstance(config, appId));
        session.open()
            .then(function (global) {
                return global.openDoc(appId, '', '', '', options.noData)
                    .then(function (app) {
                        end_time = Date.now();
                        load_time = end_time - start_time;
                        return serializeAppForGovernance(app, load_time, options)
                            .then(function (appData) {
                                return session.close()
                                    .then(function () {
                                        logMessage("info", "Application metadata complete for app " + appId);
                                        //app.session.close();
                                        resolve(appData);
                                    })
                                    .catch(function (error) {
                                        return session.close()
                                            .then(function () {
                                                logMessage("error", "Error during backup process for app " + appId);
                                                logMessage("error", JSON.stringify(error));
                                                reject(error);
                                            })
                                    })
                            })
                            .catch(function (error) {
                                return session.close()
                                    .then(function () {
                                        logMessage("error", "Error during backup process for app " + appId);
                                        logMessage("error", JSON.stringify(error));
                                        reject(error);
                                    })
                            });
                    })
                    .catch(function (error) {
                        return session.close()
                            .then(function () {
                                logMessage("error", "Error during backup process for app " + appId);
                                logMessage("error", JSON.stringify(error));
                                reject(error);
                            })

                    });
            })
            .catch(function (error) {
                return session.close()
                    .then(function () {
                        logMessage("error", "Error during backup process");
                        logMessage("error", JSON.stringify(error));
                        reject(error);
                    })

            });

    });
}


module.exports = backupApp;