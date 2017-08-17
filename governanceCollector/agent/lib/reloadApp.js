var Promise = require('bluebird');
var logger = require('./logger');
var socketHelper = require("./socketHelper");

var loggerObject = {
    jsFile: "reloadApp.js"
}

function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);
}


var reloadApp = {

    reloadApp: function (qrsInteract, taskName) {
        var currContentHash;
        return new Promise(function (resolve, reject) {
            logMessage("info", "Starting task named: " + taskName);
            var path = "/task/start/synchronous";
            path += "?name=" + taskName;
            return qrsInteract.Post(path, '', '')
                .then(function (result) {
                    logMessage("debug", JSON.stringify(result));
                    var taskId = result.body.value;
                    if (typeof result.body == 'object') {
                        logMessage("info", taskName + " started.");
                        return progressCheck(qrsInteract, taskId, 0, function (error, result) {
                            //now that we are done, let's evaluate the result
                            if (error) {
                                reject(error);
                            } else {
                                var path2 = "/executionresult";
                                path2 += "?filter=Executionid eq " + taskId;
                                return qrsInteract.Get(path2)
                                    .then(function (reloadInfo) {
                                        logMessage("info", taskName + " completed in " + reloadInfo.body[0].duration + 'milliseconds');
                                        logMessage("info", "Final Task Message: " + reloadInfo.body[0].details[0].message);
                                        resolve('Task Completed in ' + reloadInfo.body[0].duration + ' milliseconds with message ' + reloadInfo.body[0].details[0].message);
                                    })
                                    .catch(function (error) {

                                        reject(error);
                                    });
                            }
                        });
                    } else {

                        reject(result);
                    }
                })
                .catch(function (error) {

                    reject(error);
                });
        });
    }
};

function progressCheck(qrsInteract, id, step, callback) {
    //console.log(reload);
    //logMessage("info","Checking Progress of task");
    var path = "/executionresult/";
    path += "?filter=Executionid eq " + id;
    return qrsInteract.Get(path)
        .then(function(reloadProgress) {
             logMessage("debug",  JSON.stringify(reloadProgress))
            if (reloadProgress.body[0].duration > 0) {
                logMessage("debug", JSON.stringify(reloadProgress))
                return callback(null, 'Reload Complete');
            } else {
                var reloadStep = reloadProgress.body[0].details.length;
                if(reloadStep > step)
                {
                    logMessage("info", reloadStep + ": " + reloadProgress.body[0].details[reloadStep-1].message);
                }
                return progressCheck(qrsInteract, id, reloadStep, callback);
            }
        })
        .catch(function (error) {
            return callback(error);
        });
}

module.exports = reloadApp;