var Promise = require("bluebird");
var enigma = require('enigma.js');
var enigmaInstance = require("./enigmaInstance");
var backupApp = require("./backupApp");
var qrsCalls = require("./qrsCalls");
var writeToXML = require("./writeToXML");
var logger = require("./logger");
var userAccessControl = require("./userAccessControl");
var parseScriptLogs = require("./parseScriptLogs");
var socketHelper = require("./socketHelper");

var loggerObject = {
    jsFile: "createGovernanceOutput.js"
}

function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);
}

var start_time, end_time;

function doGovernance(config, options) {
    return new Promise(function (resolve, reject) {
        Promise.resolve(function () {
                start_time = new Date(Date.now());
                logMessage("info", "Governance collection process started at " + start_time);
                if (options.boolGenMetadata) {
                    return createGovernanceOutput(config, options)
                        .then(function (result) {
                            console.log(result);
                            return result;
                        })
                }
                return;
            }())
            .then(function (foo) {
                console.log("checking if parsing load scripts");
                if (options.boolParseLoadScripts) {
                    logMessage("info", "Parsing load script logs for lineage information");
                    return parseScriptLogs(config.agent.loadScriptParsing.loadScriptLogPath, config.agent.loadScriptParsing.parsedScriptLogPath, [], []);
                }
                return;
            })
            .then(function () {
                console.log("checking if generating QVDs");

                if (options.boolGenQVDs) {
                    return reloadApp(config, config.agent.qvdTaskname);
                }
                return;
            })
            .then(function () {
                console.log("checking if reloading gdash");
                if (options.boolReloadGovDash) {
                    return reloadApp(config, config.agent.gDashTaskname)
                }
                return;
            })
            .then(function () {
                end_time = new Date(Date.now());
                var run_options = {
                    hostname: config.engine.hostname,
                    no_data: config.agent.noData,
                    start_timestamp: start_time.toISOString(),
                    end_time: end_time.toISOString(),
                    single_app: config.agent.single_app,
                    parse_loadScripts: config.agent.parseLoadScriptLogs
                };
                logMessage("info", "Governance collection process complete at " + end_time);
                writeToXML("run_options", "RunOptions", run_options);
                resolve("DONE!!!")
            })
            .catch(function (error) {
                reject(error);
            })
    })
}

module.exports = doGovernance;

function createGovernanceOutput(config, options) {
    return new Promise(function (resolve, reject) {

        enigma.getService('qix', enigmaInstance(config))
            .then(function (qix) {
                qix.global.getDocList()
                    .then(function (docList) {
                        return qrsCalls.qrsAppsDataUsers(config)
                            .then(function (result) {
                                return result;
                            })
                            .then(function (qrsResult) {
                                logMessage("info", "doc lists, data connections, and user list collected from repository");
                                writeToXML("documentList", "DocumentsList", {
                                    doc: docList
                                });
                                writeToXML("qrsDocumentList", "qrsDocumentsList", {
                                    app: qrsResult[0]
                                });
                                writeToXML("qrsDataConnectionList", "qrsDataConnectionList", {
                                    data: qrsResult[1]
                                });
                                writeToXML("qrsUserList", "qrsUserList", {
                                    data: qrsResult[2]
                                });
                                return (docList);
                            });
                    })
                    .then(function (docList) {
                        if (config.agent.single_app || options.singleApp.boolSingleApp) {
                            var singleAppId;
                            if (config.agent.appId) {
                                singleAppId = config.agent.appId
                            } else {
                                singleAppId = options.singleApp.appId
                            }
                            logMessage("info", "Single App output generation selected for app: " + singleAppId);
                            return backupApp(qix, singleAppId, config.agent)
                                .then(function (result) {
                                    logMessage("info", "Qlik Sense Governance run against " + singleAppId + "complete.");
                                });
                        } else {
                            logMessage("info", "Generating output for the entire Qlik Sense site");
                            return Promise.all(docList.map(function (doc) {
                                    return backupApp(qix, doc.qDocId, config.agent)
                                        .then(function (result) {
                                            return result;
                                        });
                                }))
                                .then(function (resultArray) {
                                    logMessage("info", "Qlik Sense Governance run against " + resultArray.length + " applications complete.");
                                    logger.info("Qlik Sense Governance run against all applications complete.", loggerObject);
                                });
                        }
                    })
                    .then(function () {
                        return userAccessControl(config)
                            .then(function (result) {
                                logMessage("info", "Performing access control checks");
                            });
                    })
                    .then(function () {
                        resolve("Governance Output Created");
                    });
            })
            .catch(function (err) {
                logMessage("error", "Error in Governance collection process");
                logMessage("error", err.message);
                reject(err.message);
            });
    });
}

function parseScript(config) {

}

function reloadApp(config, taskname) {
    return new Promise(function (resolve, reject) {
        qrsCalls.qrsReloadTask(config, taskname)
            .then(function (result) {
                logMessage("info", result);
            })
            .catch(function (error) {
                logMessage("error", "Error executing " + taskname);
                logMessage("error", error);
                reject(error);
            })
    });
}