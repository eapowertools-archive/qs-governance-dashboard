var Promise = require("bluebird");
var qrsCalls = require("./qrsCalls");
var writeToXML = require("./writeToXML");
var logger = require("./logger");
var socketHelper = require("./socketHelper");

var loggerObject = {
    jsFile: "userAccessControl.js"
};

function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);
}

function userAccessControl(config) {
    return new Promise(function(resolve, reject) {
        logMessage("info", "Obtaining access control information from the repository");

        return Promise.all(resources.map(function(resource) {
                var resourceTable = createTable(resource.resourceRef);
                return qrsCalls.qrsPost(config, resource.resourcePath + "/table", resourceTable)
                    .then(function(table) {
                        return table.rows;
                    })
                    .then(function(tableRows) {
                        return qrsCalls.qrsAuditMatrix(config, resource.resourceRef)
                            .then(function(result) {
                                result.matrix.forEach(function(item, index) {
                                    var matchedObject = tableRows.find(findRowMatch, [result.matrix[index].resourceId]);

                                    result.matrix[index].engineObjectId = matchedObject[1];
                                    result.matrix[index].objectType = matchedObject[2];
                                    result.matrix[index].audit.access = convertActionBin(item.audit.access);
                                });
                                return result;
                            });
                    })
                    .then(function(result) {
                        var foo = {};
                        foo[resource.resourceRef] = result.matrix;

                        return foo;
                    });
            }))
            .then(function(resultArray) {
                writeToXML("qrsAccessControlMatrix", "qrsAccessControlMatrix", resultArray);
                resolve("Access Control Information Obtained");
            })
            .catch(function(error) {
                reject(error);
            });
    });
}

module.exports = userAccessControl;





function convertActionBin(val) {
    var x = parseInt(val, 10);
    var bin = x.toString(2);
    var binArray = bin.split("");
    var strArray = ["Create", "Read", "Update", "Delete", "Export", "Publish",
        "Change owner", "Change role", "Export data"
    ];
    var resultArray = [];
    for (var i = 0; i < binArray.length; i++) {
        binArray[i] === "1" ? resultArray.push(strArray[i]) : false;
    }
    return resultArray;
}

var resources = [
    { resourceRef: "App", resourcePath: "app" },
    { resourceRef: "App.Object", resourcePath: "app/object" },
    { resourceRef: "DataConnection", resourcePath: "dataconnection" },
    { resourceRef: "ContentLibrary", resourcePath: "contentlibrary" },
    { resourceRef: "Stream", resourcePath: "stream" }
];

function createTable(resource) {
    var tableDef = {
        entity: resource,
        columns: [
            { name: "resourceId", columnType: "Property", definition: "id" },
            { name: "objectId", columnType: "Property", definition: "engineObjectId" },
            { name: "objectType", columnType: "Property", definition: "objectType" }
        ]
    };
    return tableDef;
}

function findRowMatch(row) {

    if (row[0] === this[0]) {
        return row;
    }
}