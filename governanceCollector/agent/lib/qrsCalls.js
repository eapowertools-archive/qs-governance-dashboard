var Promise = require("bluebird");
var qrsInteract = require("qrs-interact");
var reloadApp = require("./reloadApp");
var logger = require("./logger");
var socketHelper = require("./socketHelper");
var path = require("path");
var fs = require('fs');
var loggerObject = {
    jsFile: "qrsCalls.js"
}

var userSchema = JSON.parse(fs.readFileSync(path.join(__dirname, "../schemas/userSchema.json")));
var appSchema = JSON.parse(fs.readFileSync(path.join(__dirname, "../schemas/appSchema.json")));
var connectionSchema = JSON.parse(fs.readFileSync(path.join(__dirname, "../schemas/connectionSchema.json")));

function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);
}

var qrsCalls = {
    qrsAppList: function(options) {
        logMessage("info", "Gathering application list.");
        var qrsInstance = {
            hostname: options.qrs.hostname,
            localCertPath: options.qrs.localCertPath
        };

        var qrs = new qrsInteract(qrsInstance);

        return new Promise(function(resolve, reject) {
            // qrs.Get("app/full")
            //     .then(function(result) {
            //         resolve(result.body);
            //     })
            //     .catch(function(error) {
            //         reject(error);
            //     });

            qrs.Get("app/count")
                .then(function(result) {
                    var maxCount = result.body.value;
                    var i = 0;
                    var resultArray = [];

                    logMessage("info", "found " + maxCount + " apps.");
                    if (maxCount > 1000) {
                        logMessage("info", "There are more than 1000 apps in the repository.  Collecting all the app information may take a few minutes");
                    }

                    promiseWhile(function() {
                        // Condition for stopping
                        return i <= maxCount;
                    }, function() {
                        // The function to run, should return a promise
                        return new Promise(function(resolve, reject) {
                            // Arbitrary 250ms async method to simulate async process
                            setTimeout(function() {
                                qrs.Post("app/table?orderAscending=true&skip=" + i + "&sortColumn=name&take=500", appSchema, 'json')
                                    .then(function(results) {
                                        logMessage("info", "App list collection " + ((i / maxCount) * 100).toFixed(2) + "% complete.");
                                        var foo = results.body.rows;
                                        resultArray = resultArray.concat(foo);
                                        i = i + 500;
                                        resolve();
                                    });
                            }, 250);
                        });
                    }).then(function() {
                        // Notice we can chain it because it's a Promise, this will run after completion of the promiseWhile Promise!
                        logMessage("info", "app list collection complete.")
                        var finalArray = [];
                        var obj;
                        resultArray.forEach(function(item, index) {

                            obj = {
                                "id": item[0],
                                "modifiedByUserName": item[1],
                                "name": item[2],
                                "publishTime": item[3],
                                "description": item[4],
                                "fileSize": item[5],
                                "lastReloadTime": item[6],
                                "savedInProductVersion": item[7],
                                "stream": item[8],
                                "owner": item[9]
                            }
                            finalArray.push(obj);

                        })

                        resolve(finalArray);
                        // fs.writeFileSync("./usersList.json", JSON.stringify(resultArray, null, 4));
                    });


                });

        });
    },
    qrsDataConnList: function(options) {
        logMessage("info", "Gathering data connection list.");
        var qrsInstance = {
            hostname: options.qrs.hostname,
            localCertPath: options.qrs.localCertPath
        };

        var qrs = new qrsInteract(qrsInstance);

        return new Promise(function(resolve, reject) {
            // qrs.Get("dataconnection/full")
            //     .then(function(result) {
            //         resolve(result.body);
            //     })
            //     .catch(function(error) {
            //         reject(error);
            //     });

            qrs.Get("dataconnection/count")
                .then(function(result) {
                    var maxCount = result.body.value;
                    var i = 0;
                    var resultArray = [];

                    logMessage("info", "found " + maxCount + " data connections.");

                    if (maxCount > 1000) {
                        logMessage("info", "There are more than 1000 data connections in the repository.  Collecting all the data connection information may take a few minutes");
                    }

                    promiseWhile(function() {
                        // Condition for stopping
                        return i <= maxCount;
                    }, function() {
                        // The function to run, should return a promise
                        return new Promise(function(resolve, reject) {
                            // Arbitrary 250ms async method to simulate async process
                            setTimeout(function() {
                                qrs.Post("dataconnection/table?orderAscending=true&skip=" + i + "&sortColumn=name&take=500", connectionSchema, 'json')
                                    .then(function(results) {
                                        logMessage("info", "data connection list collection " + ((i / maxCount) * 100).toFixed(2) + "% complete.");

                                        var foo = results.body.rows;
                                        resultArray = resultArray.concat(foo);
                                        i = i + 500;
                                        resolve();
                                    });
                            }, 250);
                        });
                    }).then(function() {
                        // Notice we can chain it because it's a Promise, this will run after completion of the promiseWhile Promise!
                        logMessage("info", "data connection list collection complete.")
                        var finalArray = [];
                        var obj;
                        resultArray.forEach(function(item, index) {

                            obj = {
                                "id": item[0],
                                "name": item[1],
                                "connectionstring": item[2],
                                "type": item[3],
                                "modifiedDate": item[4],
                                "owner": item[5]
                            }
                            finalArray.push(obj);

                        })

                        resolve(finalArray);
                        // fs.writeFileSync("./usersList.json", JSON.stringify(resultArray, null, 4));
                    });


                });

        });
    },
    qrsUserList: function(options) {
        logMessage("info", "Gathering user list.");
        var qrsInstance = {
            hostname: options.qrs.hostname,
            localCertPath: options.qrs.localCertPath
        };

        var qrs = new qrsInteract(qrsInstance);
        var resultArray = [];
        return new Promise(function(resolve, reject) {
            // qrs.Get("user/full")
            //     .then(function(result) {
            //         resolve(result.body);
            //     })
            //     .catch(function(error) {
            //         reject(error);
            //     });

            qrs.Get("user/count")
                .then(function(result) {
                    var maxCount = result.body.value;
                    var i = 0;
                    var resultArray = [];

                    logMessage("info", "found " + maxCount + " users.");

                    if (maxCount > 1000) {
                        logMessage("info", "There are more than 1000 users in the repository.  Collecting all the user information may take a few minutes");
                    }

                    promiseWhile(function() {
                        // Condition for stopping
                        return i <= maxCount;
                    }, function() {
                        // The function to run, should return a promise
                        return new Promise(function(resolve, reject) {
                            // Arbitrary 250ms async method to simulate async process
                            setTimeout(function() {
                                qrs.Post("User/table?orderAscending=true&skip=" + i + "&sortColumn=name&take=500", userSchema, 'json')
                                    .then(function(results) {
                                        logMessage("info", "User list collection " + ((i / maxCount) * 100).toFixed(2) + "% complete.");
                                        var foo = results.body.rows;
                                        resultArray = resultArray.concat(foo);
                                        i = i + 500;
                                        resolve();
                                    });
                            }, 250);
                        });
                    }).then(function() {
                        // Notice we can chain it because it's a Promise, this will run after completion of the promiseWhile Promise!
                        logMessage("info", "User list collection complete.")
                        var finalArray = [];
                        var obj;
                        resultArray.forEach(function(item, index) {

                            obj = {
                                "id": item[0],
                                "userId": item[1],
                                "userDirectory": item[2],
                                "name": item[3],
                                "inactive": item[4],
                                "removedExternally": item[5],
                                "blacklisted": item[6],
                                "deleteProhibited": item[7],
                                "privileges": item[8],
                                "impactSecurityAccess": item[9],
                                "schemaPath": item[10],
                                "roles": item[11]
                            }
                            finalArray.push(obj);

                        })

                        resolve(finalArray);
                        // fs.writeFileSync("./usersList.json", JSON.stringify(resultArray, null, 4));
                    });


                });

        });
    },
    qrsAuditMatrix: function(options, resource) {
        logMessage("info", "Auditing the resource: " + resource);
        var qrsInstance = {
            hostname: options.qrs.hostname,
            localCertPath: options.qrs.localCertPath
        };

        var qrs = new qrsInteract(qrsInstance);

        var body = {
            "resourceType": resource,
            "resourceRef": {},
            "subjectRef": {
                "resourceFilter": ""
            },
            "actions": 383,
            "environmentAttributes": "",
            "subjectProperties": ["id", "name", "userId", "userDirectory"],
            "auditLimit": 10000,
            "outputObjectsPrivileges": 4
        };

        return new Promise(function(resolve, reject) {
            qrs.Post("systemRule/Security/audit/matrix", body, "json")
                .then(function(response) {
                    resolve(response.body);
                })
                .catch(function(error) {
                    logger.error(error.stack, loggerObject);
                    reject(error);
                })
        });
    },
    qrsGetList: function(options, path) {
        var qrsInstance = {
            hostname: options.qrs.hostname,
            localCertPath: options.qrs.localCertPath
        };

        var qrs = new qrsInteract(qrsInstance);

        return new Promise(function(resolve, reject) {
            qrs.Get(path)
                .then(function(result) {
                    resolve(result.body);
                });
        })
    },
    qrsPost: function(options, path, body) {
        var qrsInstance = {
            hostname: options.qrs.hostname,
            localCertPath: options.qrs.localCertPath
        };

        var qrs = new qrsInteract(qrsInstance);
        return new Promise(function(resolve) {
            qrs.Post(path, body, 'json')
                .then(function(result) {
                    resolve(result.body);
                });
        })
    },
    qrsAppsDataUsers: function(options) {
        return new Promise(function(resolve, reject) {
            return Promise.all([qrsCalls.qrsAppList(options), qrsCalls.qrsDataConnList(options), qrsCalls.qrsUserList(options)])
                .then(function(resultArray) {
                    resolve(resultArray);
                })
                .catch(function(error) {
                    logMessage("error", "Error gathering information from repository.");
                    logMessage("error", error.message);
                    reject(error.stack);
                });
        });
    },
    qrsReloadTask: function(options, taskname) {
        var qrsInstance = {
            hostname: options.qrs.hostname,
            localCertPath: options.qrs.localCertPath
        };

        var qrs = new qrsInteract(qrsInstance);
        return new Promise(function(resolve, reject) {
            reloadApp.reloadApp(qrs, taskname)
                .then(function(result) {
                    logMessage(result);
                    resolve(result)
                })
                .catch(function(error) {
                    logMessage("error", "Error runnnig reload task.");
                    logMessage("error", error.message);
                    reject(error.stack);
                })
        })
    }
}

module.exports = qrsCalls;


var promiseWhile = function(condition, action) {
    var resolver = Promise.defer();

    var loop = function() {
        if (!condition()) return resolver.resolve();
        return Promise.cast(action())
            .then(loop)
            .catch(resolver.reject);
    };

    process.nextTick(loop);

    return resolver.promise;
};