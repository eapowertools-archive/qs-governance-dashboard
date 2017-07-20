var Promise = require("bluebird");
var exprFields = require('./expr-fields.js');
var writeToXML = require('./writeToXML');
var logger = require("./logger");
var socketHelper = require("./socketHelper");

var loggerObject = {
    jsFile: "app-library-measures.js"
}

function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);
}

var start_time;
var end_time;


function getMeasures(app, appId, options) {
    //Creating the promise for the Applications Library Measures
    //Root admin privileges should allow him to access to all available applications. Otherwise check your environment's security rules for the designed user.
    return new Promise(function (resolve, reject) {
        logMessage("info", "Collecting Measure metadata.")
        var parse = !options.noData;
        app.createSessionObject({
                qMeasureListDef: {
                    qType: 'measure',
                    qData: {
                        info: '/qDimInfos'
                    },
                    qMeta: {}
                },
                qInfo: {
                    qId: "MeasureList",
                    qType: "MeasureList"
                }
            })
            .then(function (list) {
                return list.getLayout()
                    .then(function (layout) {
                        return Promise.all(layout.qMeasureList.qItems.map(function (d) {
                            start_time = Date.now();
                            return app.getMeasure(d.qInfo.qId).then(function (measure) {
                                return measure.getLinkedObjects()
                                    .then(function (msr_lnk) {
                                        return measure.getLayout()
                                            .then(function (msr_layout) {
                                                var msr_data = {
                                                    linkedObjects: {
                                                        msr_lnk: msr_lnk
                                                    },
                                                    msr_layout
                                                };
                                                return msr_data;
                                            })
                                            .then(function (msr_data) {
                                                if (parse) {
                                                    return exprFields.checkForExpressionFields(msr_data.msr_layout.qMeasure.qDef)
                                                        .then(function (expression_fields) {

                                                            var parsed = {
                                                                parsedFields: {
                                                                    field: expression_fields.expressionFields
                                                                },
                                                                parsingErrors: expression_fields.expressionFieldsError.length == 0 ? 0 : 1,
                                                                parsingErrorsDetails: {
                                                                    parsedFieldErrors: [expression_fields.expressionFieldsError]
                                                                }
                                                            }

                                                            msr_data.msr_layout.parsedData = parsed;

                                                            return msr_data;
                                                        })
                                                } else {
                                                    return msr_data
                                                }
                                            })
                                            .then(function (msr_data) {
                                                end_time = Date.now();
                                                return {
                                                    linkedObjects: msr_data.linkedObjects,
                                                    msr_layout: msr_data.msr_layout,
                                                    qsLoadingTime: end_time - start_time
                                                };
                                            })
                                    });
                            });
                        }));
                    })
                    .then(function (resultArray) {
                        logMessage("debug", "Completed measure metadata collection for appid: " + appId);
                        writeToXML("libraryMeasures", "LibraryMeasures", {
                            measure: resultArray
                        }, appId);
                        resolve("Checkpoint: Applications Library Measures are loaded");
                    });

            })
            .catch(function (error) {
                logMessage("error", "Error processing measures for app " + appId);
                logMessage("error", JSON.stringify(error));
                reject(error);
            });
    });
}

module.exports = getMeasures;