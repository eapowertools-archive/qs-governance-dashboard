const queue = require("queue")
const harvester = require("./harvester")
const refresher = require("./refresher");
const deleteFiles = require("./deleteFiles");
const path = require("path");
const bluebird = require("bluebird");
const logger = require("./logger");
const socketHelper = require("./socketHelper");
const winston = require("winston");
const config = require("../config/config");

var loggerObject = {
    jsFile: "userAccessControl.js"
};

function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);
}

var q = queue();
q.concurrency = 1;
q.timeout = config.queueTimeouts;
var results = [];

function queueSetUp(config, options, queueId) {
    let logQueueName = queueId;
    let d = new Date();
    let dateToUse = d.getMonth() + "_" + d.getDay() + "_" + d.getFullYear() + "_" + d.getUTCHours() + "_" + d.getUTCMinutes();
    let filePath = path.join(config.logging.logPath, config.logging.logName + "_" + dateToUse + "_" + queueId + ".log");
    logger.add(winston.transports.File, {
        name: logQueueName,
        filename: filePath,
        level: config.logging.logLevel
    });

    console.log(q.concurrency);
    if (options.boolGenMetadata) {
        q.push(function CalldeleteFiles() {
            return new Promise(function (resolve) {
                deleteFiles(config.agent.metadataPath);
                //console.log('files deleted');
                logMessage("info", "Clean up before metadata collection complete for queue id " + queueId);
                resolve('files deleted');
            })
        })
        q.push(function CallgetQrsInfos() {
            return new Promise(function (resolve, reject) {
                return harvester.getQrsInfos(config)
                    .then(function (result) {
                        logMessage("info", "Collected information from the qrs used for harvesting metadata from apps " + queueId);
                        resolve("qrsInfos complete");
                    })
                    .catch(function (error) {
                        logMessage("error", JSON.stringify(error) + " " + queueId);
                        reject(error);
                    })
            })
        })
        q.push(function CallgetApplicationMetadata() {
            return new Promise(function (resolve, reject) {
                return harvester.getApplicationMetadata(config, options.appMetadata.appArray)
                    .then(function (result) {
                        logMessage("info", "Application metadata collection complete " + queueId);
                        resolve("metadata harvest complete");
                    })
                    .catch(function (error) {
                        logMessage("error", JSON.stringify(error) + " " + queueId);
                        reject(error);
                    })
            })
        })
    }

    if (options.boolAccessControlData) {
        q.push(function CallgetUserAccessControl() {
            return new Promise(function (resolve, reject) {
                return harvester.getUserAccessControl(config, options)
                    .then(function (result) {
                        logMessage("info", "Access Control metadata collection complete" + queueId);
                        resolve("Access Control Begotten");
                    })
                    .catch(function (error) {
                        logMessage("error", JSON.stringify(error) + " " + queueId);
                        reject(error);
                    })
            })
        })
    }

    if (options.boolParseLoadScripts) {
        q.push(function CallParseLoadScripts() {
            return new Promise(function (resolve, reject) {
                return harvester.getParsedScriptInfo(config)
                    .then(function (result) {
                        logMessage("info", "Script Parsing complete" + queueId);
                        resolve("script parsing complete");
                    })
                    .catch(function (error) {
                        logMessage("error", JSON.stringify(error) + " " + queueId);
                        reject(error);
                    });
            })
        })
    }

    if (options.boolGenQVDs) {
        q.push(function CallQVDGeneration() {
            return new Promise(function (resolve, reject) {
                return refresher.reloadApp(config, "qsgc-Generate-Governance-QVDs")
                    .then(function (result) {
                        logMessage("info", "Generated QVDs for Governance Dashboarding " + queueId);
                        resolve("Generated QVDs for Governance Dashboarding")
                    })
                    .catch(function (error) {
                        logMessage("error", JSON.stringify(error) + " " + queueId);
                        reject(error);
                    })
            })
        })
    }

    if (options.boolRefreshGovernanceApp) {
        q.push(function CallrefreshGovernanceDashboard() {
            return new Promise(function (resolve, reject) {
                return refresher.reloadApp(config, "qsgc-Refresh-Governance-Dashboard")
                    .then(function (result) {
                        logMessage("info", "Governance Dashboard Refreshed " + queueId);
                        resolve("Governance Dashboard Refreshed")
                    })
                    .catch(function (error) {
                        logMessage("error", JSON.stringify(error) + " " + queueId);
                        reject(error);
                    })
            })
        })
    }

    q.on("success", function (result, job) {

        logMessage("info", job.toString().substring(9, job.toString().indexOf("(")) + "::" + result + "::" + queueId)
    })

    q.on("error", function (err, job) {
        let jobResult = job.toString().substring(9, job.toString().indexOf("("));
        logMessage("error", jobResult + " errored.  Result==" + JSON.stringify(err));
    })

    q.on("end", function (end) {
        logMessage("info", "queue " + queueId + " finished.");
        logger.remove(logQueueName);
    })
    q.start(function (foo) {
        logMessage("info", "queue " + queueId + " finished.");
        logMessage("debug", "Queue has been emptied.");
    });
}

module.exports = queueSetUp;