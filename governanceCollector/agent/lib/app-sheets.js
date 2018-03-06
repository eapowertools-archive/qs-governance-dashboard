var Promise = require("bluebird");
var exprFields = require('./expr-fields.js');
var writeToXML = require('./writeToXML');
var logger = require("./logger");
var socketHelper = require("./socketHelper");

var loggerObject = {
    jsFile: "app-sheets.js"
}

function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);
}

var x = {};

function getSheets(app, appId, options) {
    return new Promise(function (resolve, reject) {
        //Creating the promise for the Applications Sheets
        //Root admin privileges should allow him to access to all available applications. Otherwise check your environment's security rules for the designed user.      
        var sheetLayoutArray = [];
        var objectLayoutArray = [];

        logMessage("info", "Collecting application sheets and sheet objects for appId: " + appId);
        var parse = !options.noData;
        app.createSessionObject({
                qAppObjectListDef: {
                    qType: 'sheet',
                    qData: {
                        id: "/qInfo/qId"
                    }
                },
                qInfo: {
                    qId: 'sheetList',
                    qType: 'sheetList'
                },
                qMetaDef: {},
                qExtendsId: ''
            })
            .then(function (list) {
                return list.getLayout()
                    .then(function (layout) {
                        return Promise.all(layout.qAppObjectList.qItems.map(function (d) {
                                x = {};
                                return app.getObject(d.qInfo.qId)
                                    .then(function (sheet) {
                                        return getSheetLayout(sheet)
                                            .then(function (layout) {
                                                sheetLayoutArray.push(layout);
                                                return x.sheetLayout = layout;
                                            })
                                            .then(function () {
                                                return getObjectLayouts(sheet, parse)
                                                    .then(function (objectLayouts) {
                                                        objectLayoutArray.push(objectLayouts);
                                                        return x.objectLayouts = objectLayouts;
                                                    });
                                            })
                                            .then(function () {
                                                return x;
                                            })
                                            .catch(function (error) {
                                                logMessage("error", JSON.stringify(error));
                                                return error;
                                            });
                                    });
                            }))
                            .then(function (resultArray) {
                                logMessage("info", "Sheet and sheet object collection completed on appId: " + appId);
                                try {
                                    writeToXML("sheet", "Sheet", {
                                        sht_layout: sheetLayoutArray
                                    }, appId);
                                } catch (err) {
                                    logMessage("info", err + "   |   Failed on app '" + appId + "' writing sheet data xml.");
                                }
                                try {
                                    writeToXML("sheetObject", "sheetObject", {
                                        str_layout: objectLayoutArray
                                    }, appId);
                                } catch (err) {
                                    logMessage("info", err + "   |   Failed on app '" + appId + "' writing sheet object data xml.");
                                }
                                resolve("sheet export complete on appId: " + appId)
                            })
                            .catch(function (error) {
                                logMessage("error", "Error during sheet and sheet object metadata collection on appId: " + appId);
                                logMessage("error", JSON.stringify(error));
                                reject(error);
                            });
                    })
                    .catch(function (error) {
                        logMessage("error", "caught on line 89");
                        reject(error)
                    })
            })
            .catch(function (error) {
                logMessage("error", JSON.stringify(error));
                reject(error);
            })
    });
}
module.exports = getSheets;


function getSheetLayout(sheet) {
    var end_time;
    var start_time;
    return new Promise(function (resolve, reject) {
        start_time = Date.now();
        sheet.getLayout()
            .then(function (layout) {
                end_time = Date.now();
                var result = {
                    loadTime: end_time - start_time,
                    layout: layout
                };
                resolve(result);
            })
            .catch(function (error) {
                logMessage("error", JSON.stringify(error));
                reject(error);
            });
    })

}

function getObjectLayouts(sheet, parse) {
    var end_time;
    var start_time;
    return new Promise(function (resolve, reject) {
        sheet.getLayout()
            .then(function (sheetLayout) {
                return sheet.getChildInfos()
                    .then(function (childInfos) {
                        return Promise.all(childInfos.map(function (child) {

                                return sheet.getChild(child.qId)
                                    .then(function (object) {
                                        start_time = Date.now();
                                        if (object.genericType.toLowerCase() == "filterpane") {
                                            return getObjectLayouts(object, parse);
                                        }
                                        return object.getFullPropertyTree()
                                            .then(function (objectProps) {
                                                end_time = Date.now();
                                                objectProps = {
                                                    loadTime: end_time - start_time,
                                                    sheet: sheetLayout.qInfo.qId,
                                                    qInfo: objectProps.qProperty.qInfo,
                                                    showTitles: objectProps.qProperty.showTitles,
                                                    title: objectProps.qProperty.title,
                                                    visualization: objectProps.qProperty.visualization,
                                                    qHyperCubeDef: parse ? parseHypercubeDef(objectProps.qProperty.qHyperCubeDef) : {}
                                                }
                                                return objectProps;
                                            })
                                    })
                            }))
                            .then(function (objectLayouts) {
                                resolve(objectLayouts);
                            })
                            .catch(function (error) {
                                logMessage("error", JSON.stringify(error));
                                reject(error);
                            })
                    })
            })
            .catch(function (error) {
                logMessage("error", JSON.stringify(error));
                reject(error);
            });
    });
}

function parseHypercubeDef(qHyperCubeDef) {
    if (qHyperCubeDef) {
        qHyperCubeDef.qDimensions.forEach(function (dimension, index) {
            var parsed_dim = {};

            if (dimension.qLibraryId) {
                parsed_dim = {
                    parsedFields: {
                        field: []
                    },
                    parsingErrors: 1,
                    parsingErrorsDetails: {
                        parsedFieldErrors: "Library Dimension"
                    }
                }
            } else {
                if (dimension.qDef.qFieldDefs[0].charAt(0) == '=') {
                    var parsed_dimensions = exprFields.checkForDimensionFields({
                        calculated_dimensions: dimension.qDef.qFieldDefs,
                        non_calculated_dimensions: []
                    })._65;

                    parsed_dim = {
                        parsedFields: {
                            field: parsed_dimensions.dimensionFields
                        },
                        parsingErrors: parsed_dimensions.dimensionFieldsErrors.length,
                        parsingErrorsDetails: {
                            parsedFieldErrors: parsed_dimensions.dimensionFieldsErrors
                        }
                    }

                } else {
                    parsed_dim = {
                        parsedFields: {
                            field: dimension.qDef.qFieldDefs[0]
                        },
                        parsingErrors: 0,
                        parsingErrorsDetails: {
                            parsedFieldErrors: []
                        }
                    }
                }
            }

            qHyperCubeDef.qDimensions[index].parsedData = parsed_dim;
        });

        qHyperCubeDef.qMeasures.forEach(function (measure, index) {
            var parsed_msr = {};

            if (measure.qLibraryId) {
                parsed_msr = {
                    parsedFields: {
                        field: []
                    },
                    parsingErrors: 1,
                    parsingErrorsDetails: {
                        parsedFieldErrors: "Library Measure"
                    }
                }
            } else {
                var parsed_measure = exprFields.checkForExpressionFields(measure.qDef.qDef)._65;

                var parsed_msr = {
                    parsedFields: {
                        field: parsed_measure.expressionFields
                    },
                    parsingErrors: parsed_measure.expressionFieldsError.length == 0 ? 0 : 1,
                    parsingErrorsDetails: {
                        parsedFieldErrors: [parsed_measure.expressionFieldsError]
                    }
                }
            }

            qHyperCubeDef.qMeasures[index].parsedData = parsed_msr;
        });
    }
    return qHyperCubeDef;
}