const queue = require("queue")
const harvester = require("./harvester")
const refresher = require("./refresher");
const deleteFiles = require("./deleteFiles");
const path = require("path");
const bluebird = require("bluebird");
const logger = require("./logger");
const socketHelper = require("./socketHelper");
const winston = require("winston");

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
q.timeout = 60 * 1000 * 60;
var results = [];

function queueSetUp(config, options) {
    let logQueueName = "newQueue";
    let d = new Date();
    let dateToUse = d.getMonth() + "_" + d.getDay() + "_" + d.getFullYear() + "_" + d.getUTCHours() + "_" + d.getUTCMinutes();
    let filePath = path.join(config.logging.logPath, config.logging.logName + "_" + dateToUse + ".log");
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
                resolve('files deleted');
            })
        })
        q.push(function CallgetQrsInfos() {
            return new Promise(function (resolve, reject) {
                return harvester.getQrsInfos(config)
                    .then(function (result) {
                        resolve("qrsInfos complete");
                    })
                    .catch(function (error) {
                        console.log(error)
                        reject(error);
                    })
            })
        })
        q.push(function CallgetApplicationMetadata() {
            return new Promise(function (resolve, reject) {
                return harvester.getApplicationMetadata(config, options.appMetadata.appArray)
                    .then(function (result) {
                        resolve("metadata harvest complete");
                    })
                    .catch(function (error) {
                        console.log(error);
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
                        resolve("Access Control Begotten");
                    })
                    .catch(function (error) {
                        console.log(error);
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
                        console.log("script parsing complete");
                        resolve("script parsing complete");
                    })
                    .catch(function (error) {
                        console.log(error)
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
                        console.log("Generated QVDs for Governance Dashboarding")
                        resolve("Generated QVDs for Governance Dashboarding")
                    })
                    .catch(function (error) {
                        console.log(error);
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
                        console.log("Governance Dashboard Refreshed")
                        resolve("Governance Dashboard Refreshed")
                    })
                    .catch(function (error) {
                        console.log(error);
                        reject(error);
                    })
            })
        })
    }

    console.log(q.length);
    q.on("success", function (result, job) {
        console.log("The result is:");
        console.log(job.toString().substring(9, job.toString().indexOf("(")));
        console.log(result)
    })

    q.on("error", function (err, job) {
        let jobResult = job.toString().substring(9, job.toString().indexOf("("));
        logMessage("error", jobResult + " errored.  Result==" + JSON.stringify(err));
    })

    q.on("end", function (end) {
        logger.remove(logQueueName);
    })
    q.start(function (foo) {
        logMessage("debug", "Queue has been emptied.");
    });
}

module.exports = queueSetUp;