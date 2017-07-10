var enigmaInstance = require("./enigmaInstance")
var path = require("path");
var enigma = require("enigma.js");
var config = require("../config/config");


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
    return new Promise(function(resolve) {
        enigma.getService('qix', enigmaInstance(config))
            .then(function(qix) {
                return qix.global.createApp("qsgc-tempApp")
                    .then(function(app) {
                        return qix.global.openDoc(app.qAppId, '', '', '', false)
                            .then(function(doc) {
                                return doc.getConnections()
                                    .then(function(connList) {
                                        conns.forEach(function(item, index) {
                                            var foo = connList.filter(function(conn) {
                                                return conn.qName == item.qName;
                                            })
                                            if (foo.length == 0) {
                                                console.log(item.qName + " does not exist in the QMC. Let's create it!");
                                                createArray.push(doc.createConnection(item));
                                            } else {
                                                console.log(item.qName + " exists in the QMC, therefore, it will not be created.");
                                            }
                                        })
                                        if (createArray.length > 0) {
                                            return createNewConnections(createArray);
                                        } else {
                                            return "Data connections exist."
                                        }
                                    })
                                    .then(function(result) {
                                        console.log(result)
                                        return qix.global.deleteApp(app.qAppId);
                                    })
                                    .then(function(result) {
                                        console.log("app deleted");
                                        return;
                                    })
                                    .then(function() {
                                        resolve("Data Connections created");
                                    })
                            })
                    })
            })
            .catch(function(error) {
                console.log(error)
                resolve(error);
            })
    })
}

function createNewConnections(createArray) {
    return new Promise(function(resolve) {
        resolve(Promise.all(createArray).then(function(result) {
            return result;
        }));
    });
}

module.exports = createDataConnections;