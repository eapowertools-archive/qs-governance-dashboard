var qrsInteract = require("qrs-interact");
var path = require("path");
var extend = require("extend");
var fs = require("fs");
var config = require("../config/config");

var qrsInstance = {
    hostname: config.qrs.hostname,
    localCertPath: config.qrs.localCertPath
};

var qrs = new qrsInteract(qrsInstance);


var uploadArray = [];
var finalArray = [];
var appsFolder = path.join(__dirname, "../Installer/apps");
var folder = fs.readdirSync(appsFolder);

var packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../installer/package.json")));
var packageJsonApps = packageJson.installer.apps;


folder.forEach(function(file) {
    var appStream = fs.createReadStream(path.join(appsFolder, file));
    var appName = file.split(".")[0];
    var appInfo = packageJsonApps.filter(function(item) {
        return item.appName.toLowerCase() == appName.toLowerCase();
    });

    uploadArray.push({
        appName: appName,
        taskName: appInfo[0].taskName,
        fileStream: appStream
    });
})

function importApps() {
    return new Promise(function(resolve) {
        return qrs.Get("/app/full")
            .then(function(result) {
                var appNames = result.body.map(function(item) {
                    return item.name;
                });

                uploadArray.forEach(function(item, index) {
                    var foo = appNames.filter(function(app) {
                        return item.appName == app;
                    });
                    if (foo.length == 0) {
                        console.log(item.appName + " does not exist in the QMC. Let's upload it!");
                        finalArray.push(upload(item));
                    } else {
                        console.log(item.appName + " exists in the QMC, therefore, it will not be uploaded.");
                    }
                });
                if (finalArray.length > 0) {
                    resolve(uploadApps(finalArray));
                } else {
                    resolve("No apps to upload");
                }

            })
    })
}

function upload(app) {
    return new Promise(function(resolve) {
        return qrs.Post("app/upload?name=" + app.appName, app.fileStream, 'application/vnd.qlik.sense.app')
            .then(function(result) {
                console.log(result);
                //create a task to go along with the app.
                return qrs.Post("ReloadTask/create", taskTemplate(app.taskName, result.body.id, result.body.name), 'json')
                    .then(function(taskCreateResult) {
                        resolve(result.body.name + " created " + result.body.createdDate + " with id=" + result.body.id);
                    })
            })
            .catch(function(error) {
                resolve(error);
                //                return "error uploading " + appName + " with error: " + error;
            });
    })

}

function uploadApps(uploadArray) {
    return new Promise(function(resolve) {
        resolve(Promise.all(uploadArray).then(function(result) {
            return result;
        }));
    });
}


module.exports = importApps;


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