const Promise = require("bluebird");
const enigma = require('enigma.js');
const enigmaInstance = require("./enigmaInstance");
const backupApp = require("./backupApp");
const qrsCalls = require("./qrsCalls");
const writeToXML = require("./writeToXML");
const logger = require("./logger");
const userAccessControl = require("./userAccessControl");
const parseScriptLogs = require("./parseScriptLogs");
const socketHelper = require("./socketHelper");
const deleteFiles = require("./deleteFiles");
const path = require("path");
const dateDiff = require("./dateDiff");

const loggerObject = {
    jsFile: "harvester.js"
}

function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);
}

let start_time, end_time;

let harvester = {
    getQrsInfos: function (config) {
        return qrsCalls.qrsAppsDataUsers(config)
            .then(function (result) {
                return result;
            })
            .then(function (qrsResult) {
                logMessage("info", "doc lists, data connections, and user list collected from repository");
                writeToXML("qrsDocumentList", "qrsDocumentsList", {
                    app: qrsResult[0]
                });
                writeToXML("qrsDataConnectionList", "qrsDataConnectionList", {
                    data: qrsResult[1]
                });
                writeToXML("qrsUserList", "qrsUserList", {
                    data: qrsResult[2]
                });
                writeToXML("qrsAllocatedUserList", "qrsAllocatedUserList", {
                    data: qrsResult[3]
                });
                return qrsResult;
            })
            .catch(function (error) {
                logMessage("error", error);
                return error;
            });
    },
    getUserAccessControl: function (config, options, userList) {
        return new Promise(function (resolve, reject) {
            snapshot_time_formated =  getSnapshotTime();
            // var snapshot_time = new Date();
            // snapshot_time_formated =  snapshot_time.getFullYear()+'-'
            //         + ("0" + (snapshot_time.getMonth() + 1)).slice(-2)+'-'
            //         +("0" + snapshot_time.getDate()).slice(-2)+'T'
            //         +snapshot_time.getHours(00).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})+':'
            //         +snapshot_time.getMinutes(00).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})+':'
            //         +snapshot_time.getSeconds(00).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})+'.'
            //         +snapshot_time.getMilliseconds(000).toLocaleString('en-US', {minimumIntegerDigits: 3, useGrouping:false})+'Z';

            if (userList != null || userList != undefined) {
                //run access control collection on provided list of users.
                return userAccessControl.userAccessControl(config, options, userList, snapshot_time_formated)
                    .then(function (result) {
                        return Promise.all(appObjectAccessControl(config, options, userList, snapshot_time_formated))
                    })
                    .then(function (resultArray) {
                        resolve(resultArray)
                    })
                    .catch(function (error) {
                        reject(error);
                    });
            } else {
                //get a list of users and run collection process.
                Promise.try(function () {
                    if (config.agent.accessControlAllUsers) {
                        return qrsCalls.qrsUserList(config);
                    } else {
                        return qrsCalls.qrsAllocatedUserList(config);
                    }
                }).then(function (userList) {
                    return userAccessControl.userAccessControl(config, options, userList, snapshot_time_formated)
                        .then(function (result) {
                            return Promise.all(appObjectAccessControl(config, options, userList, snapshot_time_formated))
                        })
                        .then(function (resultArray) {
                            resolve(resultArray)
                        })
                        .catch(function (error) {
                            reject(error);
                        });
                })
            }
        })
    },
    getParsedScriptInfo: function (config) {
        logMessage("info", "Parsing load script logs for lineage information");
        return parseScriptLogs(config.agent.loadScriptParsing.loadScriptLogPath, config.agent.loadScriptParsing.parsedScriptLogPath, [], []);
    },
    getApplicationMetadata: function (config, docList, boolDataMode) {
        return new Promise(function (resolve) {
                var session = enigma.create(enigmaInstance(config, "docList"))
                session.open()
                    .then(function (global) {
                        return Promise.map(docList, function (doc) {
                                return backupApp(config, doc.id, config.agent, boolDataMode)
                                    .then(function (result) {
                                        return result;
                                    })
                                    .catch(function (error) {
                                        logMessage("error", "Backup process failed for appid " + doc.id + " with name " + doc.name + ". " + JSON.stringify(error));
                                        return error;
                                    });
                            }, {
                                concurrency: 1
                            })
                            .then(function (resultArray) {
                                logMessage("info", "Qlik Sense Governance run against " + resultArray.length + " applications complete.");
                                logger.info("Qlik Sense Governance run against all applications complete.", loggerObject);
                                resolve(resultArray);
                            });

                    })
                    .catch(function (err) {
                        logMessage("error", "Error in Governance collection process");
                        logMessage("error", JSON.stringify(err));
                        resolve(err);
                    });
            })
            .catch(function (err) {
                logMessage("error", "Error in Governance collection process");
                logMessage("error", JSON.stringify(err));
                resolve(err);
            });
    },
    getRunOptions: function (config, options, queueInfos) {
        return new Promise(function (resolve) {
            let run_options = {
                hostname: config.engine.hostname,
                no_data: config.agent.noData,
                start_timestamp: queueInfos.times.start_time.toISOString(),
                end_time: queueInfos.times.end_time.toISOString(),
                queueId: queueInfos.queueId,
                filePath: queueInfos.filePath,
                single_app: config.agent.single_app,
                parse_loadScripts: config.agent.parseLoadScriptLogs,
                options: options
            };
            logMessage("info", "Governance collection process complete at " + queueInfos.times.end_time.toISOString());
            writeToXML("run_options", "RunOptions", run_options);
            resolve(run_options)
        })
    }
}


module.exports = harvester;

function appObjectAccessControl(config, options, userList, snapshot_time_formated) {
    var resultArray = []
    var appObjects = options.accessControl.appObjects;
    appObjects.forEach(function (appObject) {
        resultArray.push(userAccessControl.userAppObjectAccessControl(config, userList, appObject.name, snapshot_time_formated));
    })
    return resultArray;
}

//all the code for getting a new date and then 
//formatting the snapshottime.
function getSnapshotTime(){
    var snapshot_time = new Date();
    return  snapshot_time.getFullYear()+'-'
            + ("0" + (snapshot_time.getMonth() + 1)).slice(-2)+'-'
            +("0" + snapshot_time.getDate()).slice(-2)+'T'
            +snapshot_time.getHours(00).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})+':'
            +snapshot_time.getMinutes(00).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})+':'
            +snapshot_time.getSeconds(00).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})+'.'
            +snapshot_time.getMilliseconds(000).toLocaleString('en-US', {minimumIntegerDigits: 3, useGrouping:false})+'Z';
}