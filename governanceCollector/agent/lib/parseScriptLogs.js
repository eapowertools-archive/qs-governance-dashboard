var fs = require('fs');
var path = require("path");
var util = require("util");
var main = require('../scriptParser/notEs2016/index');
var Promise = require("bluebird");
var logger = require("./logger");
var writeToXML = require("./writeToXML");
var newestFileList = require("./newestFileList");

var readdir = Promise.promisify(fs.readdir);
var readFile = Promise.promisify(fs.readFile);

var socketHelper = require("./socketHelper");

var loggerObject = {
    jsFile: "parseScriptLogs.js"
}

function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);
}

function parse(logFilesDirectoryFullPaths, outputPath, logFilesFilter, logFilesForce) {
    return new Promise(function (resolve, reject) {
        main.getParser()
            .then(function (parser) {
                logMessage("info", "Script log folder paths: " + logFilesDirectoryFullPaths);

                return Promise.all(logFilesDirectoryFullPaths.map(function (filePath) {
                        

                        logMessage("info", "Identifying files to parse in " + filePath);

                        try {
                            var dirs = fs.readdirSync(filePath);

                            return Promise.all(dirs.map(function (dirItem) {

                                if (dirItem.toLowerCase() == "script") {
                                    return newestFileList(path.join(filePath, dirItem))
                                } else if (fs.statSync(path.join(filePath, dirItem)).isDirectory() && fs.existsSync(path.join(filePath, dirItem, "script"))) {
                                    return newestFileList(path.join(filePath, dirItem, "script"))
                                } else {
                                    return []; //dirItem + " not a valid dir";
                                }
                            }))
                            .then(function (filesArray) {
                                var finalArray = [];
                                filesArray.forEach(function (arrayItem) {
                                    if (arrayItem.length > 0) {
                                        finalArray = finalArray.concat(arrayItem);
                                    }
                                })

                                return finalArray;
                            })

                        } catch (err) {
                            if (err.code === 'ENOENT') {
                                logMessage("info", "Seems that the following folder does not exist: " + filePath);
                                logMessage("info", "Continuing to next step");

                                return []; //dirItem + " not a valid dir";
                            } else {
                                logMessage("error", "Unknown file error, Logging and resuming. " + err);
                                return [];
                            }
                        }
                    }))
                    .then(function (fileArrays) {
                        var files = [];
                        fileArrays.forEach(function (arrayItem) {
                            if (arrayItem.length > 0) {
                                files = files.concat(arrayItem);
                            }
                        })

                        return Promise.all([

                            parser,

                            [].concat.apply([], files)

                        ]);
                    })
            })
            .then(function (reply) {
                var parser = reply[0];
                var files = reply[1];
                var maxCount = files.length;
                var i = 0;
                promiseWhile(function () {
                        // Condition for stopping
                        return i < maxCount;
                    }, function () {
                        // The function to run, should return a promise
                        return new Promise(function (resolve, reject) {
                            // Arbitrary 250ms async method to simulate async process
                            setTimeout(function () {
                                logMessage("info", "Processing file number " + i + ": " + files[i].fileName);
                                processFile(parser, files[i], outputPath)
                                    .then(function (result) {
                                        i += 1;
                                        resolve(result);
                                    })
                            }, 250);
                        });
                    })
                    .then(function (results) {
                        // Notice we can chain it because it's a Promise, this will run after completion of the promiseWhile Promise!
                        logMessage("info", "Parsing script log files complete");
                        resolve(results);
                    })
                    .catch(function (error) {
                        reject(error);
                    });

            })

    })
}
module.exports = parse;


function parseQlikLogFile(parser, file) {
    try {

        var parsed = parser.parse(file.fileContent);
        parsed.fileName = file.fileName;

        return parsed

    } catch (e) {

        if (e.name === 'SyntaxError') {

            return {
                fileName: file.fileName,
                parsed: false,
                message: e.message,
                expected: e.expected,
                found: e.found,
                location: e.location
            }

        } else {
            throw e;
        }
    }
}

Array.prototype.getUnique = function () {
    var u = {},
        a = [];
    for (var i = 0, l = this.length; i < l; ++i) {
        if (u.hasOwnProperty(this[i])) {
            continue;
        }
        a.push(this[i]);
        u[this[i]] = 1;
    }
    return a;
}


function getFields(parsedFile) {
    var loadStatements = parsedFile.result.filter(function (blk) {
        return blk.blockType == "LOAD";
    });

    var fieldArray = [];
    var fieldItem = {};

    loadStatements.forEach(function (entry, index) {
        fieldItem = {};
        fieldItem.tableName = findTableNames(entry.block.prefixes)
        fieldItem.parentId = index;
        fieldItem.fields = entry.block.load.fields;
        fieldArray.push(fieldItem);
    });

    return fieldArray;
}

function getLibConnectStatements(parsedFile){
    var loadStatements = parsedFile.result.filter(function (blk) {
        return blk.blockType == "UNKNOWN";
    });

    return loadStatements;
}



function findTableNames(prefix) {
    if (prefix !== undefined) {
        if (prefix.table) {
            return prefix.table.value
        }
    }
    return false;
};


function getLibConnections(parsedFile) {
    var loadStatements = parsedFile.result.filter(function (blk) {
        return blk.blockType == "LOAD";
    });

    var loadStatementArray = [];
    var loadStatementItem = {};

    loadStatements.forEach(function (loadStatement, index) {

        if (loadStatement.block.source != undefined) {
            if (loadStatement.block.source.loadBlockType == "FROM") {
                loadStatementItem = {};
                loadStatementItem.tableName = findTableNames(loadStatement.block.prefixes);
                loadStatementItem.keyLib = index;
                loadStatementItem.libRow = loadStatement.rowNumber;
                loadStatementItem.loadType = loadStatement.blockType;
                loadStatementItem.params = {
                    param: loadStatement.block.source.data.params
                };


                var from = loadStatement.block.source.data.from;
                var splitFrom = from.split("/");
                loadStatementItem.libName = splitFrom[2];
            }
            loadStatementArray.push(loadStatementItem);

        }
    });

    return loadStatementArray;
}



function getLoadStatements(parsedFile) {
    var loadStatements = parsedFile.result.filter(function (blk) {
        return blk.blockType == "LOAD";
    });
    var loadStatementArray = [];
    var loadStatementItem = {};

    loadStatements.forEach(function (loadStatement, index) {
        if (loadStatement.block.source != undefined) {
            loadStatementItem = {};
            loadStatementItem.tableName = findTableNames(loadStatement.block.prefixes);
            loadStatementItem.keyLib = index;
            loadStatementItem.sourceLoadType = loadStatement.block.source.loadBlockType;
            loadStatementItem.loadType = loadStatement.blockType;
            loadStatementItem.sourceParam = buildParamStatement(loadStatement.block.source.data.params);
            loadStatementItem.params = {
                param: loadStatement.block.source.data.params
            };
            loadStatementItem.source = loadStatement.block.source.data.from;
            loadStatementItem.sourceTable = loadStatement.block.source.data.table;
            loadStatementItem.load = loadStatement.block.load;
            loadStatementArray.push(loadStatementItem);
        }
    })
    return loadStatementArray;
}

function buildParamStatement(params) {
    if (params) {
        var foo = '[';
        params.forEach(function (param, index) {
            foo += JSON.stringify(param) + (index < params.length - 1 ? ',' : ']');
        })
        return foo;
    }
    return false;
}


var promiseWhile = function (condition, action) {
    var resolver = Promise.defer();

    var loop = function () {
        if (!condition()) return resolver.resolve();
        return Promise.cast(action())
            .then(loop)
            .catch(resolver.reject);
    };

    process.nextTick(loop);

    return resolver.promise;
};


function processFile(parser, file, outputPath) {
    return new Promise(function (resolve) {

        readFile(file.fullName, 'utf-8')
            .then(function (fileContent) {

                return {
                    fullName: file.fullName,
                    fileName: file.fileName,
                    fileContent: fileContent
                }

            })
            .then(function (file) {
                logMessage("info", "begin parsing " + file.fileName)
                var parsedFile = parseQlikLogFile(parser, file)

                //Get Load Statement Information
                var libConnections = getLibConnections(parsedFile);
                var loadStatements = getLoadStatements(parsedFile);
                var getFieldsData = getFields(parsedFile);
                var libConnectionStatements = getLibConnectStatements(parsedFile);

                var name = file.fileName.substring(0, 11) == "SessionApp" ? file.fileName.substring(0, 47) : file.fileName.substring(0, 36);
                
                writeToXML("parsedLibraryConnection", "libConnections", libConnections, name);
                writeToXML("parsedLoadStatement", "loadStatements", loadStatements, name);
                writeToXML("parsedTable", "fields", getFieldsData, name);
                writeToXML("parsedLibConnectionStatements", "libConnectStatements", libConnectionStatements, name);

                logMessage("info", "Finishing parsing " + file.fileName)
                if (!parsedFile.parsed || (
                        parsedFile.result.filter(function (blk) {
                            return blk.blockType == 'FAILED';
                        }).length == 0 &&
                        parsedFile.result.filter(function (blk) {
                            return blk.blockType == 'UNKNOWN';
                        }).length > 0
                    )) {

                    logMessage("error", "An error occured parsing " + file.fileName);

                    resolve({
                        type: 'err',
                        file: file.fileName
                    });

                } else {
                    logMessage("info", "completed parsing " + file.fileName);
                    
                    resolve({
                        type: "done",
                        file: file.fileName
                    });

                }
            })
            .catch(function (error) {
                logMessage("error", "Error parsing " + file.fileName);
                resolve("Parsed with errors " + file.fileName);
            });
    });

}