var Promise = require("bluebird");
var exprFields = require('./expr-fields.js');
var writeToXML = require('./writeToXML');
var logger = require("./logger");
var socketHelper = require("./socketHelper");

var loggerObject = {
    jsFile: "app-bookmark.js"
}

var start_time;
var end_time;

function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);
}

function getBookmarks(app, appId, options) {
    return new Promise(function (resolve, reject) {
        //Creating the promise for the Applications Bookmarks
        //Root admin privileges should allow him to access to all available applications. Otherwise check your environment's security rules for the designed user.      
        logMessage("info", "Collecting bookmark information from app " + appId);
        var parse = options.noData ? false : true;
        app.createSessionObject({
                qBookmarkListDef: {
                    qType: 'bookmark',
                    qData: {
                        info: '/qDimInfos'
                    },
                    qMeta: {}
                },
                qInfo: {
                    qId: "BookmarkList",
                    qType: "BookmarkList"
                }
            })
            .then(function (list) {
                return list.getLayout()
                    .then(function (layout) {
                        return Promise.all(layout.qBookmarkList.qItems.map(function (d) {
                            start_time = Date.now();
                            return app.getBookmark(d.qInfo.qId)
                                .then(function (bookmark) {
                                    return bookmark.getProperties()
                                        .then(function (properties) {
                                            return bookmark.getLayout()
                                                .then(function (bkmk_layout) {
                                                    end_time = Date.now();
                                                    bkmk_layout = parse ? parseBookmark(bkmk_layout) : bkmk_layout;

                                                    var bkmk_data = {
                                                        bkmk_layout,
                                                        qsLoadingTime: end_time - start_time
                                                    }

                                                    return bkmk_data;
                                                })
                                        });
                                });
                        }));
                    })
                    .then(function (resultArray) {
                        logMessage("debug", "Collected " + resultArray.length + " bookmarks from app " + appId);
                        writeToXML("libraryBookmarks", "Bookmarks", {
                            bookmark: resultArray
                        }, appId);
                        resolve("Checkpoint: Applications Bookmarks are loaded");
                    });
            })
            .catch(function (error) {
                logMessage("error", "Error processing bookmark for app " + appId);
                logMessage("error", JSON.stringify(error));
                reject(error);
            });
    });
}

module.exports = getBookmarks;

function parseBookmark(bkmk_layout) {
    bkmk_layout.qBookmark.qStateData[0].qFieldItems.forEach(function (bookmark_field_item, index) {
        //        console.log(bookmark_field_item.qDef.qName);
        logMessage("debug", "Parsing bookmark: " + bookmark_field_item.qDef.qName);
        if (bookmark_field_item.qDef.qName.charAt(0) == '=') {
            //            console.log("This is an expression, time to parse it");
            var parsed_expression = exprFields.checkForExpressionFields(bookmark_field_item.qDef.qName)._65;

            var parsed_bkm = {
                parsedFields: {
                    field: parsed_expression.expressionFields
                },
                parsingErrors: parsed_expression.expressionFieldsError.length == 0 ? 0 : 1,
                parsingErrorsDetails: {
                    parsedFieldErrors: [parsed_expression.expressionFieldsError]
                }
            }

            bkmk_layout.qBookmark.qStateData[0].qFieldItems[index].parsedData = parsed_bkm;

        } else {
            //            console.log("This is not an expression, store the field as is");

            var parsed_bkm = {
                parsedFields: {
                    field: bookmark_field_item.qDef.qName
                },
                parsingErrors: 0,
                parsingErrorsDetails: {
                    parsedFieldErrors: []
                }
            }

            bkmk_layout.qBookmark.qStateData[0].qFieldItems[index].parsedData = parsed_bkm;
        }
    });

    return bkmk_layout;

}