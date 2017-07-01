var Promise = require("bluebird");
var exprFields = require('./expr-fields.js');
var writeToXML = require('./writeToXML');
var logger = require("./logger");
var socketHelper = require("./socketHelper");


var loggerObject = {
    jsFile: "app-library-dimensions.js"
}


function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);

}


var start_time;
var end_time;



function getDimensions(app, appId, options) {
    //Creating the promise for the Applications Library Dimensions
    //Root admin privileges should allow him to access to all available applications. Otherwise check your environment's security rules for the designed user.
    return new Promise(function(resolve, reject) {
        logMessage("info", "Collecting dimension metadata from app " + appId);
        var parse = !options.noData;
        app.createSessionObject({
                qDimensionListDef: {
                    qType: 'dimension',
                    qData: {
                        info: '/qDimInfos'
                    },
                    qMeta: {}
                },
                qInfo: { qId: "DimensionList", qType: "DimensionList" }
            })
            .then(function(list) {
                return list.getLayout()
                    .then(function(layout) {
                        return Promise.all(layout.qDimensionList.qItems.map(function(d) {

                                start_time = Date.now();
                                return app.getDimension(d.qInfo.qId)
                                    .then(function(dimension) {

                                        return dimension.getLinkedObjects()
                                            .then(function(dim_lnk) {
                                                logMessage("debug", "dimension linked objects: " + d.qInfo.qId + ":" + JSON.stringify(dim_lnk));
                                                return dimension.getLayout()
                                                    .then(function(dim_layout) {
                                                        var dim_data = {
                                                            linkedObjects: { dim_lnk: dim_lnk },
                                                            qInfo: dim_layout.qInfo,
                                                            qMeta: dim_layout.qMeta,
                                                            qDim: dim_layout.qDim
                                                        };
                                                        return dim_data;
                                                    })
                                                    .then(function(dim_data) {
                                                        if (parse) {
                                                            logMessage("debug", "Parsing expressions in dimensions.");
                                                            var parse_dimensions = { calculated_dimensions: [], non_calculated_dimensions: [] };

                                                            dim_data.qDim.qFieldDefs.forEach(function(dimension_expression) {
                                                                if (dimension_expression.charAt(0) == '=') {
                                                                    parse_dimensions.calculated_dimensions.push(dimension_expression);
                                                                } else {
                                                                    parse_dimensions.non_calculated_dimensions.push(dimension_expression);
                                                                }
                                                            });

                                                            return exprFields.checkForDimensionFields(parse_dimensions)
                                                                .then(function(dimensions_parsed) {
                                                                    var parsed = {
                                                                        parsedFields: { field: dimensions_parsed.dimensionFields },
                                                                        parsingErrors: dimensions_parsed.dimensionFieldsErrors.length,
                                                                        parsingErrorsDetails: { parsedFieldErrors: dimensions_parsed.dimensionFieldsErrors }
                                                                    };

                                                                    dim_data.parsedData = parsed;
                                                                    return dim_data;
                                                                });
                                                        } else {
                                                            return dim_data;
                                                        }
                                                    })
                                                    .then(function(dim_layout) {
                                                        end_time = Date.now();
                                                        return {
                                                            linkedObjects: dim_layout.linkedObjects,
                                                            dim_layout: {
                                                                qInfo: dim_layout.qInfo,
                                                                qMeta: dim_layout.qMeta,
                                                                qDim: dim_layout.qDim
                                                            },
                                                            qsLoadingTime: end_time - start_time
                                                        };
                                                    });
                                            });
                                    });
                            }))
                            .then(function(resultArray) {
                                logMessage("info", "Dimension metadata collection complete.");
                                writeToXML("libraryDimensions", "LibraryDimensions", { dimension: resultArray }, appId);
                                resolve("Checkpoint: Applications Library Dimensions are loaded");
                            });
                    })
            })
            .catch(function(error) {
                logMessage("error", "Error processing dimensions for app " + appId);
                logMessage("error", error.message);
                reject(error);
            });
    });
}

module.exports = getDimensions;