var Promise = require("bluebird");
var exprFields = require('./expr-fields.js');
var writeToXML = require('./writeToXML');
var logger = require("./logger");
var socketHelper = require("./socketHelper");

var loggerObject = {
    jsFile: "app-library-masterobjects.js"
}

function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);

}


var start_time;
var end_time;


function getLibObjects(app, appId, options) {

    return new Promise(function (resolve, reject) {
        //Creating the promise for the Applications Library Master Objects
        //Root admin privileges should allow him to access to all available applications. Otherwise check your environment's security rules for the designed user.      
        logMessage("info", "Collecting Master Library Visualization metadata from app " + appId);
        var parse = !options.noData;
        app.createSessionObject({
                qAppObjectListDef: {
                    qType: "masterobject",
                    qData: {
                        id: "/qInfo/qId"
                    }
                },
                qInfo: {
                    qId: "masterobjectList",
                    qType: "masterobjectList"
                },
                qMetaDef: {},
                qExtendsId: ''
            })
            .then(function (list) {
                return list.getLayout().then(function (layout) {
                    return Promise.all(layout.qAppObjectList.qItems.map(function (d) {
                            start_time = Date.now();
                            return app.getObject(d.qInfo.qId)
                                .then(function (obj) {
                                    return obj.getLayout()
                                        .then(function (obj_layout) {
                                            obj_layout = {
                                                qInfo: obj_layout.qInfo,
                                                qMeta: obj_layout.qMeta,
                                                qHyperCube: obj_layout.qHyperCube,
                                                title: obj_layout.title,
                                                visualization: obj_layout.visualization,
                                                subtitle: obj_layout.subtitle,
                                                footnote: obj_layout.footnote
                                            }
                                            return obj_layout;
                                        })
                                        .then(function (obj_layout) {
                                            return obj.getEffectiveProperties()
                                                .then(function (obj_eff_props) {

                                                    //setting up loading time
                                                    end_time = Date.now();

                                                    obj_eff_props = {
                                                        qInfo: obj_eff_props.qInfo,
                                                        qMetaDef: obj_eff_props.qMetaDef,
                                                        qHyperCubeDef: obj_eff_props.qHyperCubeDef
                                                    }
                                                    //Loading the master object's effective properties
                                                    var obj_props = {
                                                        obj_layout,
                                                        obj_eff_props,
                                                        qsLoadingTime: end_time - start_time
                                                    };
                                                    if (parse) {
                                                        if (obj_props.obj_eff_props.qHyperCubeDef) {
                                                            obj_props.obj_eff_props.qHyperCubeDef.qDimensions.forEach(function (dimension, index) {

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

                                                                obj_props.obj_eff_props.qHyperCubeDef.qDimensions[index].parsedData = parsed_dim;
                                                            });


                                                            obj_props.obj_eff_props.qHyperCubeDef.qMeasures.forEach(function (measure, index) {

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

                                                                obj_props.obj_eff_props.qHyperCubeDef.qMeasures[index].parsedData = parsed_msr;

                                                            });
                                                        }

                                                    }

                                                    return obj_props;
                                                })
                                                .then(function (data) {
                                                    return data;
                                                })
                                        });
                                })

                        }))
                        .then(function (resultArray) {
                            logMessage("debug", "Master Library Visualization collection complete from app " + appId);
                            writeToXML("libraryMasterObjects", "LibraryMasterObjects", {
                                masterobject: resultArray
                            }, appId);
                            resolve("Checkpoint: Applications Library Master Objects are loaded");
                        });
                });
            })
            .catch(function (error) {
                logMessage("error", "Error processing Master Library Visualizations for app " + appId);
                logMessage("error", JSON.stringify(error));
                reject(error);
            });
    });
}
module.exports = getLibObjects;