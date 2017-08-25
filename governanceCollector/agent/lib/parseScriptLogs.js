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
                logMessage("info", "begin parsing");
                return Promise.all(logFilesDirectoryFullPaths.map(function (filePath) {
                        logMessage("info", "Identifying files to parse in " + filePath);

                        var dirs = fs.readdirSync(filePath)

                        var files = [];
                        dirs.forEach(function (dirItem) {
                            logMessage("debug", "Checking " + dirItem);
                            if (fs.statSync(path.join(filePath, dirItem)).isDirectory()) {
                                files = files.concat(newestFileList(path.join(filePath, dirItem, "script")))
                            } else {
                                logMessage("debug", dirItem + " not considered a directory");
                            }
                        })

                        files = files.concat(newestFileList(filePath));

                        logMessage("info", files.length + " files to process")
                        // var resultArray = [];
                        // files.forEach(function (file) {
                        //     resultArray.push({
                        //         fileName: file,
                        //         fullName: path.join(filePath, file)
                        //     });
                        // })
                        // return resultArray;
                        return files;

                    }))
                    .then(function (files) {
                        //console.log(files);
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
                        //console.log("error!")
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
        // entry.block.load.fields.forEach(function(field, fieldIndex) {
        //     fieldItem = {};
        //     fieldItem.tableName = findTableNames(entry.block.prefixes);
        //     fieldItem.field = field;
        //     fieldItem.parentId = index;
        //     fieldArray.push(fieldItem);
        // })
    });

    return fieldArray;
}



function findTableNames(prefix) {
    //console.log(prefix);
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
        //console.log(loadStatement)

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

    //console.log(loadStatementArray[0])
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
    // params.forEach(function(param) {
    //     console.log(typeof param);
    // })
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
                var name = file.fileName.substring(0, 11) == "SessionApp" ? file.fileName.substring(0, 47) : file.fileName.substring(0, 36);
                writeToXML("foo", "libConnections", libConnections, name);

                writeToXML("foo", "loadStatements", loadStatements, name);
                writeToXML("table", "fields", getFieldsData, name);

                //var stuff = loadStatementArray.getUnique();
                logMessage("info", "Finishing parsing " + file.fileName)
                if (!parsedFile.parsed || (
                        parsedFile.result.filter(function (blk) {
                            return blk.blockType == 'FAILED';
                        }).length == 0 &&
                        parsedFile.result.filter(function (blk) {
                            return blk.blockType == 'UNKNOWN';
                        }).length > 0
                    )) {

                    // var strParsed = util.inspect(parsedFile, {
                    //     showHidden: false,
                    //     depth: null,
                    //     colors: false,
                    //     maxArrayLength: null
                    // });

                    // console.log('err', file.fileName);
                    logMessage("error", "An error occured parsing " + file.fileName);
                    //fs.writeFileSync(path.join(outputPath, 'err-' + file.fileName), strParsed);

                    resolve({
                        type: 'err',
                        file: file.fileName
                    });

                } else {

                    // console.log('done', file.fileName);

                    //fs.writeFileSync(path.join(outputPath, 'done-' + file.fileName), JSON.stringify(parsedFile));
                    logMessage("info", "completed parsing " + file.fileName);
                    // return Promise.resolve(arr.concat([{ type: 'done', file: file }]));
                    resolve({
                        type: "done",
                        file: file.fileName
                    });

                }
            })
            .catch(function (error) {
                logMessage("error", "Error parsing " + file.fileName);
                resolve("Error parsing " + file.fileName);
            });
    });

}