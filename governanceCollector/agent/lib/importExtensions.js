var qrsInteract = require("qrs-interact");
var path = require("path");
var extend = require("extend");
var fs = require("fs");
var _ = require("lodash");
var config = require("../config/config");
var logger = require("./logger");
var socketHelper = require("./socketHelper");

var loggerObject = {
    jsFile: "importExtensions.js"
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

var extensionPath = path.join(__dirname, "../../install/extensions/")

var files = fs.readdirSync(extensionPath);

var uploadArray = [];
var extensionArray = [];
var extensionsFolder = path.join(__dirname, "../../install/extensions");
var folder = fs.readdirSync(extensionsFolder);

folder.forEach(function (file) {
    var extensionStream = fs.createReadStream(path.join(extensionsFolder, file));
    var extensionName = file.split(".")[0];
    extensionArray.push({
        name: extensionName,
        fileStream: extensionStream
    })
})

// files.forEach(function(file) {
//     var stats = fs.statSync(path.join(extensionPath, file));
//     console.log(stats);
// })


function importExtensions() {
    return new Promise(function (resolve) {
        return qrs.Get("/extension/full")
            .then(function (result) {
                var extensionNames = result.body.map(function (item) {
                    return item.name
                });
                //console.log(extensionNames);
                extensionArray.forEach(function (item, index) {
                    var foo = extensionNames.filter(function (ext) {
                        return item.name == ext;
                    })
                    if (foo.length == 0) {
                        logMessage("info", item.name + " does not exist in the QMC. Let's import it!");
                        uploadArray.push(upload(item));
                    } else {
                        logMessage("info", item.name + " exists in the QMC, therefore, it will not be uploaded.");
                    }
                });
                if (uploadArray.length > 0) {
                    return uploadExtensions(uploadArray);
                } else {
                    logMessage("info", "No extensions to import")
                    return "No extensions to import";
                }
            })
            .then(function (uploaded) {
                resolve(true);
            })
            .catch(function (error) {
                logMessage("error", JSON.stringify(error));
                resolve(false);
            })
    })

}

function upload(extension) {
    return qrs.Post("extension/upload", extension.fileStream, 'application/zip')
        .then(function (result) {
            console.log(result);
            //return result;
            return result.body[0].name + " created " + result.body[0].createdDate + " with id=" + result.body[0].id;
        })
        .catch(function (error) {
            return "error uploading " + extension.name + " with error: " + JSON.stringify(error);
        });
}

function uploadExtensions(uploadArray) {
    return new Promise(function (resolve) {
        resolve(Promise.all(uploadArray).then(function (result) {
                return result;
            })
            .catch(function (error) {
                resolve(error);
            }));
    });
}

module.exports = importExtensions;