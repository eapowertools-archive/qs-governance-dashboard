const Promise = require("bluebird");
const qrsCalls = require("./qrsCalls");
const writeToXML = require("./writeToXML");
const logger = require("./logger");
const socketHelper = require("./socketHelper");
const path = require("path");
const dateDiff = require("./dateDiff");

const loggerObject = {
    jsFile: "refresher.js"
}


function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);
}

let start_time, end_time;

function reloadApp(config, taskname) {
    return new Promise(function (resolve, reject) {
        return qrsCalls.qrsReloadTask(config, taskname)
            .then(function (result) {
                logMessage("info", result);
                resolve(result);
            })
            .catch(function (error) {
                logMessage("error", "Error executing " + taskname);
                logMessage("error", JSON.stringify(error));
                reject(error);
            })
    });
}

module.exports = reloadApp;