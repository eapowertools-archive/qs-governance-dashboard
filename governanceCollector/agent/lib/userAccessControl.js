var Promise = require("bluebird");
var qrsCalls = require("./qrsCalls");
var writeToXML = require("./writeToXML");
var logger = require("./logger");
var socketHelper = require("./socketHelper");
var fs = require("fs");
var path = require("path");

var loggerObject = {
    jsFile: "userAccessControl.js"
};

function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);
}

var userAccessControl = {
    userAppObjectAccessControl: function (config, userList, objectType) {
        return new Promise(function (resolve, reject) {
            logMessage("info", "Obtaining access control information on " + objectType + " from the repository");
            var userCount = userList.length;
            return qrsCalls.qrsAuditCountResources(config, "App.Object", "objecttype eq '" + objectType + "'")
                .then(function (count) {
                    logMessage("info", "Found " + count + " object of type " + objectType);
                    return Promise.map(userList, function (userInfo, index, length) {
                            logMessage("info", "Processing user " + index + " of " + length + " " + objectType + "s.  User is " + userInfo.userDirectory + "\\" + userInfo.userId);
                            var auditObject = createAuditObject("App.Object", count, userInfo.id, objectType);
                            return qrsCalls.qrsAuditMatrix(config, auditObject)
                                .then(function (result) {
                                    result.matrix.forEach(function (item, index) {

                                        result.matrix[index].name = result.resources[result.matrix[index].resourceId].resourceProperties.name;
                                        result.matrix[index].engineObjectId = result.resources[result.matrix[index].resourceId].resourceProperties.engineobjectid;
                                        result.matrix[index].objectType = result.resources[result.matrix[index].resourceId].resourceProperties.objecttype;
                                        result.matrix[index].userId = result.subjects[result.matrix[index].subjectId].subjectProperties.userid;
                                        result.matrix[index].userDirectory = result.subjects[result.matrix[index].subjectId].subjectProperties.userdirectory;
                                        result.matrix[index].audit.access = convertActionBin(item.audit.access);
                                        result.matrix[index].audit.disabled = convertActionBin(item.audit.disabled);
                                    });
                                    return result;
                                })
                                .then(function (result) {
                                    //fs.writeFileSync(path.join(config.agent.metadataPath,"userAccess","testResult_" + userInfo.id + ".json"), JSON.stringify(result));
                                    //console.log(result.matrix.length)
                                    writeToXML("qrsAccessControlMatrix", "AppObject", result.matrix, userInfo.id + "_" + objectType, undefined, "userAccess");
                                    return result;
                                })
                                .catch(function (error) {
                                    logMessage("error", error);
                                    return error;
                                });
                        }, {
                            concurrency: 5
                        })
                        .then(function (resultArray) {
                            resolve("yay!");
                        })
                        .catch(function (error) {
                            logMessage("error", error)
                            resolve("resolved with errors");
                        })
                })
        })
    },
    userAccessControl: function (config, userList) {
        return new Promise(function (resolve, reject) {
            var selectionBasis = list(userList);
            logMessage("info", "Obtaining access control information from the repository");
            return Promise.all(selectionBasis.map(function (listItem) {
                    return qrsCalls.qrsPost(config, "selection", listItem)
                        .then(function (selection) {
                            return selection.id;
                        })
                }))
                .then(function (resultArray) {
                    return Promise.all(resources.map(function (resource) {
                        var resourceTable = createTable(resource.resourceRef);
                        console.log(resource.resourceRef);
                        return qrsCalls.qrsPost(config, resource.resourcePath + "/table", resourceTable)
                            .then(function (table) {
                                console.log(table.rows.length);
                                return table.rows;
                            })
                            .then(function (tableRows) {
                                return Promise.map(resultArray, function (selectionItem) {
                                    return qrsCalls.qrsAuditMatrix(config, resource.resourceRef, selectionItem)
                                        .then(function (result) {
                                            console.log(result.matrix.length);
                                            result.matrix.forEach(function (item, index) {
                                                var matchedObject = tableRows.find(findRowMatch, [result.matrix[index].resourceId]);

                                                result.matrix[index].name = matchedObject[1];
                                                result.matrix[index].engineObjectId = matchedObject[2];
                                                result.matrix[index].objectType = matchedObject[3];
                                                result.matrix[index].audit.access = convertActionBin(item.audit.access);
                                                result.matrix[index].audit.disabled = convertActionBin(item.audit.disabled);
                                            });
                                            return result;
                                        })
                                        .then(function (result) {
                                            //fs.writeFileSync(path.join(config.agent.metadataPath,"userAccess","testResult_" + selectionItem + ".json"), JSON.stringify(result));
                                            console.log(result.matrix.length)
                                            writeToXML("qrsAccessControlMatrix", resource.resourceRef, result, selectionItem, undefined, "userAccess");
                                            return result;
                                        });
                                }, {
                                    concurrency: 2
                                })
                            })
                            .then(function (resultarray) {
                                return resultArray;
                            });
                    }))
                })
                .then(function (resultArray) {
                    console.log("hello world");
                    //writeToXML("qrsAccessControlMatrix", "qrsAccessControlMatrix", resultArray);
                    resolve("Access Control Information Obtained");
                })
                .catch(function (error) {
                    reject(error);
                });
        });
    }
}

module.exports = userAccessControl;

function convertActionBin(val) {
    var strArray = ["Create", "Read", "Update", "Delete", "Export", "Publish",
        "Change owner", "Change role", "Export data"
    ];

    var resultArray = [];
    for (var i = 0; i < strArray.length; i++) {
        if ((val & (1 << i)) == Math.pow(2, i)) {
            resultArray.push(strArray[i])
        }
    }
    return resultArray;
}


var resources = [{
        resourceRef: "App",
        resourcePath: "app"
    },
    {
        resourceRef: "DataConnection",
        resourcePath: "dataconnection"
    },
    {
        resourceRef: "ContentLibrary",
        resourcePath: "contentlibrary"
    },
    {
        resourceRef: "Stream",
        resourcePath: "stream"
    }
];


function createTable(resource) {
    var tableDef = {
        entity: resource,
        columns: [{
                name: "resourceId",
                columnType: "Property",
                definition: "id"
            },
            {
                name: "resourceName",
                columnType: "Property",
                definition: "name"
            },
            {
                name: "objectId",
                columnType: "Property",
                definition: "engineObjectId"
            },
            {
                name: "objectType",
                columnType: "Property",
                definition: "objectType"
            }
        ]
    };
    return tableDef;
}

function findRowMatch(row) {

    if (row[0] === this[0]) {
        return row;
    }
}

function list(userList) {
    var maxCount = userList.length;
    var i, j = 0;
    var every1kArray = [];
    var mainArray = [];
    for (i = 0; i <= userList.length - 1; i++) {
        j++;
        if (j == 100 || i == userList.length - 1) {
            mainArray.push({
                "items": every1kArray
            });
            every1kArray = [];
            j = 0;
        } else {
            let object = {
                "type": "user",
                "objectID": userList[i].id
            };
            every1kArray.push(object);

        }
    }
    return mainArray;
}

function createAuditObject(type, count, id, objectType) {
    var auditObject = {
        "resourceType": type,
        "resourceRefFilter": {
            "resourceFilter": "objectType eq '" + objectType + "'"
        },
        "subjectRefFilter": {
            "resourceFilter": "id eq " + id
        },
        "auditLimit": count
    }
    return auditObject;
}