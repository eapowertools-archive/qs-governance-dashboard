var enigmaInstance = require("./enigmaInstance")
var path = require("path");
var enigma = require("enigma.js");
var config = require("../config/config");
var logger = require("./logger");
var socketHelper = require("./socketHelper");
var enigma = require('enigma.js');
var enigmaInstance = require("./enigmaInstance");

var loggerObject = {
    jsFile: "createDataConnections.js"
}

function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);
}

var connMetadata = {
    qName: "qsgc-metadata",
    qConnectionString: config.agent.metadataPath,
    qType: "folder",
    qMeta: {
        qName: "qsgc-metadata"
    }
}

var connQVDs = {
    qName: "qsgc-qvds",
    qConnectionString: config.agent.qvdOutputPath,
    qType: "folder",
    qMeta: {
        qName: "qsgc-qvds"
    }
}

var conns = [connMetadata, connQVDs]

var createArray = [];

function createDataConnections() {
    return new Promise(function (resolve) {
        var session = enigma.create(enigmaInstance(config, "dataConn"));
        session.open()
            .then(function (global) {
                return global.createApp("qsgc-tempApp")
                    .then(function (app) {
                        return global.openDoc(app.qAppId, '', '', '', false)
                            .then(function (doc) {
                                return doc.getConnections()
                                    .then(function (connList) {
                                        conns.forEach(function (item, index) {
                                            var foo = connList.filter(function (conn) {
                                                return conn.qName == item.qName;
                                            })
                                            if (foo.length == 0) {
                                                logMessage("info", item.qName + " does not exist in the QMC. Let's create it!");
                                                createArray.push(doc.createConnection(item));
                                            } else {
                                                logMessage("info", item.qName + " exists in the QMC, therefore, it will not be created.");
                                            }
                                        })
                                        if (createArray.length > 0) {
                                            return createNewConnections(createArray);
                                        } else {
                                            return "Data connections exist."
                                        }
                                    })
                                    .then(function (result) {
                                        logMessage("info", result)
                                        return global.deleteApp(app.qAppId);
                                    })
                                    .then(function (result) {
                                        logMessage("info", "app deleted");
                                        return;
                                    })
                                    .then(function () {
                                        return session.close()
                                            .then(function () {
                                                logMessage("info", "Data connections created.");
                                                resolve(true);
                                            })
                                    })
                            })
                    })
            })
            .catch(function (error) {
                return session.close()
                    .then(function () {
                        logMessage("error", JSON.stringify(error));
                        resolve(false);
                    })
            })
    })
}

function createNewConnections(createArray) {
    return new Promise(function (resolve) {
        resolve(Promise.all(createArray).then(function (result) {
            return result;
        }));
    });
}

module.exports = createDataConnections;