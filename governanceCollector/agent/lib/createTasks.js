var qrsInteract = require("qrs-interact");
var path = require("path");
var extend = require("extend");
var fs = require("fs");
var config = require("../config/config");
var logger = require("./logger");
var socketHelper = require("./socketHelper");
var _ = require("lodash");
//foo
var loggerObject = {
    jsFile: "createTasks.js"
}

function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);
}

var qrsInstance = {
    hostname: config.qrs.hostname,
    localCertPath: config.qrs.localCertPath
};

var qrs = new qrsInteract(qrsInstance);

var taskArray = []
var finalArray = [];
var finalFinalArray = [];

var packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../../install/package.json")));
var packageJsonApps = packageJson.installer.apps;

packageJsonApps.forEach(function (item) {
    taskArray.push({
        name: item.appName,
        taskName: item.taskName
    })
})


function getAppIds() {
    return new Promise(function (resolve) {
        return qrs.Get("/app")
            .then(function (result) {
                //console.log(result)
                result.body.forEach(function (item) {
                    taskArray.forEach(function (task) {
                        // console.log(item.name + "==" + task.name)
                        if (item.name == task.name) {
                            finalArray.push({
                                name: item.name,
                                id: item.id,
                                taskName: task.taskName
                            })
                        }
                    })
                })
                return;
            })
            .then(function () {
                resolve(finalArray)
            })
            .catch(function (error) {
                logMessage("error", JSON.stringify(error));
                resolve(error);
            })
    })
}

function getTasks() {
    return new Promise(function (resolve) {
        return qrs.Get("/reloadtask")
            .then(function (result) {
                resolve(result.body);
            })
            .catch(function (error) {
                logMessage("error", JSON.stringify(error));
                resolve(error);
            })
    })
}

function doTaskStuff() {
    return new Promise(function (resolve) {
            return getAppIds()
                .then(function (foo) {
                    return getTasks()
                        .then(function (bar) {
                            foo.forEach(function (item) {
                                var result = bar.filter(function (task) {
                                    return item.taskName == task.name
                                })

                                if (result.length == 0) {
                                    logMessage("info", "The task " + item.taskName + " does not exist in the repository, therefore, it will be created.");
                                    finalFinalArray.push(createTask(item))
                                } else {
                                    logMessage("info", "The task " + item.taskName + " exists in the repository, therefore, it will not be created.");
                                }
                            });
                            if (finalFinalArray.length > 0) {
                                return createTasks(finalFinalArray);
                            }
                        })
                        .then(function (tasks) {
                            resolve(true);
                        })
                        .catch(function (error) {
                            logMessage("error", JSON.stringify(error));
                            resolve(error);
                        })
                        .catch(function (error) {
                            logMessage("error", JSON.stringify(error));
                            resolve(error);
                        })
                })
                .catch(function (error) {
                    logMessage("error", JSON.stringify(error));
                    resolve(error);
                })
        })
        .catch(function (error) {
            logMessage("error", JSON.stringify(error));
            resolve(error);
        })
}


function createTask(task) {
    return new Promise(function (resolve) {
        var taskToCreate = taskTemplate(task.taskName, task.id, task.name);
        return qrs.Post("ReloadTask/create", taskToCreate, 'json')
            .then(function (taskCreateResult) {
                logMessage("info", "Task created: " + taskCreateResult.body.name + " created " + taskCreateResult.body.createdDate + " with id=" + taskCreateResult.body.id)
                resolve(true);
            })
            .catch(function (error) {
                logMessage("error", "Failed to create task: " + task.taskName + " with error: " + JSON.stringify(error));
                resolve(false);
            })
    })
}

function createTasks(taskArray) {
    return new Promise(function (resolve) {
        resolve(Promise.all(taskArray).then(function (result) {
                return result;
            })
            .catch(function (error) {
                return error;
            }));
    });
}


module.exports = doTaskStuff;


function taskTemplate(taskName, appId, appName) {
    return {
        "task": {
            "name": taskName,
            "taskType": 0,
            "enabled": true,
            "taskSessionTimeout": 1440,
            "maxRetries": 0,
            "tags": [],
            "customProperties": [],
            "app": {
                "id": appId,
                "name": appName
            },
            "isManuallyTriggered": false
        },
        "compositeEvents": [],
        "schemaEvents": []
    };
}